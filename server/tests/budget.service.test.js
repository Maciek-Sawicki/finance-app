import { createBudgetService } from '../services/budget.service.js';

const createFakeBudgetRepository = () => ({
  findByUser: jest.fn(),
  findByCategory: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
});

const createFakeCategoryRepository = () => ({
  findById: jest.fn(),
});

const createFakeTransactionRepository = () => ({
  aggregateCategorySpendByCurrency: jest.fn().mockResolvedValue([]),
});

const createFakeCurrencyService = () => ({
  convertCurrency: jest.fn((amount) => Promise.resolve(amount)),
});

const budget = (overrides = {}) => ({
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
});

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
      categoryRepository.findById.mockResolvedValue({ _id: 'cat1', type: 'income' });
      const service = createBudgetService(budgetRepository, categoryRepository, createFakeTransactionRepository(), createFakeCurrencyService());

      await expect(
        service.create('user1', { categoryId: 'cat1', amount: 500, currency: 'USD', startDate: '2026-01-01', endDate: '2026-01-31' })
      ).rejects.toMatchObject({ status: 400 });
    });

    it('rejects a fixed budget with a recurrencePeriod', async () => {
      const budgetRepository = createFakeBudgetRepository();
      const categoryRepository = createFakeCategoryRepository();
      categoryRepository.findById.mockResolvedValue({ _id: 'cat1', type: 'expense' });
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
      categoryRepository.findById.mockResolvedValue({ _id: 'cat1', type: 'expense' });
      budgetRepository.create.mockResolvedValue(budget());
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
      currencyService.convertCurrency.mockImplementation((amount, from, to) =>
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

      await expect(service.getById('user1', 'budget1', undefined)).rejects.toMatchObject({ status: 400 });
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
      expect(result[0].targetCurrency).toBe('USD');
    });
  });

  describe('update', () => {
    it('whitelists fields instead of trusting the raw request body', async () => {
      const budgetRepository = createFakeBudgetRepository();
      budgetRepository.updateById.mockResolvedValue(budget({ amount: 600 }));
      const service = createBudgetService(budgetRepository, createFakeCategoryRepository(), createFakeTransactionRepository(), createFakeCurrencyService());

      await service.update('user1', 'budget1', { amount: 600, userId: 'attacker', _id: 'other' });

      expect(budgetRepository.updateById).toHaveBeenCalledWith('user1', 'budget1', { amount: 600 });
    });

    it('marks the budget completed when the new endDate is in the past', async () => {
      const budgetRepository = createFakeBudgetRepository();
      budgetRepository.updateById.mockResolvedValue(budget());
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
      expect(result.find((b) => b._id === 'past').status).toBe('completed');
      expect(result.find((b) => b._id === 'future').status).toBe('active');
    });
  });
});
