import { createCategoryBreakdownService } from '../services/categoryBreakdown.service.js';
import * as transactionRepository from '../repositories/transaction.repository.js';
import type { CurrencyService } from '../services/exchangeRate.service.js';
import type { CategoryPeriodTotalRow } from '../repositories/transaction.repository.js';
import mongoose from 'mongoose';

type TransactionRepository = jest.Mocked<typeof transactionRepository>;

const createFakeTransactionRepository = (): TransactionRepository =>
  ({ aggregateCategoryTotalsByPeriod: jest.fn() } as unknown as TransactionRepository);

const createFakeCurrencyService = (): jest.Mocked<CurrencyService> =>
  ({ convertCurrency: jest.fn() } as unknown as jest.Mocked<CurrencyService>);

const categoryId = new mongoose.Types.ObjectId();

type RowOverrides = Partial<Omit<CategoryPeriodTotalRow, '_id'>> & { _id?: Partial<CategoryPeriodTotalRow['_id']> };

const row = ({ _id, ...overrides }: RowOverrides = {}): CategoryPeriodTotalRow => ({
  _id: { period: '2026-01', categoryId, currency: 'USD', ..._id },
  categoryName: 'Groceries',
  icon: '🛒',
  color: '#fff',
  totalAmount: 100,
  ...overrides,
});

