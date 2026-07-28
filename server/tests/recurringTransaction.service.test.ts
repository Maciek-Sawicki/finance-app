import { createRecurringTransactionService } from '../services/recurringTransaction.service.js';
import * as recurringTransactionRepository from '../repositories/recurringTransaction.repository.js';
import * as accountRepository from '../repositories/account.repository.js';
import * as categoryRepository from '../repositories/category.repository.js';

type RecurringTransactionRepository = jest.Mocked<typeof recurringTransactionRepository>;
type AccountRepository = jest.Mocked<typeof accountRepository>;
type CategoryRepository = jest.Mocked<typeof categoryRepository>;
type RecurringDoc = NonNullable<Awaited<ReturnType<typeof recurringTransactionRepository.findById>>>;
type CreatedDoc = Awaited<ReturnType<typeof recurringTransactionRepository.create>>;

const createFakeRepository = (): RecurringTransactionRepository =>
  ({
    findByUser: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    toggleActive: jest.fn(),
  } as unknown as RecurringTransactionRepository);

// Ownership checks default to "found" so existing tests don't each need
// their own account/category stub.
const createFakeAccountRepository = (): AccountRepository =>
  ({ findById: jest.fn().mockResolvedValue({ _id: 'acc1' }) } as unknown as AccountRepository);

const createFakeCategoryRepository = (): CategoryRepository =>
  ({ findById: jest.fn().mockResolvedValue({ _id: 'cat1' }) } as unknown as CategoryRepository);

const createService = (repository: RecurringTransactionRepository) =>
  createRecurringTransactionService(repository, createFakeAccountRepository(), createFakeCategoryRepository());

type RecurringOverrides = Partial<Omit<RecurringDoc, '_id' | 'userId' | 'categoryId' | 'accountId'> & {
  _id: string; userId: string; categoryId: string; accountId: string;
}>;

const recurring = (overrides: RecurringOverrides = {}): RecurringDoc =>
  ({
    _id: 'rec1',
    userId: 'user1',
    name: 'Rent',
    categoryId: 'cat1',
    accountId: 'acc1',
    amount: 1000,
    frequency: 'monthly',
    nextDueDate: new Date('2026-02-01'),
    isActive: true,
    ...overrides,
  } as unknown as RecurringDoc);

describe('recurringTransaction.service', () => {
  describe('getById', () => {
    it('rejects with 404 when the transaction does not belong to the user', async () => {
      const repository = createFakeRepository();
      repository.findById.mockResolvedValue(null);
      const service = createService(repository);

      await expect(service.getById('user1', 'missing')).rejects.toMatchObject({ status: 404 });
    });

    it('returns the transaction when found', async () => {
      const repository = createFakeRepository();
      repository.findById.mockResolvedValue(recurring());
      const service = createService(repository);

      expect(await service.getById('user1', 'rec1')).toEqual(recurring());
    });
  });

  describe('create', () => {
    it('whitelists fields and injects the userId, ignoring any userId in the payload', async () => {
      const repository = createFakeRepository();
      repository.create.mockResolvedValue(recurring() as unknown as CreatedDoc);
      const service = createService(repository);

      const maliciousPayload = {
        name: 'Rent', categoryId: 'cat1', accountId: 'acc1', amount: 1000, frequency: 'monthly',
        nextDueDate: '2026-02-01', userId: 'attacker', _id: 'forged',
      } as unknown as Parameters<typeof service.create>[1];
      await service.create('user1', maliciousPayload);

      expect(repository.create).toHaveBeenCalledWith({
        name: 'Rent', categoryId: 'cat1', accountId: 'acc1', amount: 1000, frequency: 'monthly',
        nextDueDate: '2026-02-01', userId: 'user1',
      });
    });

    it('rejects with 404 when the account does not belong to the user', async () => {
      const repository = createFakeRepository();
      const accountRepo = createFakeAccountRepository();
      accountRepo.findById.mockResolvedValue(null);
      const service = createRecurringTransactionService(repository, accountRepo, createFakeCategoryRepository());

      await expect(
        service.create('user1', { name: 'Rent', categoryId: 'cat1', accountId: 'not-mine', amount: 1000, frequency: 'monthly', nextDueDate: '2026-02-01' })
      ).rejects.toMatchObject({ status: 404 });
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('whitelists fields instead of trusting the raw request body', async () => {
      const repository = createFakeRepository();
      repository.updateById.mockResolvedValue(recurring({ amount: 1200 }));

      const service = createService(repository);

      const maliciousPayload = { amount: 1200, userId: 'attacker', _id: 'forged' } as unknown as Parameters<typeof service.update>[2];
      await service.update('user1', 'rec1', maliciousPayload);

      expect(repository.updateById).toHaveBeenCalledWith('user1', 'rec1', { amount: 1200 });
    });

    it('rejects with 404 when the transaction does not belong to the user', async () => {
      const repository = createFakeRepository();
      repository.updateById.mockResolvedValue(null);
      const service = createService(repository);

      await expect(service.update('user1', 'missing', { amount: 1 })).rejects.toMatchObject({ status: 404 });
    });

    it('rejects with 404 when reassigning to a category the user does not own', async () => {
      const repository = createFakeRepository();
      const categoryRepo = createFakeCategoryRepository();
      categoryRepo.findById.mockResolvedValue(null);
      const service = createRecurringTransactionService(repository, createFakeAccountRepository(), categoryRepo);

      await expect(service.update('user1', 'rec1', { categoryId: 'not-mine' })).rejects.toMatchObject({ status: 404 });
      expect(repository.updateById).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('rejects with 404 when the transaction does not belong to the user', async () => {
      const repository = createFakeRepository();
      repository.deleteById.mockResolvedValue(null);
      const service = createService(repository);

      await expect(service.remove('user1', 'missing')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('toggleActive', () => {
    it('rejects with 404 when the transaction does not belong to the user', async () => {
      const repository = createFakeRepository();
      repository.toggleActive.mockResolvedValue(null);
      const service = createService(repository);

      await expect(service.toggleActive('user1', 'missing')).rejects.toMatchObject({ status: 404 });
    });

    it('returns the toggled transaction', async () => {
      const repository = createFakeRepository();
      repository.toggleActive.mockResolvedValue(recurring({ isActive: false }));
      const service = createService(repository);

      const result = await service.toggleActive('user1', 'rec1');
      expect(result.isActive).toBe(false);
    });
  });
});
