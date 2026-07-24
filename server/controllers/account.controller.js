import * as accountService from "../services/account.service.js";
import { convertCurrency } from "../services/exchangeRate.service.js";

export const createAccount = async (req, res) => {
  try {
    const { name, type, currency, startingBalance, icon, description, isDefault } = req.body;

    if (!name || !type || !currency || startingBalance === undefined) {
      return res.status(400).json({ message: "Name, type, currency and startingBalance are required." });
    }

    if (isNaN(startingBalance) || startingBalance < 0) {
      return res.status(400).json({ message: "startingBalance must be a non-negative number." });
    }

    const account = await accountService.create(req.user._id, {
      name, type, currency, startingBalance, icon, description, isDefault,
    });

    res.status(201).json({ message: "Account created successfully", account });
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAccounts = async (req, res) => {
  try {
    const targetCurrency = req.query.currency ?? "USD";
    const accounts = await accountService.list(req.user._id);

    if (accounts.length === 0) {
      return res.status(404).json({ message: "No accounts found." });
    }

    const accountsWithConverted = await Promise.all(
      accounts.map(async (account) => ({
        ...account,
        convertedBalance: await convertCurrency(account.balance, account.currency, targetCurrency),
        convertedCurrency: targetCurrency,
      }))
    );

    res.status(200).json(accountsWithConverted);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAccount = async (req, res) => {
  try {
    const account = await accountService.getById(req.user._id, req.params.id);
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
    const { name, type, currency, startingBalance, icon, description, isDefault } = req.body;

    if (startingBalance !== undefined && (isNaN(startingBalance) || startingBalance < 0)) {
      return res.status(400).json({ message: "startingBalance must be a non-negative number." });
    }

    const updated = await accountService.update(req.user._id, req.params.id, {
      name, type, currency, startingBalance, icon, description, isDefault,
    });

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
    const deleted = await accountService.remove(req.user._id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Account not found." });
    }
    res.status(200).json({ message: "Account and related transactions deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const setDefaultAccount = async (req, res) => {
  try {
    const account = await accountService.setDefault(req.user._id, req.params.id);
    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }
    res.status(200).json({ message: "Default account set successfully", account });
  } catch (error) {
    console.error("Error setting default account:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getDefaultAccount = async (req, res) => {
  try {
    const account = await accountService.getDefault(req.user._id);
    if (!account) {
      return res.status(404).json({ message: "No default account found." });
    }
    res.status(200).json(account);
  } catch (error) {
    console.error("Error fetching default account:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAccountsByType = async (req, res) => {
  try {
    const accounts = await accountService.list(req.user._id, { type: req.params.type });
    res.status(200).json(accounts);
  } catch (error) {
    console.error("Error fetching accounts by type:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAccountsByCurrency = async (req, res) => {
  try {
    const accounts = await accountService.list(req.user._id, { currency: req.params.currency });
    res.status(200).json(accounts);
  } catch (error) {
    console.error("Error fetching accounts by currency:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAccountBalance = async (req, res) => {
  try {
    const balance = await accountService.getBalance(req.user._id, req.params.id);
    if (balance === null) {
      return res.status(404).json({ message: "Account not found." });
    }
    res.status(200).json({ balance });
  } catch (error) {
    console.error("Error fetching account balance:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getTotalBalance = async (req, res) => {
  try {
    const baseCurrency = req.query.base;
    if (!baseCurrency) {
      return res.status(400).json({ message: "Base currency is required" });
    }

    const totals = await accountService.getTotalBalance(req.user._id, baseCurrency);
    if (!totals) {
      return res.status(404).json({ message: "No accounts found." });
    }

    res.status(200).json({ ...totals, currency: baseCurrency });
  } catch (error) {
    console.error("Error calculating total balance:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAccountSummary = async (req, res) => {
  try {
    const targetCurrency = req.query.currency || "USD";
    const summary = await accountService.getSummary(req.user._id, targetCurrency);
    res.status(200).json({ currency: targetCurrency, ...summary });
  } catch (error) {
    console.error("Error fetching account summary:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
