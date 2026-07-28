import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Account from '../models/account.model.js';
import Category from '../models/category.model.js';
import Transaction from '../models/transaction.model.js';
import * as accountRepository from '../repositories/account.repository.js';
import * as categoryRepository from '../repositories/category.repository.js';
import * as transactionRepository from '../repositories/transaction.repository.js';

let mongod: MongoMemoryServer;
const userId = new mongoose.Types.ObjectId();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Promise.all([Account.deleteMany({}), Category.deleteMany({}), Transaction.deleteMany({})]);
});

describe('softDelete plugin', () => {
  it('marks the document deleted instead of removing it, and hides it from reads', async () => {
    const account = await Account.create({ userId, name: 'Checking', type: 'checking', currency: 'USD', startingBalance: 0 });

    const deleted = await accountRepository.deleteById(userId, account._id);
    expect(deleted).not.toBeNull();

    expect(await accountRepository.findById(userId, account._id)).toBeNull();
    expect(await Account.findOne({ _id: account._id })).toBeNull();

    // Explicit isDeleted filter opts out of the plugin's auto-exclusion, so
    // this is how a test (or an admin/audit tool) confirms the row is still
    // physically present rather than gone.
    const raw = await Account.findOne({ _id: account._id, isDeleted: true });
    expect(raw).not.toBeNull();
    expect(raw!.isDeleted).toBe(true);
    expect(raw!.deletedAt).not.toBeNull();
  });

  it('excludes soft-deleted documents from aggregation pipelines', async () => {
    const accountId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();

    const kept = await transactionRepository.create({ userId, accountId, categoryId, type: 'income', amount: 100, settled: true });
    const removed = await transactionRepository.create({ userId, accountId, categoryId, type: 'income', amount: 50, settled: true });

    await transactionRepository.deleteById(userId, removed._id);

    const balance = await transactionRepository.aggregateAccountBalance(userId, accountId);
    expect(balance!.incomeSettled).toBe(100);

    expect(await Transaction.findOne({ _id: kept._id })).not.toBeNull();
  });

  it('does not count a soft-deleted category toward the per-user name/type uniqueness constraint', async () => {
    const created = await Category.create({ userId, name: 'Groceries', type: 'expense' });

    await categoryRepository.deleteById(userId, created._id);

    // Would throw E11000 against the old (non-partial) unique index, since
    // the deleted doc would still occupy the {userId, name, type} slot.
    const recreated = await Category.create({ userId, name: 'Groceries', type: 'expense' });
    expect(recreated).not.toBeNull();
  });
});
