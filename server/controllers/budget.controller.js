import * as budgetService from "../services/budget.service.js";

export const createBudget = async (req, res) => {
  try {
    const userId = req.user._id;
    const newBudget = await budgetService.create(userId, req.body);
    res.status(201).json(newBudget);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error("Error creating budget:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const getBudgets = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, type, targetCurrency } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;

    const budgets = await budgetService.list(userId, filters, targetCurrency);
    res.status(200).json(budgets);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error("Error fetching budgets:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getBudgetById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { targetCurrency } = req.query;

    const budget = await budgetService.getById(userId, id, targetCurrency);
    res.status(200).json(budget);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error("Error fetching budget:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const updated = await budgetService.update(userId, id, req.body);
    res.status(200).json(updated);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error("Error updating budget:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    await budgetService.remove(userId, id);
    res.status(200).json({ message: "Budget deleted successfully." });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error("Error deleting budget:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getBudgetsByType = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetCurrency, status } = req.query;

    const budgets = await budgetService.getByType(userId, status, targetCurrency);
    res.status(200).json(budgets);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error("Error fetching budgets:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getBudgetHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: categoryId } = req.params;
    const { targetCurrency } = req.query;

    const history = await budgetService.getHistory(userId, categoryId, targetCurrency);
    res.status(200).json(history);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error("Error fetching budget history:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
