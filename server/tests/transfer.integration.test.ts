import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { createTransferService } from '../services/transfer.service.js';
import * as accountRepository from '../repositories/account.repository.js';
import * as categoryRepository from '../repositories/category.repository.js';
import * as transactionRepository from '../repositories/transaction.repository.js';
import * as transferRepository from '../repositories/transfer.repository.js';
import type { CurrencyService } from '../services/exchangeRate.service.js';
import Account from '../models/account.model.js';
import Category from '../models/category.model.js';
import Transaction from '../models/transaction.model.js';
import Transfer from '../models/transfer.model.js';

// Multi-document transactions require a replica set - a standalone mongod
// rejects session.startTransaction() outright, so this needs the replset
// flavor of mongodb-memory-server rather than the plain MongoMemoryServer
// used elsewhere.
let replset: MongoMemoryReplSet;

beforeAll(async () => {
  replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replset.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await replset.stop();
});

afterEach(async () => {
  await Promise.all([
    Account.deleteMany({}),
    Category.deleteMany({}),
    Transaction.deleteMany({}),
    Transfer.deleteMany({}),
  ]);
});

const fakeCurrencyService: jest.Mocked<CurrencyService> =
  { convertCurrency: jest.fn().mockResolvedValue(90) } as unknown as jest.Mocked<CurrencyService>;

const createAccount = (overrides: Record<string, unknown> = {}) =>
  Account.create({ name: 'Account', type: 'checking', currency: 'USD', startingBalance: 0, ...overrides });

describe('transfer.service (integration, real MongoDB transaction)', () => {
  it('creates exactly one Transfer and two linked Transactions on the happy path', async () => {
    const userId = new mongoose.Types.ObjectId();
    const [from, to] = await Promise.all([
      createAccount({ userId, name: 'Checking' }),
      createAccount({ userId, name: 'Savings' }),
    ]);
    const service = createTransferService(
      accountRepository, categoryRepository, transactionRepository, transferRepository, fakeCurrencyService
    );

    const result = await service.create(userId, { fromAccountId: from!._id, toAccountId: to!._id, amount: 50 });

    expect(await Transfer.countDocuments()).toBe(1);
    expect(await Transaction.countDocuments()).toBe(2);
    expect(result.transactions[0]!.transferId!.toString()).toBe(result.transfer._id.toString());
    expect(result.transactions[1]!.transferId!.toString()).toBe(result.transfer._id.toString());

    const category = await Category.findOne({ userId, name: 'Transfer' });
    expect(category).not.toBeNull();
  });

  it('rolls back everything (Transfer included) when a write later in the transaction fails', async () => {
    const userId = new mongoose.Types.ObjectId();
    const [from, to] = await Promise.all([
      createAccount({ userId, name: 'Checking' }),
      createAccount({ userId, name: 'Savings' }),
    ]);

    // Real accountRepository/categoryRepository/transferRepository, but the
    // transaction leg is forced to fail mid-transaction - this is the exact
    // failure mode the review flagged: previously the Transfer document
    // would have already been committed by this point.
    const failingTransactionRepository: typeof transactionRepository = {
      ...transactionRepository,
      createMany: jest.fn().mockRejectedValue(new Error('simulated failure writing transaction legs')) as unknown as typeof transactionRepository.createMany,
    };

    const service = createTransferService(
      accountRepository, categoryRepository, failingTransactionRepository, transferRepository, fakeCurrencyService
    );

    await expect(service.create(userId, { fromAccountId: from!._id, toAccountId: to!._id, amount: 50 }))
      .rejects.toThrow('simulated failure writing transaction legs');

    expect(await Transfer.countDocuments()).toBe(0);
    expect(await Transaction.countDocuments()).toBe(0);
  });

  it('does not create a duplicate "Transfer" category when two transfers run concurrently for the first time', async () => {
    const userId = new mongoose.Types.ObjectId();
    const [a, b, c, d] = await Promise.all([
      createAccount({ userId, name: 'A' }),
      createAccount({ userId, name: 'B' }),
      createAccount({ userId, name: 'C' }),
      createAccount({ userId, name: 'D' }),
    ]);
    const service = createTransferService(
      accountRepository, categoryRepository, transactionRepository, transferRepository, fakeCurrencyService
    );

    await Promise.all([
      service.create(userId, { fromAccountId: a!._id, toAccountId: b!._id, amount: 10 }),
      service.create(userId, { fromAccountId: c!._id, toAccountId: d!._id, amount: 20 }),
    ]);

    expect(await Transfer.countDocuments()).toBe(2);
    expect(await Transaction.countDocuments()).toBe(4);
    expect(await Category.countDocuments({ userId, name: 'Transfer' })).toBe(1);
  });
});