describe('categoryBreakdown.service.getTopCategoriesByPeriod', () => {
  it('returns an empty result when there are no transactions', async () => {
    const transactionRepo = createFakeTransactionRepository();
    transactionRepo.aggregateCategoryTotalsByPeriod.mockResolvedValue([]);
    const service = createCategoryBreakdownService(transactionRepo, createFakeCurrencyService());

    const result = await service.getTopCategoriesByPeriod('user1', { type: 'expense', targetCurrency: 'USD', dateFormat: '%Y-%m' });

    expect(result).toEqual({});
  });

  it('does not call the currency converter when the bucket is already in targetCurrency', async () => {
    const transactionRepo = createFakeTransactionRepository();
    transactionRepo.aggregateCategoryTotalsByPeriod.mockResolvedValue([row({ totalAmount: 50 })]);
    const currencyService = createFakeCurrencyService();
    const service = createCategoryBreakdownService(transactionRepo, currencyService);

    const result = await service.getTopCategoriesByPeriod('user1', { type: 'expense', targetCurrency: 'USD', dateFormat: '%Y-%m' });

    expect(currencyService.convertCurrency).not.toHaveBeenCalled();
    expect(result['2026-01']).toEqual([
      { categoryId: categoryId.toString(), name: 'Groceries', icon: '🛒', color: '#fff', total: 50, percent: 100 },
    ]);
  });

  it('converts a foreign-currency bucket into targetCurrency using the per-unit rate', async () => {
    const transactionRepo = createFakeTransactionRepository();
    transactionRepo.aggregateCategoryTotalsByPeriod.mockResolvedValue([row({ totalAmount: 100, _id: { currency: 'EUR' } })]);
    const currencyService = createFakeCurrencyService();
    currencyService.convertCurrency.mockResolvedValue(1.1);
    const service = createCategoryBreakdownService(transactionRepo, currencyService);

    const result = await service.getTopCategoriesByPeriod('user1', { type: 'expense', targetCurrency: 'USD', dateFormat: '%Y-%m' });

    expect(currencyService.convertCurrency).toHaveBeenCalledWith(1, 'EUR', 'USD');
    expect(result['2026-01']![0]!.total).toBe(110);
  });

  it('sums multiple currencies for the same category after conversion', async () => {
    const transactionRepo = createFakeTransactionRepository();
    transactionRepo.aggregateCategoryTotalsByPeriod.mockResolvedValue([
      row({ totalAmount: 100, _id: { currency: 'USD' } }),
      row({ totalAmount: 50, _id: { currency: 'EUR' } }),
    ]);
    const currencyService = createFakeCurrencyService();
    currencyService.convertCurrency.mockResolvedValue(2);
    const service = createCategoryBreakdownService(transactionRepo, currencyService);

    const result = await service.getTopCategoriesByPeriod('user1', { type: 'expense', targetCurrency: 'USD', dateFormat: '%Y-%m' });

    expect(result['2026-01']![0]!.total).toBe(200); // 100*1 (USD) + 50*2 (EUR->USD)
  });

  it('buckets transactions with no category under "Uncategorized"', async () => {
    const transactionRepo = createFakeTransactionRepository();
    transactionRepo.aggregateCategoryTotalsByPeriod.mockResolvedValue([
      row({ totalAmount: 30, categoryName: null, icon: null, color: null, _id: { categoryId: null } }),
    ]);
    const service = createCategoryBreakdownService(transactionRepo, createFakeCurrencyService());

    const result = await service.getTopCategoriesByPeriod('user1', { type: 'expense', targetCurrency: 'USD', dateFormat: '%Y-%m' });

    expect(result['2026-01']).toEqual([
      { categoryId: 'Uncategorized', name: 'Uncategorized', icon: null, color: null, total: 30, percent: 100 },
    ]);
  });

  it('computes percent shares across categories and sorts by total descending', async () => {
    const otherCategoryId = new mongoose.Types.ObjectId();
    const transactionRepo = createFakeTransactionRepository();
    transactionRepo.aggregateCategoryTotalsByPeriod.mockResolvedValue([
      row({ totalAmount: 25, categoryName: 'Small' }),
      row({ totalAmount: 75, categoryName: 'Big', _id: { categoryId: otherCategoryId } }),
    ]);
    const service = createCategoryBreakdownService(transactionRepo, createFakeCurrencyService());

    const result = await service.getTopCategoriesByPeriod('user1', { type: 'expense', targetCurrency: 'USD', dateFormat: '%Y-%m' });

    expect(result['2026-01']).toEqual([
      expect.objectContaining({ name: 'Big', total: 75, percent: 75 }),
      expect.objectContaining({ name: 'Small', total: 25, percent: 25 }),
    ]);
  });

  it('folds categories past `limit` into a single "Other" row', async () => {
    const idA = new mongoose.Types.ObjectId();
    const idB = new mongoose.Types.ObjectId();
    const idC = new mongoose.Types.ObjectId();
    const transactionRepo = createFakeTransactionRepository();
    transactionRepo.aggregateCategoryTotalsByPeriod.mockResolvedValue([
      row({ totalAmount: 50, categoryName: 'A', _id: { categoryId: idA } }),
      row({ totalAmount: 30, categoryName: 'B', _id: { categoryId: idB } }),
      row({ totalAmount: 20, categoryName: 'C', _id: { categoryId: idC } }),
    ]);
    const service = createCategoryBreakdownService(transactionRepo, createFakeCurrencyService());

    const result = await service.getTopCategoriesByPeriod('user1', { type: 'expense', targetCurrency: 'USD', limit: 1, dateFormat: '%Y-%m' });

    expect(result['2026-01']).toEqual([
      expect.objectContaining({ name: 'A', total: 50, percent: 50 }),
      { categoryId: 'Other', name: 'Other', icon: null, color: null, total: 50, percent: 50 },
    ]);
  });

  it('keeps separate periods independent of each other', async () => {
    const transactionRepo = createFakeTransactionRepository();
    transactionRepo.aggregateCategoryTotalsByPeriod.mockResolvedValue([
      row({ totalAmount: 10, _id: { period: '2026-01' } }),
      row({ totalAmount: 20, _id: { period: '2026-02' } }),
    ]);
    const service = createCategoryBreakdownService(transactionRepo, createFakeCurrencyService());

    const result = await service.getTopCategoriesByPeriod('user1', { type: 'expense', targetCurrency: 'USD', dateFormat: '%Y-%m' });

    expect(Object.keys(result)).toEqual(['2026-01', '2026-02']);
    expect(result['2026-01']![0]!.total).toBe(10);
    expect(result['2026-02']![0]!.total).toBe(20);
  });

  it('passes the requested type and dateFormat straight through to the repository', async () => {
    const transactionRepo = createFakeTransactionRepository();
    transactionRepo.aggregateCategoryTotalsByPeriod.mockResolvedValue([]);
    const service = createCategoryBreakdownService(transactionRepo, createFakeCurrencyService());

    await service.getTopCategoriesByPeriod('user1', { type: 'income', targetCurrency: 'USD', dateFormat: '%Y' });

    expect(transactionRepo.aggregateCategoryTotalsByPeriod).toHaveBeenCalledWith('user1', 'income', '%Y');
  });
});
