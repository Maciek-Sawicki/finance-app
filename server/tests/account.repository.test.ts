import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as accountRepository from '../repositories/account.repository.js';
import * as transactionRepository from '../repositories/transaction.repository.js';
import Account from '../models/account.model.js';
import Transaction from '../models/transaction.model.js';

let mongod: MongoMemoryServer;
const userId = new mongoose.Types.ObjectId();
const otherUserId = new mongoose.Types.ObjectId();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Account.deleteMany({});
  await Transaction.deleteMany({});
});

describe('account.repository', () => {
  describe('findByUser', () => {
    it('only returns accounts belonging to the given user', async () => {
      await Account.create([
        { userId, name: 'Checking', type: 'checking', currency: 'USD', startingBalance: 0 },
        { userId: otherUserId, name: 'Other', type: 'checking', currency: 'USD', startingBalance: 0 },
      ]);

      const accounts = await accountRepository.findByUser(userId);

      expect(accounts).toHaveLength(1);
      expect(accounts[0]!.name).toBe('Checking');
    });

    it('applies an additional filter such as type or currency', async () => {
      await Account.create([
        { userId, name: 'Checking', type: 'checking', currency: 'USD', startingBalance: 0 },
        { userId, name: 'Savings', type: 'savings', currency: 'EUR', startingBalance: 0 },
      ]);

      const savingsOnly = await accountRepository.findByUser(userId, { type: 'savings' });

      expect(savingsOnly).toHaveLength(1);
      expect(savingsOnly[0]!.name).toBe('Savings');
    });
  });

  describe('unsetDefaultForUser / updateById', () => {
    it('clears isDefault on all of the user\'s accounts before a new one is set', async () => {
      const [a, b] = await Account.create([
        { userId, name: 'A', type: 'checking', currency: 'USD', startingBalance: 0, isDefault: true },
        { userId, name: 'B', type: 'checking', currency: 'USD', startingBalance: 0 },
      ]);

      await accountRepository.unsetDefaultForUser(userId);
      const updated = await accountRepository.updateById(userId, b!._id, { isDefault: true });

      expect(updated!.isDefault).toBe(true);
      const reloadedA = await Account.findById(a!._id).lean();
      expect(reloadedA!.isDefault).toBe(false);
    });
  });
});

describe('transaction.repository balance aggregations', () => {
  it('aggregateAccountBalance sums settled and all transactions separately', async () => {
    const accountId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();

    await Transaction.create([
      { userId, accountId, categoryId, type: 'income', amount: 100, settled: true },
      { userId, accountId, categoryId, type: 'expense', amount: 30, settled: true },
      { userId, accountId, categoryId, type: 'income', amount: 50, settled: false }, // unsettled receivable
    ]);

    const agg = await transactionRepository.aggregateAccountBalance(userId, accountId);

    expect(agg!.incomeSettled).toBe(100);
    expect(agg!.expenseSettled).toBe(30);
    expect(agg!.incomeAll).toBe(150);
    expect(agg!.expenseAll).toBe(30);
  });

  it('aggregateBalancesByAccount groups every account of a user in a single query', async () => {
    const accountA = new mongoose.Types.ObjectId();
    const accountB = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();

    await Transaction.create([
      { userId, accountId: accountA, categoryId, type: 'income', amount: 100, settled: true },
      { userId, accountId: accountB, categoryId, type: 'expense', amount: 40, settled: true },
    ]);

    const balancesByAccount = await transactionRepository.aggregateBalancesByAccount(userId);

    expect(balancesByAccount.get(accountA.toString())!.incomeSettled).toBe(100);
    expect(balancesByAccount.get(accountB.toString())!.expenseSettled).toBe(40);
  });

  it('deleteByAccount only removes transactions for the given account and user', async () => {
    const accountId = new mongoose.Types.ObjectId();
    const otherAccountId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();

    await Transaction.create([
      { userId, accountId, categoryId, type: 'income', amount: 10 },
      { userId, accountId: otherAccountId, categoryId, type: 'income', amount: 20 },
    ]);

    await transactionRepository.deleteByAccount(userId, accountId);

    expect(await Transaction.countDocuments({ accountId })).toBe(0);
    expect(await Transaction.countDocuments({ accountId: otherAccountId })).toBe(1);
  });
});
