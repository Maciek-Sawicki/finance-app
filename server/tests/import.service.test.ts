import { createImportService, parseCsv } from '../services/import.service.js';
import * as importRepository from '../repositories/import.repository.js';
import * as transactionRepository from '../repositories/transaction.repository.js';
import type { MongooseSessionFactory } from '../types/common.js';

describe('parseCsv', () => {
  it('parses a comma-delimited CSV with English headers', () => {
    const csv = 'date,amount,description\n2026-01-01,100,Salary\n2026-01-02,-40.50,Groceries';

    const { rowCount, transactions, errors } = parseCsv(csv);

    expect(rowCount).toBe(2);
    expect(errors).toEqual([]);
    expect(transactions).toEqual([
      { date: new Date('2026-01-01'), amount: 100, type: 'income', description: 'Salary', categoryId: null },
      { date: new Date('2026-01-02'), amount: 40.5, type: 'expense', description: 'Groceries', categoryId: null },
    ]);
  });

  it('detects a semicolon delimiter from the header row', () => {
    const csv = 'data;kwota;opis\n2026-01-01;-15,50;Kawa';

    const { transactions } = parseCsv(csv);

    expect(transactions).toEqual([
      { date: new Date('2026-01-01'), amount: 15.5, type: 'expense', description: 'Kawa', categoryId: null },
    ]);
  });

  it('records an error for a row missing date or amount instead of throwing', () => {
    const csv = 'date,amount,description\n,100,Missing date\n2026-01-01,,Missing amount';

    const { transactions, errors } = parseCsv(csv);

    expect(transactions).toEqual([]);
    expect(errors).toEqual([
      { rowNumber: 1, message: 'Missing date or amount' },
      { rowNumber: 2, message: 'Missing date or amount' },
    ]);
  });

  it('records an error for an invalid date or amount format', () => {
    const csv = 'date,amount\nnot-a-date,100\n2026-01-01,not-a-number';

    const { transactions, errors } = parseCsv(csv);

    expect(transactions).toEqual([]);
    expect(errors).toEqual([
      { rowNumber: 1, message: 'Invalid date or amount format' },
      { rowNumber: 2, message: 'Invalid date or amount format' },
    ]);
  });

  it('skips fully blank rows without counting them as errors', () => {
    const csv = 'date,amount,description\n2026-01-01,100,ok\n,,\n';

    const { rowCount, transactions, errors } = parseCsv(csv);

    expect(rowCount).toBe(2);
    expect(transactions).toHaveLength(1);
    expect(errors).toEqual([]);
  });
});

type ImportRepository = jest.Mocked<typeof importRepository>;
type TransactionRepository = jest.Mocked<typeof transactionRepository>;
type ImportDoc = Awaited<ReturnType<typeof importRepository.findById>>;
type TransactionDoc = Awaited<ReturnType<typeof transactionRepository.createMany>>[number];

const createFakeImportRepository = (): ImportRepository =>
  ({
    create: jest.fn(),
    findByUser: jest.fn(),
    findById: jest.fn(),
    deleteById: jest.fn(),
  } as unknown as ImportRepository);

const createFakeTransactionRepository = (): TransactionRepository =>
  ({
    createMany: jest.fn(),
    findByImport: jest.fn(),
    updateById: jest.fn(),
    bulkUpdateCategories: jest.fn(),
    deleteByImport: jest.fn(),
  } as unknown as TransactionRepository);

const createFakeMongoose = (): MongooseSessionFactory =>
  ({
    startSession: jest.fn().mockResolvedValue({
      withTransaction: jest.fn((fn: () => unknown) => fn()),
      endSession: jest.fn(),
    }),
  } as unknown as MongooseSessionFactory);

// Only the two fields the service actually reads (buffer, originalname) are
// faked - real Express.Multer.File has many more (fieldname, mimetype...).
const fakeFile = (buffer: Buffer, originalname: string): Express.Multer.File =>
  ({ buffer, originalname } as unknown as Express.Multer.File);

