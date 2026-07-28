import * as accountService from "../services/account.service.js";
import { convertCurrency } from "../services/exchangeRate.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const createAccount = asyncHandler(async (req, res) => {
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
});

export const getAccounts = asyncHandler(async (req, res) => {
  const targetCurrency = (req.query.currency as string) ?? "USD";
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
});

export const getAccount = asyncHandler(async (req, res) => {
  const account = await accountService.getById(req.user._id, req.params.id as string);
  if (!account) {
    return res.status(404).json({ message: "Account not found." });
  }
  res.status(200).json(account);
});

export const updateAccount = asyncHandler(async (req, res) => {
  const { name, type, currency, startingBalance, icon, description, isDefault } = req.body;

  if (startingBalance !== undefined && (isNaN(startingBalance) || startingBalance < 0)) {
    return res.status(400).json({ message: "startingBalance must be a non-negative number." });
  }

  const updated = await accountService.update(req.user._id, req.params.id as string, {
    name, type, currency, startingBalance, icon, description, isDefault,
  });

  if (!updated) {
    return res.status(404).json({ message: "Account not found." });
  }

  res.status(200).json({ message: "Account updated successfully", account: updated });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const deleted = await accountService.remove(req.user._id, req.params.id as string);
  if (!deleted) {
    return res.status(404).json({ message: "Account not found." });
  }
  res.status(200).json({ message: "Account and related transactions deleted successfully" });
});

export const setDefaultAccount = asyncHandler(async (req, res) => {
  const account = await accountService.setDefault(req.user._id, req.params.id as string);
  if (!account) {
    return res.status(404).json({ message: "Account not found." });
  }
  res.status(200).json({ message: "Default account set successfully", account });
});

export const getDefaultAccount = asyncHandler(async (req, res) => {
  const account = await accountService.getDefault(req.user._id);
  if (!account) {
    return res.status(404).json({ message: "No default account found." });
  }
  res.status(200).json(account);
});

export const getAccountsByType = asyncHandler(async (req, res) => {
  const accounts = await accountService.list(req.user._id, { type: req.params.type as string });
  res.status(200).json(accounts);
});

export const getAccountsByCurrency = asyncHandler(async (req, res) => {
  const accounts = await accountService.list(req.user._id, { currency: req.params.currency as string });
  res.status(200).json(accounts);
});

export const getAccountBalance = asyncHandler(async (req, res) => {
  const balance = await accountService.getBalance(req.user._id, req.params.id as string);
  if (balance === null) {
    return res.status(404).json({ message: "Account not found." });
  }
  res.status(200).json({ balance });
});

export const getTotalBalance = asyncHandler(async (req, res) => {
  const baseCurrency = req.query.base as string | undefined;
  if (!baseCurrency) {
    return res.status(400).json({ message: "Base currency is required" });
  }

  const totals = await accountService.getTotalBalance(req.user._id, baseCurrency);
  if (!totals) {
    return res.status(404).json({ message: "No accounts found." });
  }

  res.status(200).json({ ...totals, currency: baseCurrency });
});

export const getAccountSummary = asyncHandler(async (req, res) => {
  const targetCurrency = (req.query.currency as string) || "USD";
  const summary = await accountService.getSummary(req.user._id, targetCurrency);
  res.status(200).json({ currency: targetCurrency, ...summary });
});
