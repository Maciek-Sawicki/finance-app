import * as budgetService from "../services/budget.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const createBudget = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const newBudget = await budgetService.create(userId, req.body);
  res.status(201).json(newBudget);
});

export const getBudgets = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, type, targetCurrency } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (type) filters.type = type;

  const budgets = await budgetService.list(userId, filters, targetCurrency);
  res.status(200).json(budgets);
});

export const getBudgetById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { targetCurrency } = req.query;

  const budget = await budgetService.getById(userId, id, targetCurrency);
  res.status(200).json(budget);
});

export const updateBudget = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const updated = await budgetService.update(userId, id, req.body);
  res.status(200).json(updated);
});

export const deleteBudget = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  await budgetService.remove(userId, id);
  res.status(200).json({ message: "Budget deleted successfully." });
});

export const getBudgetsByType = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { targetCurrency, status } = req.query;

  const budgets = await budgetService.getByType(userId, status, targetCurrency);
  res.status(200).json(budgets);
});

export const getBudgetHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id: categoryId } = req.params;
  const { targetCurrency } = req.query;

  const history = await budgetService.getHistory(userId, categoryId, targetCurrency);
  res.status(200).json(history);
});
