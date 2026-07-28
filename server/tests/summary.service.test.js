import { createSummaryService } from '../services/summary.service.js';

const createFakeTransactionRepository = () => ({
  aggregateMonthlySummary: jest.fn(),
});

const createFakeCurrencyService = () => ({
  convertCurrency: jest.fn((amount) => Promise.resolve(amount)),
});

describe('summary.service', () => {
  describe('getMonthlySummary', () => {
    it('sums per month/type from the aggregation without re-querying transactions', async () => {
      const transactionRepository = createFakeTransactionRepository();
      transactionRepository.aggregateMonthlySummary.mockResolvedValue([
        { _id: { month: '2026-01', type: 'income', currency: 'USD' }, totalAmount: 1000 },
        { _id: { month: '2026-01', type: 'expense', currency: 'USD' }, totalAmount: 400 },
      ]);
      const service = createSummaryService(transactionRepository, createFakeCurrencyService());

      const result = await service.getMonthlySummary('user1', 'USD');

      expect(transactionRepository.aggregateMonthlySummary).toHaveBeenCalledWith('user1');
      expect(result).toEqual({
        '2026-01': { totalIncome: 1000, totalExpense: 400, profit: 600, e_i_ratio: 40 },
      });
    });

    it('converts a single rate per currency instead of once per transaction', async () => {
      const transactionRepository = createFakeTransactionRepository();
      const currencyService = createFakeCurrencyService();
      transactionRepository.aggregateMonthlySummary.mockResolvedValue([
        { _id: { month: '2026-01', type: 'income', currency: 'EUR' }, totalAmount: 100 },
      ]);
      currencyService.convertCurrency.mockResolvedValue(2);
      const service = createSummaryService(transactionRepository, currencyService);

      const result = await service.getMonthlySummary('user1', 'USD');

      expect(currencyService.convertCurrency).toHaveBeenCalledTimes(1);
      expect(currencyService.convertCurrency).toHaveBeenCalledWith(1, 'EUR', 'USD');
      expect(result['2026-01'].totalIncome).toBe(200);
    });

    it('returns a null e_i_ratio when there was no income that month', async () => {
      const transactionRepository = createFakeTransactionRepository();
      transactionRepository.aggregateMonthlySummary.mockResolvedValue([
        { _id: { month: '2026-01', type: 'expense', currency: 'USD' }, totalAmount: 50 },
      ]);
      const service = createSummaryService(transactionRepository, createFakeCurrencyService());

      const result = await service.getMonthlySummary('user1', 'USD');

      expect(result['2026-01'].e_i_ratio).toBeNull();
    });

    it('returns an empty object when there is nothing to summarize', async () => {
      const transactionRepository = createFakeTransactionRepository();
      transactionRepository.aggregateMonthlySummary.mockResolvedValue([]);
      const service = createSummaryService(transactionRepository, createFakeCurrencyService());

      expect(await service.getMonthlySummary('user1', 'USD')).toEqual({});
    });
  });
});
