import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as budgetRepository from '../repositories/budget.repository.js';
import Budget from '../models/budget.model.js';
import Category from '../models/category.model.js';

let mongod;
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
  await Promise.all([Budget.deleteMany({}), Category.deleteMany({})]);
});

const createCategory = (overrides = {}) =>
  Category.create({ userId, name: 'Groceries', type: 'expense', ...overrides });

const createBudget = (categoryId, overrides = {}) =>
  Budget.create({
    userId, categoryId, amount: 500, currency: 'USD',
    startDate: new Date('2026-01-01'), endDate: new Date('2026-01-31'),
    ...overrides,
  });

describe('budget.repository', () => {
  it('creates a budget and finds it scoped to its owner, with category populated', async () => {
    const category = await createCategory();
    const created = await createBudget(category._id);

    const found = await budgetRepository.findById(userId, created._id);
    expect(found.amount).toBe(500);
    expect(found.categoryId.name).toBe('Groceries');

    const otherUser = new mongoose.Types.ObjectId();
    expect(await budgetRepository.findById(otherUser, created._id)).toBeNull();
  });

  it('findByUser applies an additional filter such as status', async () => {
    const category = await createCategory();
    await createBudget(category._id, { status: 'active' });
    await createBudget(category._id, { status: 'completed' });

    expect(await budgetRepository.findByUser(userId, { status: 'active' })).toHaveLength(1);
    expect(await budgetRepository.findByUser(userId, {})).toHaveLength(2);
  });

  it('findByCategory returns only budgets for that category', async () => {
    const groceries = await createCategory({ name: 'Groceries' });
    const rent = await createCategory({ name: 'Rent' });
    await createBudget(groceries._id);
    await createBudget(rent._id);

    const result = await budgetRepository.findByCategory(userId, groceries._id);
    expect(result).toHaveLength(1);
    expect(result[0].categoryId.name).toBe('Groceries');
  });

  it('updateById only updates a budget scoped to the given user', async () => {
    const category = await createCategory();
    const created = await createBudget(category._id);

    const otherUser = new mongoose.Types.ObjectId();
    expect(await budgetRepository.updateById(otherUser, created._id, { amount: 999 })).toBeNull();

    const updated = await budgetRepository.updateById(userId, created._id, { amount: 750 });
    expect(updated.amount).toBe(750);
  });

  it('deleteById only deletes a budget scoped to the given user', async () => {
    const category = await createCategory();
    const created = await createBudget(category._id);

    const otherUser = new mongoose.Types.ObjectId();
    expect(await budgetRepository.deleteById(otherUser, created._id)).toBeNull();
    expect(await budgetRepository.deleteById(userId, created._id)).not.toBeNull();
    expect(await Budget.countDocuments()).toBe(0);
  });
});
