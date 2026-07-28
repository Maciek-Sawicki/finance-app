import * as budgetService from "../services/budget.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const createBudget = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const newBudget = await budgetService.create(userId, req.body);
  res.status(201).json(newBudget);
});

export const getBudgets = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, type, targetCurrency } = req.query as { status?: string; type?: string; targetCurrency?: string };

  const filters: { status?: string; type?: string } = {};
  if (status) filters.status = status;
  if (type) filters.type = type;

  const budgets = await budgetService.list(userId, filters, targetCurrency as string);
  res.status(200).json(budgets);
});

export const getBudgetById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params as { id: string };
  const { targetCurrency } = req.query as { targetCurrency?: string };

  const budget = await budgetService.getById(userId, id, targetCurrency as string);
  res.status(200).json(budget);
});

export const updateBudget = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params as { id: string };

  const updated = await budgetService.update(userId, id, req.body);
  res.status(200).json(updated);
});

export const deleteBudget = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params as { id: string };

  await budgetService.remove(userId, id);
  res.status(200).json({ message: "Budget deleted successfully." });
});

export const getBudgetsByType = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status } = req.params as { status: string };
  const { targetCurrency } = req.query as { targetCurrency?: string };

  const budgets = await budgetService.getByType(userId, status, targetCurrency as string);
  res.status(200).json(budgets);
});

export const getBudgetHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id: categoryId } = req.params as { id: string };
  const { targetCurrency } = req.query as { targetCurrency?: string };

  const history = await budgetService.getHistory(userId, categoryId, targetCurrency as string);
  res.status(200).json(history);
});
