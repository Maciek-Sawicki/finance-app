import mongoose from "mongoose";
import Transaction from "../models/transaction.model.js";
import { convertCurrency } from "../services/exchangeRate.service.js";
import { CATEGORY_TYPES } from "../constants/transactionTypes.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

interface AggregatedRow {
  _id: { month?: string; year?: string; categoryId: mongoose.Types.ObjectId | null; currency: string | null };
  categoryName: string | null;
  icon: string | null;
  color: string | null;
  totalAmount: number;
}

interface CategoryBucket {
  name: string;
  icon: string | null;
  color: string | null;
  sumsByCurrency: Record<string, number>;
}

interface CategoryTotal {
  name: string;
  icon: string | null;
  color: string | null;
  total: number;
}

interface CategoryResult {
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
  total: number;
  percent: number;
}

export const getMonthlyTopCategories = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { type, targetCurrency, limit } = req.query as { type?: string; targetCurrency?: string; limit?: string };

  if (!targetCurrency) return res.status(400).json({ message: "targetCurrency is required." });
  if (!type || !(CATEGORY_TYPES as readonly string[]).includes(type))
    return res.status(400).json({ message: "Type is required and must be 'income' or 'expense'." });

  const aggregated = await Transaction.aggregate<AggregatedRow>([
    { $match: { userId, type, exclude: { $ne: true }, settled: true } },
    {
      $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "category" }
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    { $match: { $or: [{ "category.type": { $ne: "transfer" } }, { category: null }] } },
    {
      $lookup: { from: "accounts", localField: "accountId", foreignField: "_id", as: "account" }
    },
    { $unwind: { path: "$account", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { month: { $dateToString: { format: "%Y-%m", date: "$date" } }, categoryId: "$category._id", currency: "$account.currency" },
        categoryName: { $first: "$category.name" },
        icon: { $first: "$category.icon" },
        color: { $first: "$category.color" },
        totalAmount: { $sum: "$amount" }
      }
    }
  ]);

  const monthMap: Record<string, Record<string, CategoryBucket>> = {};
  aggregated.forEach(item => {
    const month = item._id.month as string;
    const catId = item._id.categoryId ? item._id.categoryId.toString() : "Uncategorized";
    if (!monthMap[month]) monthMap[month] = {};
    if (!monthMap[month][catId]) monthMap[month][catId] = { name: item.categoryName || "Uncategorized", icon: item.icon || null, color: item.color || null, sumsByCurrency: {} };
    const currency = item._id.currency || targetCurrency;
    monthMap[month][catId].sumsByCurrency[currency] = (monthMap[month][catId].sumsByCurrency[currency] || 0) + item.totalAmount;
  });

  const result: Record<string, CategoryResult[]> = {};

  for (const [month, categories] of Object.entries(monthMap)) {
    const allCurrencies = new Set<string>();
    Object.values(categories).forEach(cat => Object.keys(cat.sumsByCurrency).forEach(c => allCurrencies.add(c)));

    const currencyRates: Record<string, number> = {};
    await Promise.all(Array.from(allCurrencies).map(async currency => {
      currencyRates[currency] = currency === targetCurrency ? 1 : await convertCurrency(1, currency, targetCurrency);
    }));

    const categoryTotalsMap: Record<string, CategoryTotal> = {};
    let sumAll = 0;
    for (const [catId, cat] of Object.entries(categories)) {
      let total = 0;
      for (const [currency, amount] of Object.entries(cat.sumsByCurrency)) {
        total += amount * currencyRates[currency];
      }
      categoryTotalsMap[catId] = { ...cat, total };
      sumAll += total;
    }

    let categoriesArray: CategoryResult[] = Object.entries(categoryTotalsMap)
      .map(([catId, cat]) => ({ categoryId: catId, name: cat.name, icon: cat.icon, color: cat.color, total: Number(cat.total.toFixed(2)), percent: sumAll ? Number(((cat.total / sumAll) * 100).toFixed(2)) : 0 }))
      .sort((a, b) => b.total - a.total);

    if (limit && categoriesArray.length > Number(limit)) {
      const top = categoriesArray.slice(0, Number(limit));
      const other = categoriesArray.slice(Number(limit));
      const otherTotal = other.reduce((sum, c) => sum + c.total, 0);
      const otherPercent = sumAll ? Number(((otherTotal / sumAll) * 100).toFixed(2)) : 0;
      top.push({ categoryId: "Other", name: "Other", icon: null, color: null, total: Number(otherTotal.toFixed(2)), percent: otherPercent });
      categoriesArray = top;
    }

    result[month] = categoriesArray;
  }

  res.status(200).json({ targetCurrency, type, monthlyCategories: result });
});

