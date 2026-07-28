import * as transactionRepository from "../repositories/transaction.repository.js";
import * as exchangeRateService from "./exchangeRate.service.js";
import type { CurrencyService } from "./exchangeRate.service.js";
import type { Id } from "../types/common.js";

type TransactionRepository = typeof transactionRepository;

interface CategoryBucket {
  name: string;
  icon: string | null;
  color: string | null;
  sumsByCurrency: Record<string, number>;
}

interface CategoryResult {
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
  total: number;
  percent: number;
}

interface GetTopCategoriesInput {
  type: string;
  targetCurrency: string;
  limit?: number;
  dateFormat: "%Y-%m" | "%Y";
}

export const createCategoryBreakdownService = (
  transactionRepository: TransactionRepository,
  currencyService: CurrencyService
) => {
  // Shared by the monthly and yearly breakdown endpoints: bucket by
  // period/category, convert each currency bucket into targetCurrency, then
  // sort and fold anything past `limit` into a single "Other" row.
  const getTopCategoriesByPeriod = async (userId: Id, { type, targetCurrency, limit, dateFormat }: GetTopCategoriesInput) => {
    const aggregated = await transactionRepository.aggregateCategoryTotalsByPeriod(userId, type, dateFormat);

    const periodMap: Record<string, Record<string, CategoryBucket>> = {};
    aggregated.forEach((item) => {
      const period = item._id.period;
      const catId = item._id.categoryId ? item._id.categoryId.toString() : "Uncategorized";
      if (!periodMap[period]) periodMap[period] = {};
      if (!periodMap[period][catId]) {
        periodMap[period][catId] = {
          name: item.categoryName || "Uncategorized",
          icon: item.icon || null,
          color: item.color || null,
          sumsByCurrency: {},
        };
      }
      const currency = item._id.currency || targetCurrency;
      periodMap[period][catId].sumsByCurrency[currency] = (periodMap[period][catId].sumsByCurrency[currency] || 0) + item.totalAmount;
    });

    const result: Record<string, CategoryResult[]> = {};

    for (const [period, categories] of Object.entries(periodMap)) {
      const allCurrencies = new Set<string>();
      Object.values(categories).forEach((cat) => Object.keys(cat.sumsByCurrency).forEach((c) => allCurrencies.add(c)));

      const currencyRates: Record<string, number> = {};
      await Promise.all(Array.from(allCurrencies).map(async (currency) => {
        currencyRates[currency] = currency === targetCurrency ? 1 : await currencyService.convertCurrency(1, currency, targetCurrency);
      }));

      let sumAll = 0;
      const rawTotals = Object.entries(categories).map(([catId, cat]) => {
        let total = 0;
        for (const [currency, amount] of Object.entries(cat.sumsByCurrency)) total += amount * currencyRates[currency];
        sumAll += total;
        return { catId, cat, rawTotal: total };
      });

      let categoriesArray: CategoryResult[] = rawTotals
        .map(({ catId, cat, rawTotal }) => ({
          categoryId: catId,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          total: Number(rawTotal.toFixed(2)),
          percent: sumAll ? Number(((rawTotal / sumAll) * 100).toFixed(2)) : 0,
        }))
        .sort((a, b) => b.total - a.total);

      if (limit && categoriesArray.length > limit) {
        const top = categoriesArray.slice(0, limit);
        const other = categoriesArray.slice(limit);
        const otherTotal = other.reduce((sum, c) => sum + c.total, 0);
        const otherPercent = sumAll ? Number(((otherTotal / sumAll) * 100).toFixed(2)) : 0;
        top.push({ categoryId: "Other", name: "Other", icon: null, color: null, total: Number(otherTotal.toFixed(2)), percent: otherPercent });
        categoriesArray = top;
      }

      result[period] = categoriesArray;
    }

    return result;
  };

  return { getTopCategoriesByPeriod };
};

const defaultService = createCategoryBreakdownService(transactionRepository, exchangeRateService);

export const { getTopCategoriesByPeriod } = defaultService;
