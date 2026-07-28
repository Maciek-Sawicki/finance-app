import { createTransactionService } from '../services/transaction.service.js';
import * as transactionRepository from '../repositories/transaction.repository.js';

type TransactionRepository = jest.Mocked<typeof transactionRepository>;
// Fixtures below are partial ({ _id: 'tx1' }) - these tests only check
// pass-through/whitelisting behavior, not real document shape, so each mock
// value is cast to the real (populated, non-lean) document type once here.
type TransactionDoc = Awaited<ReturnType<typeof transactionRepository.create>>;

const createFakeTransactionRepository = (): TransactionRepository =>
  ({
    create: jest.fn(),
    findById: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    toggleSettledById: jest.fn(),
    findPaginated: jest.fn(),
    count: jest.fn(),
    findRecent: jest.fn(),
  } as unknown as TransactionRepository);

describe('transaction.service', () => {
  describe('create', () => {
    it('rounds the amount and defaults date/settled/exclude', async () => {
      const repo = createFakeTransactionRepository();
      repo.create.mockResolvedValue({ _id: 'tx1' } as unknown as TransactionDoc);
      const service = createTransactionService(repo);

      await service.create('user1', { categoryId: 'cat1', accountId: 'acc1', type: 'expense', amount: 12.345 });

      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user1',
        amount: 12.35,
        settled: false,
        exclude: false,
      }));
    });
  });

  describe('update', () => {
    it('only forwards whitelisted fields, dropping anything else the caller sent', async () => {
      const repo = createFakeTransactionRepository();
      repo.updateById.mockResolvedValue({ _id: 'tx1' } as unknown as TransactionDoc);
      const service = createTransactionService(repo);

      const maliciousPayload = {
        amount: 10, description: 'ok',
        userId: 'attacker', transferId: 'fake', importId: 'fake', _id: 'other-id',
      } as unknown as Parameters<typeof service.update>[2];
      await service.update('user1', 'tx1', maliciousPayload);

      expect(repo.updateById).toHaveBeenCalledWith('user1', 'tx1', { amount: 10, description: 'ok' });
    });

    it('omits fields the caller did not send', async () => {
      const repo = createFakeTransactionRepository();
      repo.updateById.mockResolvedValue({ _id: 'tx1' } as unknown as TransactionDoc);
      const service = createTransactionService(repo);

      await service.update('user1', 'tx1', { settled: true });

      expect(repo.updateById).toHaveBeenCalledWith('user1', 'tx1', { settled: true });
    });
  });

  describe('remove', () => {
    it('returns false when nothing was deleted', async () => {
      const repo = createFakeTransactionRepository();
      repo.deleteById.mockResolvedValue(null);
      const service = createTransactionService(repo);

      expect(await service.remove('user1', 'missing')).toBe(false);
    });

    it('returns true when a document was deleted', async () => {
      const repo = createFakeTransactionRepository();
      repo.deleteById.mockResolvedValue({ _id: 'tx1' } as unknown as TransactionDoc);
      const service = createTransactionService(repo);

      expect(await service.remove('user1', 'tx1')).toBe(true);
    });
  });

  describe('list', () => {
    it('clamps page/limit and falls back to safe defaults for invalid input', async () => {
      const repo = createFakeTransactionRepository();
      repo.findPaginated.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);
      const service = createTransactionService(repo);

      // page is not a number at all - the old Math.max(1, NaN, 1) bug would
      // have produced skip: NaN here.
      await service.list('user1', { page: 'not-a-number', limit: '9999' });

      expect(repo.findPaginated).toHaveBeenCalledWith('user1', {}, { skip: 0, limit: 100 });
    });

    it('builds a date range filter from startDate/endDate', async () => {
      const repo = createFakeTransactionRepository();
      repo.findPaginated.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);
      const service = createTransactionService(repo);

      await service.list('user1', { startDate: '2026-01-01', endDate: '2026-01-31' });

      const [, filter] = repo.findPaginated.mock.calls[0]!;
      const dateFilter = filter.date as { $gte?: Date; $lte?: Date };
      expect(dateFilter.$gte).toEqual(new Date('2026-01-01'));
      expect(dateFilter.$lte).toEqual(new Date('2026-01-31'));
    });

    it('returns paging metadata alongside the data', async () => {
      const repo = createFakeTransactionRepository();
      repo.findPaginated.mockResolvedValue([{ _id: 'tx1' }] as unknown as TransactionDoc[]);
      repo.count.mockResolvedValue(45);
      const service = createTransactionService(repo);

      const result = await service.list('user1', { page: '2', limit: '20' });

      expect(result).toEqual({ data: [{ _id: 'tx1' }], total: 45, page: 2, totalPages: 3 });
    });
  });

  describe('toggleSettled', () => {
    it('delegates to the repository\'s atomic toggle', async () => {
      const repo = createFakeTransactionRepository();
      repo.toggleSettledById.mockResolvedValue({ _id: 'tx1', settled: true } as unknown as TransactionDoc);
      const service = createTransactionService(repo);

      const result = await service.toggleSettled('user1', 'tx1');

      expect(repo.toggleSettledById).toHaveBeenCalledWith('user1', 'tx1');
      expect(result!.settled).toBe(true);
    });
  });
});
