import RecurringTransaction from "../models/recurringTransaction.model.js";

export const getRecurringTransactions = async (req, res) => {
  try {
    const transactions = await RecurringTransaction.find({ userId: req.user._id });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRecurringTransaction = async (req, res) => {
  try {
    const transaction = await RecurringTransaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: "Recurring transaction not found" });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createRecurringTransaction = async (req, res) => {
  try {
    const newTransaction = new RecurringTransaction({ ...req.body, userId: req.user._id });
    await newTransaction.save();
    console.log(`Recurring transaction '${newTransaction.name}' created successfully!`);
    res.status(201).json({
      message: "Recurring transaction created successfully",
      transaction: newTransaction,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(", ") });
    }
    res.status(500).json({ error: err.message });
  }
};

export const updateRecurringTransaction = async (req, res) => {
  try {
    const transaction = await RecurringTransaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: "Recurring transaction not found" });

    Object.assign(transaction, req.body);
    await transaction.save();
    console.log(`Recurring transaction '${transaction.name}' updated successfully!`);
    res.json({
      message: "Recurring transaction updated successfully",
      transaction,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(", ") });
    }
    res.status(500).json({ error: err.message });
  }
};

export const deleteRecurringTransaction = async (req, res) => {
  try {
    const deleted = await RecurringTransaction.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Recurring transaction not found" });
    console.log(`Recurring transaction '${deleted.name}' deleted successfully!`);
    res.json({ message: "Recurring transaction deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const toggleRecurringTransaction = async (req, res) => {
  try {
    const transaction = await RecurringTransaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: "Recurring transaction not found" });

    transaction.isActive = !transaction.isActive;
    await transaction.save();
    console.log(`Recurring transaction '${transaction.name}' isActive set to ${transaction.isActive}`);
    res.json({
      message: `Recurring transaction ${transaction.isActive ? "activated" : "deactivated"}`,
      transaction,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
