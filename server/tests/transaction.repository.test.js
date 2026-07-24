import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as transactionRepository from '../repositories/transaction.repository.js';
import Transaction from '../models/transaction.model.js';
// findById/findPaginated/findRecent populate("categoryId accountId"), which
// needs these schemas registered on the connection even though the test
// itself never touches them directly.
import '../models/account.model.js';
import '../models/category.model.js';

let mongod;
const userId = new mongoose.Types.ObjectId();
const accountId = new mongoose.Types.ObjectId();
const categoryId = new mongoose.Types.ObjectId();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Transaction.deleteMany({});
});

describe('transaction.repository', () => {
  describe('create / findById', () => {
    it('creates a transaction and finds it scoped to its owner', async () => {
      const created = await transactionRepository.create({
        userId, accountId, categoryId, type: 'expense', amount: 10,
      });

      const found = await transactionRepository.findById(userId, created._id);
      expect(found.amount).toBe(10);

      const otherUser = new mongoose.Types.ObjectId();
      expect(await transactionRepository.findById(otherUser, created._id)).toBeNull();
    });
  });

  describe('toggleSettledById', () => {
    it('flips settled atomically without a read-then-write round trip', async () => {
      const created = await transactionRepository.create({
        userId, accountId, categoryId, type: 'expense', amount: 10, settled: false,
      });

      const first = await transactionRepository.toggleSettledById(userId, created._id);
      expect(first.settled).toBe(true);

      const second = await transactionRepository.toggleSettledById(userId, created._id);
      expect(second.settled).toBe(false);
    });

    it('returns null for a transaction that does not belong to the user', async () => {
      const created = await transactionRepository.create({
        userId, accountId, categoryId, type: 'expense', amount: 10,
      });

      const otherUser = new mongoose.Types.ObjectId();
      expect(await transactionRepository.toggleSettledById(otherUser, created._id)).toBeNull();
    });
  });

  describe('updateById / deleteById', () => {
    it('updates only a transaction scoped to the given user', async () => {
      const created = await transactionRepository.create({
        userId, accountId, categoryId, type: 'expense', amount: 10,
      });

      const updated = await transactionRepository.updateById(userId, created._id, { amount: 25 });
      expect(updated.amount).toBe(25);
    });

    it('deletes only a transaction scoped to the given user', async () => {
      const created = await transactionRepository.create({
        userId, accountId, categoryId, type: 'expense', amount: 10,
      });

      const otherUser = new mongoose.Types.ObjectId();
      expect(await transactionRepository.deleteById(otherUser, created._id)).toBeNull();
      expect(await transactionRepository.deleteById(userId, created._id)).not.toBeNull();
      expect(await Transaction.countDocuments()).toBe(0);
    });
  });

  describe('findPaginated / count', () => {
    it('paginates results sorted by date descending', async () => {
      await transactionRepository.createMany([
        { userId, accountId, categoryId, type: 'expense', amount: 1, date: new Date('2026-01-01') },
        { userId, accountId, categoryId, type: 'expense', amount: 2, date: new Date('2026-01-02') },
        { userId, accountId, categoryId, type: 'expense', amount: 3, date: new Date('2026-01-03') },
      ]);

      const page1 = await transactionRepository.findPaginated(userId, {}, { skip: 0, limit: 2 });
      expect(page1.map((t) => t.amount)).toEqual([3, 2]);

      const page2 = await transactionRepository.findPaginated(userId, {}, { skip: 2, limit: 2 });
      expect(page2.map((t) => t.amount)).toEqual([1]);

      expect(await transactionRepository.count(userId, {})).toBe(3);
    });

    it('applies an additional filter such as type', async () => {
      await transactionRepository.createMany([
        { userId, accountId, categoryId, type: 'income', amount: 1 },
        { userId, accountId, categoryId, type: 'expense', amount: 2 },
      ]);

      expect(await transactionRepository.count(userId, { type: 'income' })).toBe(1);
    });
  });

  describe('findRecent', () => {
    it('returns the most recent transactions up to the given limit', async () => {
      await transactionRepository.createMany([
        { userId, accountId, categoryId, type: 'expense', amount: 1, date: new Date('2026-01-01') },
        { userId, accountId, categoryId, type: 'expense', amount: 2, date: new Date('2026-01-02') },
        { userId, accountId, categoryId, type: 'expense', amount: 3, date: new Date('2026-01-03') },
      ]);

      const recent = await transactionRepository.findRecent(userId, 2);
      expect(recent.map((t) => t.amount)).toEqual([3, 2]);
    });
  });
});
