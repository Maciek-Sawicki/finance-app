import Transaction from "../models/transaction.model.js";

const ALLOWED_TYPES = ["income", "expense", "exclude"];

export const createTransaction = async (req, res) => {
  try {
    const { categoryId, accountId, type, amount, currency, date, settled, description } = req.body;
    const userId = req.user._id;

    if (!categoryId || !accountId || !type || !amount || !currency) {
      return res.status(400).json({ message: "Category, Account, Type, Amount, and Currency are required." });
    }
    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ message: "Type must be either 'income', 'expense' or 'exclude'." });
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
      currency,
      date: date || Date.now(),
      settled: settled || false,
      description,
    });

    await newTransaction.save();
    res.status(201).json({ message: "Transaction created successfully", transaction: newTransaction });
  } catch (error) {
    console.error("Error creating transaction:", error);
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
    const { startDate, endDate, type, categoryId, accountId } = req.query;
    const filter = { userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (type) {
      if (!ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({ message: "Type must be either 'income', 'expense', or 'exclude'." });
      }
      filter.type = type;
    }
    if (categoryId) filter.categoryId = categoryId;
    if (accountId) filter.accountId = accountId;

    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .populate("categoryId accountId");

    res.status(200).json(transactions);
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
