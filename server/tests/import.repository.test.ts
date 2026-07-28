import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as importRepository from '../repositories/import.repository.js';
import * as transactionRepository from '../repositories/transaction.repository.js';
import Import from '../models/import.model.js';
import Transaction from '../models/transaction.model.js';

let mongod: MongoMemoryServer;
const userId = new mongoose.Types.ObjectId();
const accountId = new mongoose.Types.ObjectId();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Promise.all([Import.deleteMany({}), Transaction.deleteMany({})]);
});

const createImportDoc = (overrides: Record<string, unknown> = {}) =>
  Import.create({
    userId, accountId, fileName: 'a.csv', importIdToken: `token-${Math.random()}`,
    status: 'completed', rowCount: 1, importedCount: 1, skippedCount: 0,
    ...overrides,
  });

describe('import.repository', () => {
  it('findById / deleteById are scoped to the owning user', async () => {
    const created = await createImportDoc();
    const otherUser = new mongoose.Types.ObjectId();

    expect(await importRepository.findById(otherUser, created._id)).toBeNull();
    expect(await importRepository.findById(userId, created._id)).not.toBeNull();

    expect(await importRepository.deleteById(otherUser, created._id)).toBeNull();
    expect(await importRepository.deleteById(userId, created._id)).not.toBeNull();
    expect(await Import.countDocuments()).toBe(0);
  });

  it('findByUser returns only that user\'s imports, newest first', async () => {
    const otherUser = new mongoose.Types.ObjectId();
    await createImportDoc({ fileName: 'first.csv' });
    await createImportDoc({ fileName: 'second.csv' });
    await createImportDoc({ userId: otherUser, fileName: 'not-mine.csv' });

    const result = await importRepository.findByUser(userId);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.fileName)).toEqual(['second.csv', 'first.csv']);
  });
});

describe('transaction.repository (import-related)', () => {
  const createTx = (importId: mongoose.Types.ObjectId, overrides: Record<string, unknown> = {}) =>
    Transaction.create({
      userId, accountId, importId, type: 'expense', amount: 10, categoryId: null, ...overrides,
    });

  it('findByImport / deleteByImport are scoped to the owning user', async () => {
    const importId = new mongoose.Types.ObjectId();
    const otherUser = new mongoose.Types.ObjectId();
    await createTx(importId);
    await createTx(importId, { userId: otherUser });

    expect(await transactionRepository.findByImport(userId, importId)).toHaveLength(1);
    expect(await transactionRepository.findByImport(otherUser, importId)).toHaveLength(1);

    await transactionRepository.deleteByImport(userId, importId);
    expect(await Transaction.countDocuments({ importId })).toBe(1);
  });

  it('bulkUpdateCategories only updates transactions matching user, import and id', async () => {
    const importId = new mongoose.Types.ObjectId();
    const otherUser = new mongoose.Types.ObjectId();
    const mine = await createTx(importId);
    const notMine = await createTx(importId, { userId: otherUser });
    const categoryId = new mongoose.Types.ObjectId();

    await transactionRepository.bulkUpdateCategories(userId, importId, [
      { transactionId: mine._id, categoryId },
      { transactionId: notMine._id, categoryId },
    ]);

    expect((await Transaction.findById(mine._id))!.categoryId!.toString()).toBe(categoryId.toString());
    expect((await Transaction.findById(notMine._id))!.categoryId).toBeNull();
  });
});
