import { createBudgetService } from '../services/budget.service.js';
import * as budgetRepository from '../repositories/budget.repository.js';
import * as categoryRepository from '../repositories/category.repository.js';
import * as transactionRepository from '../repositories/transaction.repository.js';
import type { CurrencyService } from '../services/exchangeRate.service.js';

type BudgetRepository = jest.Mocked<typeof budgetRepository>;
type CategoryRepository = jest.Mocked<typeof categoryRepository>;
type TransactionRepository = jest.Mocked<typeof transactionRepository>;
type LeanBudget = NonNullable<Awaited<ReturnType<typeof budgetRepository.findById>>>;
type LeanCategory = NonNullable<Awaited<ReturnType<typeof categoryRepository.findById>>>;
// create/updateById don't populate categoryId the way findById/findByUser/
// findByCategory do, so their resolved shape differs (categoryId: ObjectId,
// not the populated {_id,name,...}) - these two casts bridge that at the
// handful of call sites that mock them with the same budget() fixture.
type CreatedBudget = Awaited<ReturnType<typeof budgetRepository.create>>;
type UpdatedBudget = NonNullable<Awaited<ReturnType<typeof budgetRepository.updateById>>>;

const createFakeBudgetRepository = (): BudgetRepository =>
  ({
    findByUser: jest.fn(),
    findByCategory: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
  } as unknown as BudgetRepository);

const createFakeCategoryRepository = (): CategoryRepository =>
  ({
    findById: jest.fn(),
  } as unknown as CategoryRepository);

const createFakeTransactionRepository = (): TransactionRepository =>
  ({
    aggregateCategorySpendByCurrency: jest.fn().mockResolvedValue([]),
  } as unknown as TransactionRepository);

const createFakeCurrencyService = (): jest.Mocked<CurrencyService> =>
  ({
    convertCurrency: jest.fn((amount: number) => Promise.resolve(amount)),
  } as unknown as jest.Mocked<CurrencyService>);

type BudgetOverrides = Partial<Omit<LeanBudget, '_id' | 'userId' | 'categoryId'> & {
  _id: string; userId: string; categoryId: { _id: string; name: string; type: string };
}>;

const budget = (overrides: BudgetOverrides = {}): LeanBudget =>
  ({
    _id: 'budget1',
    userId: 'user1',
    categoryId: { _id: 'cat1', name: 'Groceries', type: 'expense' },
    amount: 500,
    currency: 'USD',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    type: 'recurring',
    status: 'active',
    ...overrides,
  } as unknown as LeanBudget);

const category = (overrides: Partial<Omit<LeanCategory, '_id'> & { _id: string }> = {}): LeanCategory =>
  ({ _id: 'cat1', type: 'expense', ...overrides } as unknown as LeanCategory);

