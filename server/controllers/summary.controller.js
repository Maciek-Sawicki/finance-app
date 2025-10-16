import Transaction from "../models/transaction.model.js";
import Account from "../models/account.model.js";
import Category from "../models/category.model.js";
import mongoose from 'mongoose';
import { convertCurrency } from "../services/exchangeRate.service.js";
const ALLOWED_TYPES = ["income", "expense", "exclude"];

export const getAccountTransactionSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { accountId, startDate, endDate, categoryId, type, targetCurrency } = req.query;

    if (!accountId) {
      return res.status(400).json({ message: "accountId is required." });
    }

    const filter = { userId, accountId: new mongoose.Types.ObjectId(accountId) };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (categoryId) filter.categoryId = new mongoose.Types.ObjectId(categoryId);
    if (type) {
      if (!ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({ message: "Invalid type." });
      }
      filter.type = type;
    }

    const transactions = await Transaction.find(filter).populate("accountId");

    const summary = {};
    for (const tx of transactions) {
      const accountCurrency = tx.accountId.currency;
      const originalAmount = tx.amount;
      const convertedAmount = targetCurrency
        ? await convertCurrency(originalAmount, accountCurrency, targetCurrency)
        : originalAmount;

      if (!summary[tx.type]) {
        summary[tx.type] = { total: 0, count: 0 };
      }

      summary[tx.type].total += convertedAmount;
      summary[tx.type].count += 1;
    }

    Object.keys(summary).forEach(key => {
      summary[key].total = Number(summary[key].total.toFixed(2));
    });

    res.status(200).json({ targetCurrency, summary });

  } catch (error) {
    console.error("Error fetching account summary:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAllAccountsTransactionSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, categoryId, type, targetCurrency } = req.query;

    if (!targetCurrency) {
      return res.status(400).json({ message: "targetCurrency is required." });
    }

    const filter = { userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }
    if (categoryId) filter.categoryId = new mongoose.Types.ObjectId(categoryId);
    if (type) {
      if (!ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({ message: "Invalid type." });
      }
      filter.type = type;
    }

    const transactions = await Transaction.find(filter).populate("accountId");

    const summary = {};
    for (const tx of transactions) {
      const accountCurrency = tx.accountId.currency;
      const convertedAmount = await convertCurrency(tx.amount, accountCurrency, targetCurrency);

      if (!summary[tx.type]) {
        summary[tx.type] = { totalAmount: 0 };
      }

      summary[tx.type].totalAmount += convertedAmount;
    }

    Object.keys(summary).forEach(key => {
      summary[key].totalAmount = Number(summary[key].totalAmount.toFixed(2));
    });

    res.status(200).json({ targetCurrency, summary });

  } catch (error) {
    console.error("Error fetching all accounts summary:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAccountCategorySummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { accountId, startDate, endDate, type, targetCurrency } = req.query;

    if (!accountId) {
      return res.status(400).json({ message: "accountId is required." });
    }

    const filter = { userId, accountId: new mongoose.Types.ObjectId(accountId) };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (type) {
      if (!ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({ message: "Invalid type." });
      }
      filter.type = type;
    }

    const transactions = await Transaction.find(filter).populate("accountId categoryId");

    const summary = {};
    for (const tx of transactions) {
      const categoryName = tx.categoryId?.name || "Uncategorized";
      const accountCurrency = tx.accountId.currency;
      const convertedAmount = targetCurrency
        ? await convertCurrency(tx.amount, accountCurrency, targetCurrency)
        : tx.amount;

      if (!summary[categoryName]) {
        summary[categoryName] = { total: 0, count: 0 };
      }

      summary[categoryName].total += convertedAmount;
      summary[categoryName].count += 1;
    }

    Object.keys(summary).forEach(key => {
      summary[key].total = Number(summary[key].total.toFixed(2));
    });

    res.status(200).json({
      targetCurrency,
      summary
    });

  } catch (error) {
    console.error("Error fetching account category summary:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getBalanceSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetCurrency } = req.query;

    const accounts = await Account.find({ userId });

    let totalBalance = 0;
    const accountSummaries = [];

    for (const account of accounts) {
      const originalBalance = account.balance;
      const convertedBalance = targetCurrency
        ? await convertCurrency(originalBalance, account.currency, targetCurrency)
        : originalBalance;

      accountSummaries.push({
        accountId: account._id,
        name: account.name,
        currency: account.currency,
        originalBalance: Number(originalBalance.toFixed(2)),
        convertedBalance: Number(convertedBalance.toFixed(2))
      });
      totalBalance += convertedBalance;
    }
    res.status(200).json({
      targetCurrency: targetCurrency || "Original Currencies",
      totalBalance: Number(totalBalance.toFixed(2)),
      accounts: accountSummaries
    });
  } catch (error) {
    console.error("Error fetching balance summary:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNum;
};

export const getCashFlowSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, groupBy = 'monthly', targetCurrency } = req.query;

    const filter = { userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }
    const transactions = await Transaction.find(filter).populate("accountId");
    const grouped = {};

    for (const tx of transactions) {
      const date = new Date(tx.date);
      let period;
      switch (groupBy) {
        case "day":
          period = date.toISOString().split("T")[0]; // YYYY-MM-DD
          break;
        case "week":
          const weekNum = getWeekNumber(date);
          period = `${date.getUTCFullYear()}-W${weekNum.toString().padStart(2, "0")}`; // YYYY-Www
          break;
        case "month":
          period = date.toISOString().slice(0, 7); // YYYY-MM
          break;
        case "year":
          period = date.getUTCFullYear().toString(); // YYYY
          break;
        default:
          period = date.toISOString().split("T")[0];
      }

      const accountCurrency = tx.accountId.currency;
      const amount = targetCurrency
        ? await convertCurrency(tx.amount, accountCurrency, targetCurrency)
        : tx.amount;

      if (!grouped[period]) {
        grouped[period] = { income: 0, expense: 0, exclude: 0 };
      }

      grouped[period][tx.type] += amount;
    }

    const summary = Object.keys(grouped).map((period) => ({
      period,
      income: Number(grouped[period].income.toFixed(2)),
      expense: Number(grouped[period].expense.toFixed(2)),
      exclude: Number(grouped[period].exclude.toFixed(2)),
      balance: Number((grouped[period].income - grouped[period].expense).toFixed(2)),
      targetCurrency: targetCurrency || null,
    }));

    res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching cash flow summary:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getTrendsSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, type, targetCurrency, period = "month" } = req.query;

    if (!targetCurrency) {
      return res.status(400).json({ message: "targetCurrency is required." });
    }

    const filter = { userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (type) {
      filter.type = type;
    }

    const transactions = await Transaction.find(filter).populate("accountId");

    const summary = {};

    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      let periodKey;

      if (period === "month") {
        periodKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
      } else if (period === "year") {
        periodKey = `${txDate.getFullYear()}`;
      } else if (period === "week") {
        const firstDayOfYear = new Date(txDate.getFullYear(), 0, 1);
        const weekNumber = Math.ceil((((txDate - firstDayOfYear) / 86400000) + firstDayOfYear.getDay() + 1) / 7);
        periodKey = `${txDate.getFullYear()}-W${weekNumber}`;
      } else {
        return res.status(400).json({ message: "Invalid period. Use 'month', 'year', or 'week'." });
      }

      const convertedAmount = await convertCurrency(tx.amount, tx.accountId.currency, targetCurrency);

      if (!summary[periodKey]) {
        summary[periodKey] = { total: 0, count: 0 };
      }

      summary[periodKey].total += convertedAmount;
      summary[periodKey].count += 1;
    }

    Object.keys(summary).forEach(key => {
      summary[key].total = Number(summary[key].total.toFixed(2));
    });

    res.status(200).json({ targetCurrency, period, summary });
  } catch (error) {
    console.error("Error fetching trends summary:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getMonthlyTrends = async (req, res) => {
  try {
    const userId = req.user._id;
    const { year, month, type, targetCurrency } = req.query;

    if (!year || !month) {
      return res.status(400).json({ message: "year and month are required." });
    }

    if (!targetCurrency) {
      return res.status(400).json({ message: "targetCurrency is required." });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // ostatni dzień miesiąca

    const filter = { userId, date: { $gte: startDate, $lte: endDate } };
    if (type) filter.type = type;

    const transactions = await Transaction.find(filter).populate("accountId");

    const summary = { total: 0, count: 0 };

    for (const tx of transactions) {
      const convertedAmount = await convertCurrency(tx.amount, tx.accountId.currency, targetCurrency);
      summary.total += convertedAmount;
      summary.count += 1;
    }

    summary.total = Number(summary.total.toFixed(2));

    res.status(200).json({ year, month, type: type || "all", targetCurrency, summary });
  } catch (error) {
    console.error("Error fetching monthly trends:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// export const getTopCategories = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { startDate, endDate, limit = 5, targetCurrency, type } = req.query;

//     if (!targetCurrency) {
//       return res.status(400).json({ message: "targetCurrency is required." });
//     }

//     const filter = { userId, type };
//     if (startDate || endDate) {
//       filter.date = {};
//       if (startDate) filter.date.$gte = new Date(startDate);
//       if (endDate) {
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);
//         filter.date.$lte = end;
//       }
//     }

//     const transactions = await Transaction.find(filter).populate("categoryId accountId");

//     const categoryTotals = {};
//     for (const tx of transactions) {
//       const convertedAmount = await convertCurrency(tx.amount, tx.accountId.currency, targetCurrency);
//       const catName = tx.categoryId.name;
//       if (!categoryTotals[catName]) categoryTotals[catName] = 0;
//       categoryTotals[catName] += convertedAmount;
//     }

//     const topCategories = Object.entries(categoryTotals)
//       .sort((a, b) => b[1] - a[1])
//       .slice(0, limit)
//       .map(([name, total]) => ({ name, total: Number(total.toFixed(2)) }));

//     res.status(200).json({ targetCurrency, topCategories });
//   } catch (error) {
//     console.error("Error fetching top categories:", error);
//     res.status(500).json({ message: "Internal server error." });
//   }
// };

export const getSavingsRate = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, targetCurrency } = req.query;

    if (!targetCurrency) {
      return res.status(400).json({ message: "targetCurrency is required." });
    }

    const filter = { userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const transactions = await Transaction.find(filter).populate("accountId");

    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of transactions) {
      const convertedAmount = await convertCurrency(tx.amount, tx.accountId.currency, targetCurrency);
      if (tx.type === "income") totalIncome += convertedAmount;
      else if (tx.type === "expense") totalExpense += convertedAmount;
    }

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    res.status(200).json({
      targetCurrency,
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      savingsRate: Number(savingsRate.toFixed(2)) // procent
    });
  } catch (error) {
    console.error("Error fetching savings rate:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getMonthlySummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetCurrency } = req.query;

    if (!targetCurrency) return res.status(400).json({ message: "targetCurrency is required." });

    const aggregated = await Transaction.aggregate([
      { $match: { userId, excluded: { $ne: true }, settled: true } },
      {
        $lookup: { from: "accounts", localField: "accountId", foreignField: "_id", as: "account" }
      },
      { $unwind: { path: "$account", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { month: { $dateToString: { format: "%Y-%m", date: "$date" } }, type: "$type", currency: "$account.currency" },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    const monthMap = {};
    aggregated.forEach(item => {
      const month = item._id.month;
      const type = item._id.type;
      const currency = item._id.currency || targetCurrency;

      if (!monthMap[month]) monthMap[month] = { income: {}, expense: {} };
      if (!monthMap[month][type][currency]) monthMap[month][type][currency] = 0;
      monthMap[month][type][currency] += item.totalAmount;
    });

    const result = {};

    for (const [month, data] of Object.entries(monthMap)) {
      const allCurrencies = new Set([...Object.keys(data.income), ...Object.keys(data.expense)]);
      const currencyRates = {};
      await Promise.all(Array.from(allCurrencies).map(async currency => {
        currencyRates[currency] = currency === targetCurrency ? 1 : await convertCurrency(1, currency, targetCurrency);
      }));

      let totalIncome = 0;
      let totalExpense = 0;

      for (const [currency, amount] of Object.entries(data.income)) {
        totalIncome += amount * currencyRates[currency];
      }

      for (const [currency, amount] of Object.entries(data.expense)) {
        totalExpense += amount * currencyRates[currency];
      }

      totalIncome = Number(totalIncome.toFixed(2));
      totalExpense = Number(totalExpense.toFixed(2));
      const profit = Number((totalIncome - totalExpense).toFixed(2));

      const e_i_ratio = totalIncome !== 0 ? Number(((totalExpense / totalIncome) * 100).toFixed(2)) : null;

      result[month] = {
        totalIncome,
        totalExpense,
        profit,
        e_i_ratio
      };
    }

    res.status(200).json({ targetCurrency, monthlySummary: result });
  } catch (err) {
    console.error("Error fetching monthly summary:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};





