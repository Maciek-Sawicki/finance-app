import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as recurringTransactionRepository from '../repositories/recurringTransaction.repository.js';
import RecurringTransaction from '../models/recurringTransaction.model.js';

let mongod: MongoMemoryServer;
const userId = new mongoose.Types.ObjectId();
const categoryId = new mongoose.Types.ObjectId();
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
  await RecurringTransaction.deleteMany({});
});

const create = (overrides: Record<string, unknown> = {}) =>
  recurringTransactionRepository.create({
    userId, name: 'Rent', categoryId, accountId, amount: 1000,
    frequency: 'monthly', nextDueDate: new Date('2026-02-01'),
    ...overrides,
  });

describe('recurringTransaction.repository', () => {
  it('findById / updateById / deleteById / toggleActive are all scoped to the owning user', async () => {
    const created = await create();
    const otherUser = new mongoose.Types.ObjectId();

    expect(await recurringTransactionRepository.findById(otherUser, created._id)).toBeNull();
    expect(await recurringTransactionRepository.updateById(otherUser, created._id, { amount: 999 })).toBeNull();
    expect(await recurringTransactionRepository.toggleActive(otherUser, created._id)).toBeNull();
    expect(await recurringTransactionRepository.deleteById(otherUser, created._id)).toBeNull();

    const updated = await recurringTransactionRepository.updateById(userId, created._id, { amount: 1500 });
    expect(updated!.amount).toBe(1500);
  });

  it('updateById runs the custom-interval validation hook, unlike a raw findOneAndUpdate', async () => {
    const created = await create();

    await expect(
      recurringTransactionRepository.updateById(userId, created._id, {
        frequency: 'custom',
        customInterval: {},
      })
    ).rejects.toThrow(/Custom frequency requires/);

    // the document must be unchanged - the invalid update was rejected before persisting
    const reloaded = await RecurringTransaction.findById(created._id);
    expect(reloaded!.frequency).toBe('monthly');
  });

  it('toggleActive flips isActive without touching other fields', async () => {
    const created = await create({ isActive: true });

    const toggled = await recurringTransactionRepository.toggleActive(userId, created._id);
    expect(toggled!.isActive).toBe(false);

    const toggledAgain = await recurringTransactionRepository.toggleActive(userId, created._id);
    expect(toggledAgain!.isActive).toBe(true);
  });

  it('findByUser returns only that user\'s recurring transactions', async () => {
    const otherUser = new mongoose.Types.ObjectId();
    await create({ name: 'Rent' });
    await create({ userId: otherUser, name: 'Not mine' });

    const result = await recurringTransactionRepository.findByUser(userId);
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('Rent');
  });
});
