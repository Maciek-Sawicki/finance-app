import * as transactionRepository from "../repositories/transaction.repository.js";
import * as exchangeRateService from "./exchangeRate.service.js";
import type { CurrencyService } from "./exchangeRate.service.js";
import type { Id } from "../types/common.js";

type TransactionRepository = typeof transactionRepository;

interface CurrencyTotals {
  [currency: string]: number;
}

interface MonthBucket {
  income: CurrencyTotals;
  expense: CurrencyTotals;
}

interface MonthSummary {
  totalIncome: number;
  totalExpense: number;
  profit: number;
  e_i_ratio: number | null;
}

export const createSummaryService = (transactionRepository: TransactionRepository, currencyService: CurrencyService) => {
  const getMonthlySummary = async (userId: Id, targetCurrency: string): Promise<Record<string, MonthSummary>> => {
    const aggregated = await transactionRepository.aggregateMonthlySummary(userId);

    const monthMap: Record<string, MonthBucket> = {};
    aggregated.forEach(({ _id: { month, type, currency }, totalAmount }) => {
      const resolvedCurrency = currency || targetCurrency;
      if (!monthMap[month]) monthMap[month] = { income: {}, expense: {} };
      const bucket = monthMap[month][type as "income" | "expense"];
      bucket[resolvedCurrency] = (bucket[resolvedCurrency] || 0) + totalAmount;
    });

    const result: Record<string, MonthSummary> = {};
    for (const [month, data] of Object.entries(monthMap)) {
      const currencies = new Set([...Object.keys(data.income), ...Object.keys(data.expense)]);
      const rates: Record<string, number> = {};
      await Promise.all(
        Array.from(currencies).map(async (currency) => {
          rates[currency] = currency === targetCurrency ? 1 : await currencyService.convertCurrency(1, currency, targetCurrency);
        })
      );

      const sumIn = (bucket: CurrencyTotals) =>
        Object.entries(bucket).reduce((sum, [currency, amount]) => sum + amount * rates[currency], 0);

      const totalIncome = Number(sumIn(data.income).toFixed(2));
      const totalExpense = Number(sumIn(data.expense).toFixed(2));

      result[month] = {
        totalIncome,
        totalExpense,
        profit: Number((totalIncome - totalExpense).toFixed(2)),
        e_i_ratio: totalIncome !== 0 ? Number(((totalExpense / totalIncome) * 100).toFixed(2)) : null,
      };
    }

    return result;
  };

  return { getMonthlySummary };
};

const defaultService = createSummaryService(transactionRepository, exchangeRateService);

export const { getMonthlySummary } = defaultService;
