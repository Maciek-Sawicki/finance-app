import * as transactionService from "../services/transaction.service.js";
import * as transferService from "../services/transfer.service.js";
import { TRANSACTION_FILTER_TYPES } from "../constants/transactionTypes.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const createTransaction = asyncHandler(async (req, res) => {
  const { categoryId, accountId, type, amount, date, settled, description, exclude } = req.body;

  if (!categoryId || !accountId || !type || !amount) {
    return res.status(400).json({ message: "Category, Account, Type and Amount are required." });
  }
  if (!["income", "expense"].includes(type)) {
    return res.status(400).json({ message: "Type must be either 'income' or 'expense'." });
  }
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: "Amount must be a positive number." });
  }

  const transaction = await transactionService.create(req.user._id, {
    categoryId, accountId, type, amount, date, settled, description, exclude,
  });

  res.status(201).json({ message: "Transaction created successfully", transaction });
});

export const createTransfer = asyncHandler(async (req, res) => {
  const { fromAccountId, toAccountId, amount, toAmount, date, description } = req.body;

  if (!fromAccountId || !toAccountId || !amount) {
    return res.status(400).json({ message: "From Account, To Account and Amount are required." });
  }
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: "Amount must be a positive number." });
  }

  const result = await transferService.create(req.user._id, {
    fromAccountId, toAccountId, amount, toAmount, date, description,
  });

  res.status(201).json({
    message: "Transfer created successfully",
    transfer: result.transfer,
    transactions: result.transactions,
  });
});

export const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.getById(req.user._id, req.params.id);
  if (!transaction) {
    return res.status(404).json({ message: "Transaction not found." });
  }
  res.status(200).json(transaction);
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const updated = await transactionService.update(req.user._id, req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ message: "Transaction not found." });
  }
  res.status(200).json({ message: "Transaction updated successfully", transaction: updated });
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const deleted = await transactionService.remove(req.user._id, req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Transaction not found." });
  }
  res.status(200).json({ message: "Transaction deleted successfully" });
});

export const getTransactions = asyncHandler(async (req, res) => {
  const { type } = req.query;
  if (type && !TRANSACTION_FILTER_TYPES.includes(type)) {
    return res.status(400).json({ message: "Type must be either 'income' or 'expense'." });
  }

  const result = await transactionService.list(req.user._id, req.query);
  res.status(200).json(result);
});

export const toggleTransactionSettled = asyncHandler(async (req, res) => {
  const transaction = await transactionService.toggleSettled(req.user._id, req.params.id);
  if (!transaction) return res.status(404).json({ message: "Transaction not found." });
  res.status(200).json({ message: "Transaction updated", transaction });
});

export const getLastTransactions = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 5;
  const transactions = await transactionService.listRecent(req.user._id, limit);
  res.status(200).json(transactions);
});
