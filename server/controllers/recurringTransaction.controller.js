import * as recurringTransactionService from "../services/recurringTransaction.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const getRecurringTransactions = asyncHandler(async (req, res) => {
  const transactions = await recurringTransactionService.list(req.user._id);
  res.json(transactions);
});

export const getRecurringTransaction = asyncHandler(async (req, res) => {
  const transaction = await recurringTransactionService.getById(req.user._id, req.params.id);
  res.json(transaction);
});

export const createRecurringTransaction = asyncHandler(async (req, res) => {
  const transaction = await recurringTransactionService.create(req.user._id, req.body);
  res.status(201).json({
    message: "Recurring transaction created successfully",
    transaction,
  });
});

export const updateRecurringTransaction = asyncHandler(async (req, res) => {
  const transaction = await recurringTransactionService.update(req.user._id, req.params.id, req.body);
  res.json({
    message: "Recurring transaction updated successfully",
    transaction,
  });
});

export const deleteRecurringTransaction = asyncHandler(async (req, res) => {
  await recurringTransactionService.remove(req.user._id, req.params.id);
  res.json({ message: "Recurring transaction deleted successfully" });
});

export const toggleRecurringTransaction = asyncHandler(async (req, res) => {
  const transaction = await recurringTransactionService.toggleActive(req.user._id, req.params.id);
  res.json({
    message: `Recurring transaction ${transaction.isActive ? "activated" : "deactivated"}`,
    transaction,
  });
});
