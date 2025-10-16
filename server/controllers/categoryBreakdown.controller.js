import Transaction from "../models/transaction.model.js";
import { convertCurrency } from "../services/exchangeRate.service.js";
const ALLOWED_TYPES = ["income", "expense"];

export const getTopCategories = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, type, targetCurrency, limit } = req.query;

    if (!targetCurrency) {
      return res.status(400).json({ message: "targetCurrency is required." });
    }

    if (!type || !["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Type is required and must be 'income' or 'expense'." });
    }

    const match = {
      userId,
      type,
      exclude: { $ne: true },
      settled: true
    };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.date.$lte = end;
      }
    }

    // MongoDB aggregation pipeline
    const aggregated = await Transaction.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { "category.type": { $ne: "transfer" } },
            { category: null }
          ]
        }
      },
      {
        $lookup: {
          from: "accounts",
          localField: "accountId",
          foreignField: "_id",
          as: "account"
        }
      },
      { $unwind: { path: "$account", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { categoryId: "$category._id", currency: "$account.currency" },
          categoryName: { $first: "$category.name" },
          icon: { $first: "$category.icon" },
          color: { $first: "$category.color" },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    // Category map with sums by currency
    const categoryMap = {};
    aggregated.forEach(item => {
      const catId = item._id.categoryId ? item._id.categoryId.toString() : "Uncategorized";
      if (!categoryMap[catId]) {
        categoryMap[catId] = {
          name: item.categoryName || "Uncategorized",
          icon: item.icon || null,
          color: item.color || null,
          sumsByCurrency: {}
        };
      }
      const currency = item._id.currency || targetCurrency;
      categoryMap[catId].sumsByCurrency[currency] = (categoryMap[catId].sumsByCurrency[currency] || 0) + item.totalAmount;
    });


    const categoryTotalsMap = {};
    let sumAll = 0;

    for (const [catId, cat] of Object.entries(categoryMap)) {
      let total = 0;
      for (const [currency, amount] of Object.entries(cat.sumsByCurrency)) {
        const converted = currency === targetCurrency ? amount : await convertCurrency(amount, currency, targetCurrency);
        total += converted;
      }
      categoryTotalsMap[catId] = {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        total
      };
      sumAll += total;
    }

    let categoriesArray = Object.entries(categoryTotalsMap)
      .map(([catId, cat]) => ({
        categoryId: catId,
        ...cat,
        percent: sumAll ? Number(((cat.total / sumAll) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.total - a.total);

    if (limit && categoriesArray.length > Number(limit)) {
      const top = categoriesArray.slice(0, Number(limit));
      const other = categoriesArray.slice(Number(limit));

      const otherTotal = other.reduce((sum, c) => sum + c.total, 0);
      const otherPercent = sumAll ? Number(((otherTotal / sumAll) * 100).toFixed(2)) : 0;

      top.push({
        categoryId: "Other",
        name: "Other",
        icon: null,
        color: null,
        total: Number(otherTotal.toFixed(2)),
        percent: otherPercent
      });

      categoriesArray = top;
    }

    res.status(200).json({
      targetCurrency,
      type,
      topCategories: categoriesArray
    });

  } catch (error) {
    console.error("Error fetching top categories:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getMonthlyTopCategories = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, targetCurrency, limit } = req.query;

    if (!targetCurrency) return res.status(400).json({ message: "targetCurrency is required." });
    if (!type || !ALLOWED_TYPES.includes(type))
      return res.status(400).json({ message: "Type is required and must be 'income' or 'expense'." });

    const aggregated = await Transaction.aggregate([
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

    const monthMap = {};
    aggregated.forEach(item => {
      const month = item._id.month;
      const catId = item._id.categoryId ? item._id.categoryId.toString() : "Uncategorized";
      if (!monthMap[month]) monthMap[month] = {};
      if (!monthMap[month][catId]) monthMap[month][catId] = { name: item.categoryName || "Uncategorized", icon: item.icon || null, color: item.color || null, sumsByCurrency: {} };
      const currency = item._id.currency || targetCurrency;
      monthMap[month][catId].sumsByCurrency[currency] = (monthMap[month][catId].sumsByCurrency[currency] || 0) + item.totalAmount;
    });

    const result = {};

    for (const [month, categories] of Object.entries(monthMap)) {
      const allCurrencies = new Set();
      Object.values(categories).forEach(cat => Object.keys(cat.sumsByCurrency).forEach(c => allCurrencies.add(c)));

      const currencyRates = {};
      await Promise.all(Array.from(allCurrencies).map(async currency => {
        currencyRates[currency] = currency === targetCurrency ? 1 : await convertCurrency(1, currency, targetCurrency);
      }));

      const categoryTotalsMap = {};
      let sumAll = 0;
      for (const [catId, cat] of Object.entries(categories)) {
        let total = 0;
        for (const [currency, amount] of Object.entries(cat.sumsByCurrency)) {
          total += amount * currencyRates[currency];
        }
        categoryTotalsMap[catId] = { ...cat, total };
        sumAll += total;
      }

      let categoriesArray = Object.entries(categoryTotalsMap)
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
  } catch (err) {
    console.error("Error fetching monthly top categories fast:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getYearlyTopCategories = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, targetCurrency, limit } = req.query;

    if (!targetCurrency) return res.status(400).json({ message: "targetCurrency is required." });
    if (!type || !ALLOWED_TYPES.includes(type))
      return res.status(400).json({ message: "Type is required and must be 'income' or 'expense'." });

    const aggregated = await Transaction.aggregate([
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

    const yearMap = {};
    aggregated.forEach(item => {
      const year = item._id.year;
      const catId = item._id.categoryId ? item._id.categoryId.toString() : "Uncategorized";
      if (!yearMap[year]) yearMap[year] = {};
      if (!yearMap[year][catId]) yearMap[year][catId] = { name: item.categoryName || "Uncategorized", icon: item.icon || null, color: item.color || null, sumsByCurrency: {} };
      const currency = item._id.currency || targetCurrency;
      yearMap[year][catId].sumsByCurrency[currency] = (yearMap[year][catId].sumsByCurrency[currency] || 0) + item.totalAmount;
    });

    const result = {};
    for (const [year, categories] of Object.entries(yearMap)) {
      const allCurrencies = new Set();
      Object.values(categories).forEach(cat => Object.keys(cat.sumsByCurrency).forEach(c => allCurrencies.add(c)));

      const currencyRates = {};
      await Promise.all(Array.from(allCurrencies).map(async currency => {
        currencyRates[currency] = currency === targetCurrency ? 1 : await convertCurrency(1, currency, targetCurrency);
      }));

      const categoryTotalsMap = {};
      let sumAll = 0;
      for (const [catId, cat] of Object.entries(categories)) {
        let total = 0;
        for (const [currency, amount] of Object.entries(cat.sumsByCurrency)) total += amount * currencyRates[currency];
        categoryTotalsMap[catId] = { ...cat, total };
        sumAll += total;
      }

      let categoriesArray = Object.entries(categoryTotalsMap)
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
  } catch (err) {
    console.error("Error fetching yearly top categories fast:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

