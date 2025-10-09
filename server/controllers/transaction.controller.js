import Transaction from "../models/transaction.model.js";
import Transfer from "../models/transfer.model.js";
import Category from "../models/category.model.js"; 
import Account from "../models/account.model.js";
import { convertCurrency } from "../services/exchangeRate.service.js";


const ALLOWED_TYPES = ["income", "expense", "exclude", "transfer"];

export const createTransaction = async (req, res) => {
  try {
    const { categoryId, accountId, type, amount, date, settled, description, exclude } = req.body;
    const userId = req.user._id;

    if (!categoryId || !accountId || !type || !amount) {
      return res.status(400).json({ message: "Category, Account, Type and Amount are required." });
    }
    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Type must be either 'income' or 'expense'." });
    }
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number." });
    }
  
    const newTransaction = new Transaction({
      userId,
      categoryId,
      accountId,
      type,
      amount: Number(amount.toFixed(2)),
      date: date || Date.now(),
      settled: settled || false,
      description,
      exclude: exclude || false, 
      isTransfer: false         
    });

    await newTransaction.save();
    res.status(201).json({ message: "Transaction created successfully", transaction: newTransaction });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const createTransfer = async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, toAmount: customToAmount, date, description } = req.body;
    const userId = req.user._id;

    if (!fromAccountId || !toAccountId || !amount) {
      return res.status(400).json({ message: "From Account, To Account and Amount are required." });
    }
    if (fromAccountId === toAccountId) {
      return res.status(400).json({ message: "From and To accounts must be different." });
    }
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number." });
    }

    const transferDate = date || new Date();

    const fromAccount = await Account.findById(fromAccountId);
    const toAccount = await Account.findById(toAccountId);
    if (!fromAccount || !toAccount) {
      return res.status(404).json({ message: "One of the accounts not found." });
    }

    let toAmount = Number(amount.toFixed(2));
    let exchangeRate = 1;

    if (fromAccount.currency !== toAccount.currency) {
      if (customToAmount && !isNaN(customToAmount)) {
        toAmount = Number(customToAmount.toFixed(2));
        exchangeRate = Number((toAmount / amount).toFixed(6));
      } else {
        toAmount = await convertCurrency(amount, fromAccount.currency, toAccount.currency);
        exchangeRate = Number((toAmount / amount).toFixed(6));
      }
    }

    let transferCategory = await Category.findOne({ name: "Transfer", userId });
    if (!transferCategory) {
      transferCategory = await Category.create({
        name: "Transfer",
        type: "expense",
        userId,
        icon: "🔄",
        color: "#888888",
        favorite: false,
      });
    }

    const transfer = await Transfer.create({
      userId,
      fromAccountId,
      toAccountId,
      fromAmount: Number(amount.toFixed(2)),
      toAmount,
      exchangeRate,
    });

    const expenseTransaction = await Transaction.create({
      userId,
      accountId: fromAccountId,
      type: "expense",
      amount: Number(amount.toFixed(2)),
      date: transferDate,
      settled: true,
      categoryId: transferCategory._id,
      description: description
        ? `Transfer to ${toAccount.name} (${toAmount} ${toAccount.currency}): ${description}`
        : `Transfer to ${toAccount.name} (${toAmount} ${toAccount.currency})`,
      transferId: transfer._id,
    });

    const incomeTransaction = await Transaction.create({
      userId,
      accountId: toAccountId,
      type: "income",
      amount: toAmount,
      date: transferDate,
      settled: true,
      categoryId: transferCategory._id,
      description: description
        ? `Transfer from ${fromAccount.name} (${amount} ${fromAccount.currency}): ${description}`
        : `Transfer from ${fromAccount.name} (${amount} ${fromAccount.currency})`,
      transferId: transfer._id,
    });

    res.status(201).json({
      message: "Transfer created successfully",
      transfer,
      transactions: [expenseTransaction, incomeTransaction],
    });
  } catch (error) {
    console.error("Error creating transfer:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id }).populate("categoryId accountId");
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }
    res.status(200).json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const updated = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...req.body },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Transaction not found." });
    }
    res.status(200).json({ message: "Transaction updated successfully", transaction: updated });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const deleted = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) {
      return res.status(404).json({ message: "Transaction not found." });
    }
    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, type, categoryId, accountId, page = 1, limit = 20 } = req.query;
    const filter = { userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (type) {
      if (!ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({ message: "Type must be either 'income' or 'expense'." });
      }
      filter.type = type;
    }
    if (categoryId) filter.categoryId = categoryId;
    if (accountId) filter.accountId = accountId;

    const pageNum = Math.max(1, parseInt(page, 10), 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10), 1));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("categoryId accountId"),
        Transaction.countDocuments(filter)
    ]);

    res.status(200).json({
      data: transactions,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
    });

  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const toggleTransactionSettled = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const transaction = await Transaction.findOne({ _id: id, userId });
    if (!transaction) return res.status(404).json({ message: "Transaction not found." });

    transaction.settled = !transaction.settled;
    await transaction.save();

    res.status(200).json({ message: "Transaction updated", transaction });
  } catch (error) {
    console.error("Error toggling settled:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
