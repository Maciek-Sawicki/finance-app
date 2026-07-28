import * as recurringTransactionService from "../services/recurringTransaction.service.js";

const handleError = (res, err) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(", ") });
  }
  res.status(500).json({ error: err.message });
};

export const getRecurringTransactions = async (req, res) => {
  try {
    const transactions = await recurringTransactionService.list(req.user._id);
    res.json(transactions);
  } catch (err) {
    handleError(res, err);
  }
};

export const getRecurringTransaction = async (req, res) => {
  try {
    const transaction = await recurringTransactionService.getById(req.user._id, req.params.id);
    res.json(transaction);
  } catch (err) {
    handleError(res, err);
  }
};

export const createRecurringTransaction = async (req, res) => {
  try {
    const transaction = await recurringTransactionService.create(req.user._id, req.body);
    console.log(`Recurring transaction '${transaction.name}' created successfully!`);
    res.status(201).json({
      message: "Recurring transaction created successfully",
      transaction,
    });
  } catch (err) {
    handleError(res, err);
  }
};

export const updateRecurringTransaction = async (req, res) => {
  try {
    const transaction = await recurringTransactionService.update(req.user._id, req.params.id, req.body);
    console.log(`Recurring transaction '${transaction.name}' updated successfully!`);
    res.json({
      message: "Recurring transaction updated successfully",
      transaction,
    });
  } catch (err) {
    handleError(res, err);
  }
};

export const deleteRecurringTransaction = async (req, res) => {
  try {
    const deleted = await recurringTransactionService.remove(req.user._id, req.params.id);
    console.log(`Recurring transaction '${deleted.name}' deleted successfully!`);
    res.json({ message: "Recurring transaction deleted successfully" });
  } catch (err) {
    handleError(res, err);
  }
};

export const toggleRecurringTransaction = async (req, res) => {
  try {
    const transaction = await recurringTransactionService.toggleActive(req.user._id, req.params.id);
    console.log(`Recurring transaction '${transaction.name}' isActive set to ${transaction.isActive}`);
    res.json({
      message: `Recurring transaction ${transaction.isActive ? "activated" : "deactivated"}`,
      transaction,
    });
  } catch (err) {
    handleError(res, err);
  }
};
