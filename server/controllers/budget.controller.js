import Budget from "../models/budget.model.js";
import Transaction from "../models/transaction.model.js";
import Category from "../models/category.model.js";
import mongoose from "mongoose";
import { convertCurrency } from "../services/exchangeRate.service.js";

const calculateBudgetProgress = async (budget, userId, targetCurrency) => {
  const transactions = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        categoryId: new mongoose.Types.ObjectId(budget.categoryId._id),
        date: { $gte: budget.startDate, $lte: budget.endDate },
        type: "expense",
        settled: true,
      },
    },
    {
      $lookup: {
        from: "accounts",
        localField: "accountId",
        foreignField: "_id",
        as: "account",
      },
    },
    { $unwind: { path: "$account", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        amount: 1,
        currency: "$account.currency",
      },
    },
  ]);

  let spentTotal = 0;

  for (const tx of transactions) {
    try {
      const converted = await convertCurrency(tx.amount, tx.currency, targetCurrency);
      spentTotal += converted;
    } catch (err) {
      console.warn(`Currency conversion failed for ${tx.amount} ${tx.currency}:`, err.message);
    }
  }

  let convertedBudgetAmount = budget.amount;
  if (budget.currency !== targetCurrency) {
    try {
      convertedBudgetAmount = await convertCurrency(budget.amount, budget.currency, targetCurrency);
    } catch (err) {
      console.warn(`Budget conversion failed for ${budget.amount} ${budget.currency}:`, err.message);
    }
  }

  // const progress = Math.min((spentTotal / convertedBudgetAmount) * 100, 100);
  const progress = (spentTotal / convertedBudgetAmount) * 100;

  return {
    ...budget,
    originalAmount: budget.amount,
    originalCurrency: budget.currency,
    convertedAmount: Number(convertedBudgetAmount.toFixed(2)),

    spent: Number(spentTotal.toFixed(2)),
    progress,
    targetCurrency,
  };
};


export const createBudget = async (req, res) => {
  try {
    const userId = req.user._id;
    const { categoryId, amount, currency, startDate, endDate, type, recurrencePeriod } = req.body;

    if (!categoryId || !amount || !currency || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const category = await Category.findOne({ _id: categoryId, userId });
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }
    if (category.type !== "expense") {
      return res.status(400).json({ message: "Budget can only be assigned to an expense category." });
    }

    if (type === "fixed" && recurrencePeriod) {
      return res.status(400).json({ message: "Fixed budgets cannot have recurrencePeriod." });
    }

    const newBudget = await Budget.create({
      userId,
      categoryId,
      amount,
      currency,
      startDate,
      endDate,
      type,
      recurrencePeriod,
    });

    res.status(201).json(newBudget);

  } catch (error) {
    console.error("Error creating budget:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const getBudgets = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, type, targetCurrency } = req.query;

    if (!targetCurrency)
      return res.status(400).json({ message: "targetCurrency is required." });

    const filters = { userId };
    if (status) filters.status = status;
    if (type) filters.type = type;

    const budgets = await Budget.find(filters)
      .populate("categoryId", "name icon color type")
      .sort({ startDate: -1 })
      .lean();

    const enriched = await Promise.all(
      budgets.map((b) => calculateBudgetProgress(b, userId, targetCurrency))
    );

    res.status(200).json(enriched);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


export const getBudgetById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { targetCurrency } = req.query;

    if (!targetCurrency)
      return res.status(400).json({ message: "targetCurrency is required." });

    const budget = await Budget.findOne({ _id: id, userId })
      .populate("categoryId", "name icon color type")
      .lean();

    if (!budget) {
      return res.status(404).json({ message: "Budget not found." });
    }

    const enriched = await calculateBudgetProgress(budget, userId, targetCurrency);

    res.status(200).json(enriched);
  } catch (error) {
    console.error("Error fetching budget:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const updates = req.body;

    if (updates.endDate && new Date(updates.endDate) < new Date()) {
      updates.status = "completed";
    }

    const updated = await Budget.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Budget not found." });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deleted = await Budget.findOneAndDelete({ _id: id, userId });

    if (!deleted) {
      return res.status(404).json({ message: "Budget not found." });
    }

    res.status(200).json({ message: "Budget deleted successfully." });
  } catch (error) {
    console.error("Error deleting budget:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getBudgetsByType = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetCurrency, status } = req.query;

    if (!targetCurrency)
      return res.status(400).json({ message: "targetCurrency is required." });

    if (!["completed", "active"].includes(status))
      return res.status(400).json({ message: "Invalid status parameter." });

    const now = new Date();

    const filter = { userId, status };

    // if (status === "active") {
    //   filter.startDate = { $lte: now };
    //   filter.endDate = { $gte: now };
    // }

    const budgets = await Budget.find(filter)
      .populate("categoryId", "name icon color type")
      .lean();

    const enriched = await Promise.all(
      budgets.map((b) => calculateBudgetProgress(b, userId, targetCurrency))
    );

    res.status(200).json(enriched);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


export const getBudgetHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { categoryId } = req.params;
    const { targetCurrency } = req.query;

    if (!targetCurrency)
      return res.status(400).json({ message: "targetCurrency is required." });

    const budgets = await Budget.find({ userId, categoryId })
      .sort({ startDate: -1 })
      .populate("categoryId", "name icon color type")
      .lean();

    const enriched = await Promise.all(
      budgets.map(async (b) => {
        const full = await calculateBudgetProgress(b, userId, targetCurrency);
        const status =
          new Date() > b.endDate || full.spent >= b.amount
            ? "completed"
            : "active";
        return { ...full, status };
      })
    );

    res.status(200).json(enriched);
  } catch (error) {
    console.error("Error fetching budget history:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

