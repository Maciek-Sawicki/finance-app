import { createTransactionService } from '../services/transaction.service.js';
import * as transactionRepository from '../repositories/transaction.repository.js';
import * as accountRepository from '../repositories/account.repository.js';
import * as categoryRepository from '../repositories/category.repository.js';

type TransactionRepository = jest.Mocked<typeof transactionRepository>;
type AccountRepository = jest.Mocked<typeof accountRepository>;
type CategoryRepository = jest.Mocked<typeof categoryRepository>;
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

// Ownership checks default to "found" so existing pass-through/whitelisting
// tests don't each need their own account/category stub - tests that care
// about the ownership check itself override findById explicitly.
const createFakeAccountRepository = (): AccountRepository =>
  ({ findById: jest.fn().mockResolvedValue({ _id: 'acc1' }) } as unknown as AccountRepository);

const createFakeCategoryRepository = (): CategoryRepository =>
  ({ findById: jest.fn().mockResolvedValue({ _id: 'cat1' }) } as unknown as CategoryRepository);

const createService = (repo: TransactionRepository) =>
  createTransactionService(repo, createFakeAccountRepository(), createFakeCategoryRepository());

describe('transaction.service', () => {
  describe('create', () => {
    it('rounds the amount and defaults date/settled/exclude', async () => {
      const repo = createFakeTransactionRepository();
      repo.create.mockResolvedValue({ _id: 'tx1' } as unknown as TransactionDoc);
      const service = createService(repo);

      await service.create('user1', { categoryId: 'cat1', accountId: 'acc1', type: 'expense', amount: 12.345 });

      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user1',
        amount: 12.35,
        settled: false,
        exclude: false,
      }));
    });

    it('rejects with 404 when the account does not belong to the user', async () => {
      const repo = createFakeTransactionRepository();
      const accountRepo = createFakeAccountRepository();
      accountRepo.findById.mockResolvedValue(null);
      const service = createTransactionService(repo, accountRepo, createFakeCategoryRepository());

      await expect(
        service.create('user1', { categoryId: 'cat1', accountId: 'not-mine', type: 'expense', amount: 10 })
      ).rejects.toMatchObject({ status: 404 });
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects with 404 when the category does not belong to the user', async () => {
      const repo = createFakeTransactionRepository();
      const categoryRepo = createFakeCategoryRepository();
      categoryRepo.findById.mockResolvedValue(null);
      const service = createTransactionService(repo, createFakeAccountRepository(), categoryRepo);

      await expect(
        service.create('user1', { categoryId: 'not-mine', accountId: 'acc1', type: 'expense', amount: 10 })
      ).rejects.toMatchObject({ status: 404 });
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('only forwards whitelisted fields, dropping anything else the caller sent', async () => {
      const repo = createFakeTransactionRepository();
      repo.updateById.mockResolvedValue({ _id: 'tx1' } as unknown as TransactionDoc);
      const service = createService(repo);

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
      const service = createService(repo);

      await service.update('user1', 'tx1', { settled: true });

      expect(repo.updateById).toHaveBeenCalledWith('user1', 'tx1', { settled: true });
    });

    it('rejects with 404 when reassigning to an account the user does not own', async () => {
      const repo = createFakeTransactionRepository();
      const accountRepo = createFakeAccountRepository();
      accountRepo.findById.mockResolvedValue(null);
      const service = createTransactionService(repo, accountRepo, createFakeCategoryRepository());

      await expect(service.update('user1', 'tx1', { accountId: 'not-mine' })).rejects.toMatchObject({ status: 404 });
      expect(repo.updateById).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('returns false when nothing was deleted', async () => {
      const repo = createFakeTransactionRepository();
      repo.deleteById.mockResolvedValue(null);
      const service = createService(repo);

      expect(await service.remove('user1', 'missing')).toBe(false);
    });

    it('returns true when a document was deleted', async () => {
      const repo = createFakeTransactionRepository();
      repo.deleteById.mockResolvedValue({ _id: 'tx1' } as unknown as TransactionDoc);
      const service = createService(repo);

      expect(await service.remove('user1', 'tx1')).toBe(true);
    });
  });

  describe('list', () => {
    it('clamps page/limit and falls back to safe defaults for invalid input', async () => {
      const repo = createFakeTransactionRepository();
      repo.findPaginated.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);
      const service = createService(repo);

      // page is not a number at all - the old Math.max(1, NaN, 1) bug would
      // have produced skip: NaN here.
      await service.list('user1', { page: 'not-a-number', limit: '9999' });

      expect(repo.findPaginated).toHaveBeenCalledWith('user1', {}, { skip: 0, limit: 100 });
    });

    it('builds a date range filter from startDate/endDate', async () => {
      const repo = createFakeTransactionRepository();
      repo.findPaginated.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);
      const service = createService(repo);

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
      const service = createService(repo);

      const result = await service.list('user1', { page: '2', limit: '20' });

      expect(result).toEqual({ data: [{ _id: 'tx1' }], total: 45, page: 2, totalPages: 3 });
    });
  });

  describe('toggleSettled', () => {
    it('delegates to the repository\'s atomic toggle', async () => {
      const repo = createFakeTransactionRepository();
      repo.toggleSettledById.mockResolvedValue({ _id: 'tx1', settled: true } as unknown as TransactionDoc);
      const service = createService(repo);

      const result = await service.toggleSettled('user1', 'tx1');

      expect(repo.toggleSettledById).toHaveBeenCalledWith('user1', 'tx1');
      expect(result!.settled).toBe(true);
    });
  });
});