export const getYearlyTopCategories = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { type, targetCurrency, limit } = req.query as { type?: string; targetCurrency?: string; limit?: string };

  if (!targetCurrency) return res.status(400).json({ message: "targetCurrency is required." });
  if (!type || !(CATEGORY_TYPES as readonly string[]).includes(type))
    return res.status(400).json({ message: "Type is required and must be 'income' or 'expense'." });

  const aggregated = await Transaction.aggregate<AggregatedRow>([
    { $match: { userId, type, exclude: { $ne: true }, settled: true } },
    {
      $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "category" }
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    { $match: { $or: [{ "category.type": { $ne: "transfer" } }, { category: null }] } },
    {
      $lookup: { from: "accounts", localField: "accountId", foreignField: "_id", as: "account" }
    },
    { $unwind: { path: "$account", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { year: { $dateToString: { format: "%Y", date: "$date" } }, categoryId: "$category._id", currency: "$account.currency" },
        categoryName: { $first: "$category.name" },
        icon: { $first: "$category.icon" },
        color: { $first: "$category.color" },
        totalAmount: { $sum: "$amount" }
      }
    }
  ]);

  const yearMap: Record<string, Record<string, CategoryBucket>> = {};
  aggregated.forEach(item => {
    const year = item._id.year as string;
    const catId = item._id.categoryId ? item._id.categoryId.toString() : "Uncategorized";
    if (!yearMap[year]) yearMap[year] = {};
    if (!yearMap[year][catId]) yearMap[year][catId] = { name: item.categoryName || "Uncategorized", icon: item.icon || null, color: item.color || null, sumsByCurrency: {} };
    const currency = item._id.currency || targetCurrency;
    yearMap[year][catId].sumsByCurrency[currency] = (yearMap[year][catId].sumsByCurrency[currency] || 0) + item.totalAmount;
  });

  const result: Record<string, CategoryResult[]> = {};
  for (const [year, categories] of Object.entries(yearMap)) {
    const allCurrencies = new Set<string>();
    Object.values(categories).forEach(cat => Object.keys(cat.sumsByCurrency).forEach(c => allCurrencies.add(c)));

    const currencyRates: Record<string, number> = {};
    await Promise.all(Array.from(allCurrencies).map(async currency => {
      currencyRates[currency] = currency === targetCurrency ? 1 : await convertCurrency(1, currency, targetCurrency);
    }));

    const categoryTotalsMap: Record<string, CategoryTotal> = {};
    let sumAll = 0;
    for (const [catId, cat] of Object.entries(categories)) {
      let total = 0;
      for (const [currency, amount] of Object.entries(cat.sumsByCurrency)) total += amount * currencyRates[currency];
      categoryTotalsMap[catId] = { ...cat, total };
      sumAll += total;
    }

    let categoriesArray: CategoryResult[] = Object.entries(categoryTotalsMap)
      .map(([catId, cat]) => ({ categoryId: catId, name: cat.name, icon: cat.icon, color: cat.color, total: Number(cat.total.toFixed(2)), percent: sumAll ? Number(((cat.total / sumAll) * 100).toFixed(2)) : 0 }))
      .sort((a, b) => b.total - a.total);

    if (limit && categoriesArray.length > Number(limit)) {
      const top = categoriesArray.slice(0, Number(limit));
      const other = categoriesArray.slice(Number(limit));
      const otherTotal = other.reduce((sum, c) => sum + c.total, 0);
      const otherPercent = sumAll ? Number(((otherTotal / sumAll) * 100).toFixed(2)) : 0;
      top.push({ categoryId: "Other", name: "Other", icon: null, color: null, total: Number(otherTotal.toFixed(2)), percent: otherPercent });
      categoriesArray = top;
    }

    result[year] = categoriesArray;
  }

  res.status(200).json({ targetCurrency, type, yearlyCategories: result });
});