describe('budget.service', () => {
  describe('create', () => {
    it('rejects when a required field is missing', async () => {
      const budgetRepository = createFakeBudgetRepository();
      const categoryRepository = createFakeCategoryRepository();
      const service = createBudgetService(budgetRepository, categoryRepository, createFakeTransactionRepository(), createFakeCurrencyService());

      await expect(service.create('user1', { amount: 500 })).rejects.toMatchObject({ status: 400 });
      expect(categoryRepository.findById).not.toHaveBeenCalled();
    });

    it('rejects when the category does not belong to the user', async () => {
      const budgetRepository = createFakeBudgetRepository();
      const categoryRepository = createFakeCategoryRepository();
      categoryRepository.findById.mockResolvedValue(null);
      const service = createBudgetService(budgetRepository, categoryRepository, createFakeTransactionRepository(), createFakeCurrencyService());

      await expect(
        service.create('user1', { categoryId: 'cat1', amount: 500, currency: 'USD', startDate: '2026-01-01', endDate: '2026-01-31' })
      ).rejects.toMatchObject({ status: 404 });
    });

    it('rejects a non-expense category', async () => {
      const budgetRepository = createFakeBudgetRepository();
      const categoryRepository = createFakeCategoryRepository();
      categoryRepository.findById.mockResolvedValue(category({ type: 'income' }));
      const service = createBudgetService(budgetRepository, categoryRepository, createFakeTransactionRepository(), createFakeCurrencyService());

      await expect(
        service.create('user1', { categoryId: 'cat1', amount: 500, currency: 'USD', startDate: '2026-01-01', endDate: '2026-01-31' })
      ).rejects.toMatchObject({ status: 400 });
    });

    it('rejects a fixed budget with a recurrencePeriod', async () => {
      const budgetRepository = createFakeBudgetRepository();
      const categoryRepository = createFakeCategoryRepository();
      categoryRepository.findById.mockResolvedValue(category());
      const service = createBudgetService(budgetRepository, categoryRepository, createFakeTransactionRepository(), createFakeCurrencyService());

      await expect(
        service.create('user1', {
          categoryId: 'cat1', amount: 500, currency: 'USD', startDate: '2026-01-01', endDate: '2026-01-31',
          type: 'fixed', recurrencePeriod: 'monthly',
        })
      ).rejects.toMatchObject({ status: 400 });
    });

    it('creates the budget once validation passes', async () => {
      const budgetRepository = createFakeBudgetRepository();
      const categoryRepository = createFakeCategoryRepository();
      categoryRepository.findById.mockResolvedValue(category());
      budgetRepository.create.mockResolvedValue(budget() as unknown as CreatedBudget);
      const service = createBudgetService(budgetRepository, categoryRepository, createFakeTransactionRepository(), createFakeCurrencyService());

      const result = await service.create('user1', {
        categoryId: 'cat1', amount: 500, currency: 'USD', startDate: '2026-01-01', endDate: '2026-01-31',
      });

      expect(result).toEqual(budget());
    });
  });

  describe('withProgress (via list/getById)', () => {
    it('sums spend across currencies with one conversion per currency, not per transaction', async () => {
      const budgetRepository = createFakeBudgetRepository();
      const transactionRepository = createFakeTransactionRepository();
      const currencyService = createFakeCurrencyService();
      budgetRepository.findById.mockResolvedValue(budget());
      transactionRepository.aggregateCategorySpendByCurrency.mockResolvedValue([
        { _id: 'USD', total: 100 },
        { _id: 'EUR', total: 50 },
      ]);
      currencyService.convertCurrency.mockImplementation((amount: number, from: string, to: string) =>
        Promise.resolve(from === to ? amount : amount * 2)
      );
      const service = createBudgetService(budgetRepository, createFakeCategoryRepository(), transactionRepository, currencyService);

      const result = await service.getById('user1', 'budget1', 'USD');

      expect(transactionRepository.aggregateCategorySpendByCurrency).toHaveBeenCalledWith(
        'user1', 'cat1', budget().startDate, budget().endDate
      );
      // 100 USD (no conversion) + 50 EUR -> 100 USD = 200 total spent
      expect(result.spent).toBe(200);
      expect(result.convertedAmount).toBe(500);
      expect(result.progress).toBe(40);
    });

    it('converts the budget amount itself when its currency differs from targetCurrency', async () => {
      const budgetRepository = createFakeBudgetRepository();
      const transactionRepository = createFakeTransactionRepository();
      const currencyService = createFakeCurrencyService();
      budgetRepository.findById.mockResolvedValue(budget({ currency: 'EUR', amount: 100 }));
      currencyService.convertCurrency.mockResolvedValue(200);
      const service = createBudgetService(budgetRepository, createFakeCategoryRepository(), transactionRepository, currencyService);

      const result = await service.getById('user1', 'budget1', 'USD');

      expect(currencyService.convertCurrency).toHaveBeenCalledWith(100, 'EUR', 'USD');
      expect(result.convertedAmount).toBe(200);
    });

    it('rejects when targetCurrency is missing', async () => {
      const budgetRepository = createFakeBudgetRepository();
      const service = createBudgetService(budgetRepository, createFakeCategoryRepository(), createFakeTransactionRepository(), createFakeCurrencyService());

      await expect(service.getById('user1', 'budget1', undefined as unknown as string)).rejects.toMatchObject({ status: 400 });
    });

    it('rejects when the budget does not exist', async () => {
      const budgetRepository = createFakeBudgetRepository();
      budgetRepository.findById.mockResolvedValue(null);
      const service = createBudgetService(budgetRepository, createFakeCategoryRepository(), createFakeTransactionRepository(), createFakeCurrencyService());

      await expect(service.getById('user1', 'missing', 'USD')).rejects.toMatchObject({ status: 404 });
    });

    it('list() enriches every budget returned by the repository', async () => {
      const budgetRepository = createFakeBudgetRepository();
      const transactionRepository = createFakeTransactionRepository();
      budgetRepository.findByUser.mockResolvedValue([budget({ _id: 'b1' }), budget({ _id: 'b2' })]);
      const service = createBudgetService(budgetRepository, createFakeCategoryRepository(), transactionRepository, createFakeCurrencyService());

      const result = await service.list('user1', { status: 'active' }, 'USD');

      expect(budgetRepository.findByUser).toHaveBeenCalledWith('user1', { status: 'active' });
      expect(result).toHaveLength(2);
      expect(result[0]!.targetCurrency).toBe('USD');
    });
  });

  describe('update', () => {
    it('whitelists fields instead of trusting the raw request body', async () => {
      const budgetRepository = createFakeBudgetRepository();
      budgetRepository.updateById.mockResolvedValue(budget({ amount: 600 }) as unknown as UpdatedBudget);
      const service = createBudgetService(budgetRepository, createFakeCategoryRepository(), createFakeTransactionRepository(), createFakeCurrencyService());

      const maliciousPayload = { amount: 600, userId: 'attacker', _id: 'other' } as unknown as Parameters<typeof service.update>[2];
      await service.update('user1', 'budget1', maliciousPayload);

      expect(budgetRepository.updateById).toHaveBeenCalledWith('user1', 'budget1', { amount: 600 });
    });

    it('marks the budget completed when the new endDate is in the past', async () => {
      const budgetRepository = createFakeBudgetRepository();
      budgetRepository.updateById.mockResolvedValue(budget() as unknown as UpdatedBudget);
      const service = createBudgetService(budgetRepository, createFakeCategoryRepository(), createFakeTransactionRepository(), createFakeCurrencyService());

      await service.update('user1', 'budget1', { endDate: '2020-01-01' });

      expect(budgetRepository.updateById).toHaveBeenCalledWith('user1', 'budget1', {
        endDate: '2020-01-01', status: 'completed',
      });
    });

    it('rejects when the budget does not exist', async () => {
      const budgetRepository = createFakeBudgetRepository();
      budgetRepository.updateById.mockResolvedValue(null);
      const service = createBudgetService(budgetRepository, createFakeCategoryRepository(), createFakeTransactionRepository(), createFakeCurrencyService());

      await expect(service.update('user1', 'missing', { amount: 1 })).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('remove', () => {
    it('rejects when the budget does not exist', async () => {
      const budgetRepository = createFakeBudgetRepository();
      budgetRepository.deleteById.mockResolvedValue(null);
      const service = createBudgetService(budgetRepository, createFakeCategoryRepository(), createFakeTransactionRepository(), createFakeCurrencyService());

      await expect(service.remove('user1', 'missing')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('getByType', () => {
    it('rejects an invalid status', async () => {
      const budgetRepository = createFakeBudgetRepository();
      const service = createBudgetService(budgetRepository, createFakeCategoryRepository(), createFakeTransactionRepository(), createFakeCurrencyService());

      await expect(service.getByType('user1', 'bogus', 'USD')).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('getHistory', () => {
    it('derives status from the endDate and spend rather than trusting stored status', async () => {
      const budgetRepository = createFakeBudgetRepository();
      const transactionRepository = createFakeTransactionRepository();
      budgetRepository.findByCategory.mockResolvedValue([
        budget({ _id: 'past', endDate: new Date('2020-01-01') }),
        budget({ _id: 'future', endDate: new Date('2099-01-01') }),
      ]);
      const service = createBudgetService(budgetRepository, createFakeCategoryRepository(), transactionRepository, createFakeCurrencyService());

      const result = await service.getHistory('user1', 'cat1', 'USD');

      expect(budgetRepository.findByCategory).toHaveBeenCalledWith('user1', 'cat1');
      expect(result.find((b) => (b._id as unknown as string) === 'past')!.status).toBe('completed');
      expect(result.find((b) => (b._id as unknown as string) === 'future')!.status).toBe('active');
    });
  });
});
