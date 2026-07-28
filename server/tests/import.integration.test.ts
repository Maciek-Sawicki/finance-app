import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { createImportService } from '../services/import.service.js';
import * as importRepository from '../repositories/import.repository.js';
import * as transactionRepository from '../repositories/transaction.repository.js';
import * as accountRepository from '../repositories/account.repository.js';
import * as categoryRepository from '../repositories/category.repository.js';
import Import from '../models/import.model.js';
import Transaction from '../models/transaction.model.js';
import Account from '../models/account.model.js';

// create() writes the Import record and the parsed transactions inside one
// multi-document transaction, which requires a replica set.
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
  await Promise.all([Import.deleteMany({}), Transaction.deleteMany({}), Account.deleteMany({})]);
});

const csvFile = (csv: string): Express.Multer.File =>
  ({ buffer: Buffer.from(csv), originalname: 'statement.csv' } as unknown as Express.Multer.File);

// create() now checks the account belongs to the caller before importing
// into it, so each test needs a real Account document behind its accountId.
const createAccount = (userId: mongoose.Types.ObjectId, accountId: mongoose.Types.ObjectId) =>
  Account.create({ _id: accountId, userId, name: 'Checking', type: 'checking', currency: 'USD', startingBalance: 0 });

describe('import.service (integration, real MongoDB transaction)', () => {
  it('persists importErrors under the schema field name, not the old "errors" typo', async () => {
    const userId = new mongoose.Types.ObjectId();
    const accountId = new mongoose.Types.ObjectId();
    await createAccount(userId, accountId);
    const service = createImportService(importRepository, transactionRepository, accountRepository, categoryRepository);
    const csv = 'date,amount,description\n2026-01-01,100,Salary\n,,Broken row';

    const result = await service.create(userId, { accountId, file: csvFile(csv) });

    expect(result!.importedCount).toBe(1);
    expect(result!.skippedCount).toBe(1);
    expect(result!.importErrors).toEqual([
      expect.objectContaining({ rowNumber: 2, message: 'Missing date or amount' }),
    ]);

    const stored = await Import.findById(result!._id).lean();
    expect(stored!.importErrors).toHaveLength(1);
  });

  it('links every inserted transaction to the created import via importId', async () => {
    const userId = new mongoose.Types.ObjectId();
    const accountId = new mongoose.Types.ObjectId();
    await createAccount(userId, accountId);
    const service = createImportService(importRepository, transactionRepository, accountRepository, categoryRepository);
    const csv = 'date,amount\n2026-01-01,100\n2026-01-02,-40';

    const result = await service.create(userId, { accountId, file: csvFile(csv) });

    const transactions = await Transaction.find({ importId: result!._id });
    expect(transactions).toHaveLength(2);
    expect(transactions.every((t) => t.userId.toString() === userId.toString())).toBe(true);
  });

  it('rolls back the Import record when writing the transactions fails', async () => {
    const userId = new mongoose.Types.ObjectId();
    const accountId = new mongoose.Types.ObjectId();
    await createAccount(userId, accountId);
    const failingTransactionRepository: typeof transactionRepository = {
      ...transactionRepository,
      createMany: jest.fn().mockRejectedValue(new Error('simulated write failure')) as unknown as typeof transactionRepository.createMany,
    };
    const service = createImportService(importRepository, failingTransactionRepository, accountRepository, categoryRepository);

    await expect(
      service.create(userId, { accountId, file: csvFile('date,amount\n2026-01-01,100') })
    ).rejects.toThrow('simulated write failure');

    expect(await Import.countDocuments()).toBe(0);
    expect(await Transaction.countDocuments()).toBe(0);
  });
});