describe('import.service', () => {
  describe('create', () => {
    it('rejects when accountId is missing', async () => {
      const service = createImportService(createFakeImportRepository(), createFakeTransactionRepository(), createFakeMongoose());

      await expect(service.create('user1', { file: fakeFile(Buffer.from(''), 'a.csv') }))
        .rejects.toMatchObject({ status: 400 });
    });

    it('rejects when no file was uploaded', async () => {
      const service = createImportService(createFakeImportRepository(), createFakeTransactionRepository(), createFakeMongoose());

      await expect(service.create('user1', { accountId: 'acc1' })).rejects.toMatchObject({ status: 400 });
    });

    it('writes the Import record and parsed transactions inside the same session', async () => {
      const importRepository = createFakeImportRepository();
      const transactionRepository = createFakeTransactionRepository();
      const mongooseInstance = createFakeMongoose();
      importRepository.findById.mockResolvedValue({ status: 'completed' } as unknown as ImportDoc);
      const csv = 'date,amount,description\n2026-01-01,100,Salary\nbad-row,x';

      const service = createImportService(importRepository, transactionRepository, mongooseInstance);
      await service.create('user1', {
        accountId: 'acc1',
        file: fakeFile(Buffer.from(csv), 'a.csv'),
      });

      expect(importRepository.create).toHaveBeenCalledTimes(1);
      const [importData, importOpts] = importRepository.create.mock.calls[0]!;
      expect(importData).toMatchObject({
        userId: 'user1', accountId: 'acc1', fileName: 'a.csv',
        status: 'completed', rowCount: 2, importedCount: 1, skippedCount: 1,
      });
      expect(importData.importErrors).toEqual([{ rowNumber: 2, message: 'Invalid date or amount format' }]);

      expect(transactionRepository.createMany).toHaveBeenCalledTimes(1);
      const [txs, txOpts] = transactionRepository.createMany.mock.calls[0]!;
      expect(txs).toHaveLength(1);
      expect(txs[0]).toMatchObject({ userId: 'user1', accountId: 'acc1', amount: 100, type: 'income' });
      expect(txOpts!.session).toBe(importOpts!.session);
    });

    it('does not call createMany when every row failed to parse', async () => {
      const importRepository = createFakeImportRepository();
      const transactionRepository = createFakeTransactionRepository();
      importRepository.findById.mockResolvedValue({ status: 'completed' } as unknown as ImportDoc);
      const service = createImportService(importRepository, transactionRepository, createFakeMongoose());

      await service.create('user1', {
        accountId: 'acc1',
        file: fakeFile(Buffer.from('date,amount\n,'), 'a.csv'),
      });

      expect(transactionRepository.createMany).not.toHaveBeenCalled();
    });

    it('always ends the session, even when the transaction fails', async () => {
      const importRepository = createFakeImportRepository();
      const transactionRepository = createFakeTransactionRepository();
      const endSession = jest.fn();
      const mongooseInstance = {
        startSession: jest.fn().mockResolvedValue({
          withTransaction: jest.fn().mockRejectedValue(new Error('boom')),
          endSession,
        }),
      } as unknown as MongooseSessionFactory;
      const service = createImportService(importRepository, transactionRepository, mongooseInstance);

      await expect(
        service.create('user1', { accountId: 'acc1', file: fakeFile(Buffer.from('date,amount\n2026-01-01,1'), 'a.csv') })
      ).rejects.toThrow('boom');

      expect(endSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTransactions', () => {
    it('rejects when the import does not belong to the user', async () => {
      const importRepository = createFakeImportRepository();
      importRepository.findById.mockResolvedValue(null);
      const service = createImportService(importRepository, createFakeTransactionRepository(), createFakeMongoose());

      await expect(service.getTransactions('user1', 'import1')).rejects.toMatchObject({ status: 404 });
    });

    it('returns the transactions once ownership is confirmed', async () => {
      const importRepository = createFakeImportRepository();
      const transactionRepository = createFakeTransactionRepository();
      importRepository.findById.mockResolvedValue({ _id: 'import1' } as unknown as ImportDoc);
      transactionRepository.findByImport.mockResolvedValue([{ _id: 'tx1' }] as unknown as TransactionDoc[]);
      const service = createImportService(importRepository, transactionRepository, createFakeMongoose());

      const result = await service.getTransactions('user1', 'import1');

      expect(transactionRepository.findByImport).toHaveBeenCalledWith('user1', 'import1');
      expect(result).toEqual([{ _id: 'tx1' }]);
    });
  });

  describe('updateTransactionCategory', () => {
    it('rejects when categoryId is missing', async () => {
      const service = createImportService(createFakeImportRepository(), createFakeTransactionRepository(), createFakeMongoose());

      await expect(service.updateTransactionCategory('user1', 'tx1', undefined)).rejects.toMatchObject({ status: 400 });
    });

    it('rejects when the transaction does not belong to the user', async () => {
      const transactionRepository = createFakeTransactionRepository();
      transactionRepository.updateById.mockResolvedValue(null);
      const service = createImportService(createFakeImportRepository(), transactionRepository, createFakeMongoose());

      await expect(service.updateTransactionCategory('user1', 'tx1', 'cat1')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('batchUpdateTransactionCategories', () => {
    it('rejects an empty updates array', async () => {
      const service = createImportService(createFakeImportRepository(), createFakeTransactionRepository(), createFakeMongoose());

      await expect(service.batchUpdateTransactionCategories('user1', 'import1', [])).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('remove', () => {
    it('rejects when the import does not belong to the user', async () => {
      const importRepository = createFakeImportRepository();
      importRepository.findById.mockResolvedValue(null);
      const service = createImportService(importRepository, createFakeTransactionRepository(), createFakeMongoose());

      await expect(service.remove('user1', 'missing')).rejects.toMatchObject({ status: 404 });
    });

    it('deletes transactions before deleting the import record', async () => {
      const importRepository = createFakeImportRepository();
      const transactionRepository = createFakeTransactionRepository();
      importRepository.findById.mockResolvedValue({ _id: 'import1' } as unknown as ImportDoc);
      const service = createImportService(importRepository, transactionRepository, createFakeMongoose());

      await service.remove('user1', 'import1');

      expect(transactionRepository.deleteByImport).toHaveBeenCalledWith('user1', 'import1');
      expect(importRepository.deleteById).toHaveBeenCalledWith('user1', 'import1');
    });
  });
});
