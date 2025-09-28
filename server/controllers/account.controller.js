import Account from "../models/account.model.js";
import { convertCurrency } from "../services/exchangeRate.service.js";

export const createAccount = async (req, res) => {
  try {
    const { name,type, currency, balance, icon, description, isDefault } = req.body;
    const userId = req.user._id; 

    const newAccount = new Account({
      userId,
      name,
      type,
      currency,
      balance,
      icon,
      description,
      isDefault
    });

    await newAccount.save();
    res.status(201).json({ message: "Account created successfully", account: newAccount });
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAccounts = async (req, res) => {
  try {
    const userId = req.user._id; 
    const accounts = await Account.find({ userId }).sort({ createdAt: -1 });

    if (accounts.length === 0) {
      return res.status(404).json({ message: "No accounts found." });
    }

    res.status(200).json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAccount = async (req, res) => {
  try {
    const account = await Account.findById({_id: req.params.id, userId: req.user._id });
    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }
    res.status(200).json(account);
  } catch (error) {
    console.error("Error fetching account:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const updated = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...req.body },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Account not found." });
    }
    res.status(200).json({ message: "Account updated successfully", account: updated });
  } catch (error) {
    console.error("Error updating account:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const deleted = await Account.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) {
      return res.status(404).json({ message: "Account not found." });
    }
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const setDefaultAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    // Reset all accounts to not default
    await Account.updateMany({ userId }, { isDefault: false });

    const updatedAccount = await Account.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isDefault: true },
      { new: true }
    );

    if (!updatedAccount) {
      return res.status(404).json({ message: "Account not found." });
    }

    res.status(200).json({ message: "Default account set successfully", account: updatedAccount });
  } catch (error) {
    console.error("Error setting default account:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getDefaultAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const defaultAccount = await Account.findOne({ userId, isDefault: true });

    if (!defaultAccount) {
      return res.status(404).json({ message: "No default account found." });
    }

    res.status(200).json(defaultAccount);
  } catch (error) {
    console.error("Error fetching default account:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAccountsByType = async (req, res) => {
  try {
    console.log(req.params);

    const { type } = req.params;
    const userId = req.user._id;

    const accounts = await Account.find({ userId, type }).sort({ createdAt: -1 });

    if (accounts.length === 0) {
      return res.status(404).json({ message: `No accounts found for type: ${type}` });
    }

    res.status(200).json(accounts);
  } catch (error) {
    console.error("Error fetching accounts by type:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


export const getAccountsByCurrency = async (req, res) => {
  try {
    const { currency } = req.params;
    const userId = req.user._id;

    const accounts = await Account.find({ userId, currency }).sort({ createdAt: -1 });

    if (accounts.length === 0) {
      return res.status(404).json({ message: `No accounts found for currency: ${currency}` });
    }

    res.status(200).json(accounts);
  } catch (error) {
    console.error("Error fetching accounts by currency:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAccountBalance = async (req, res) => {
  try {
    const accountId = req.params.id;
    const userId = req.user._id;

    const account = await Account.findOne({ _id: accountId, userId });

    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    res.status(200).json({ balance: account.balance });
  } catch (error) {
    console.error("Error fetching account balance:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updateAccountBalance = async (req, res) => {
  try {
    const amount = Number(req.body.balance);
    const accountId = req.params.id;
    const userId = req.user._id;

    if (isNaN(amount)) {
      return res.status(400).json({ message: "Invalid amount." });
    }

    const updatedAccount = await Account.findOneAndUpdate(
      { _id: accountId, userId },
      { $inc: { balance: amount } },
      { new: true }
    );

    if (!updatedAccount) {
      return res.status(404).json({ message: "Account not found." });
    }

    res.status(200).json({ message: "Balance updated successfully", account: updatedAccount });
  } catch (error) {
    console.error("Error updating account balance:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getTotalBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    const baseCurrency = req.query.base || "USD";
    const accounts = await Account.find({ userId });

    if (accounts.length === 0) {
      return res.status(404).json({ message: "No accounts found." });
    }

    let total = 0;
    for (const account of accounts) {
      const converted = await convertCurrency(account.balance, account.currency, baseCurrency);
      total += converted;
    }
    res.status(200).json({ totalBalance: total.toFixed(2), currency: baseCurrency });

  } catch (error) {
    console.error("Error calculating total balance:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAccountSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const accounts = await Account.find({ userId });
    if (accounts.length === 0) {
      return res.status(404).json({ message: "No accounts found." });
    }

    const summary = accounts.map(account => ({
      id: account._id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: account.balance,
      isDefault: account.isDefault
    }));

    res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching account summary:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};







