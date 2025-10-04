import Account from "../models/account.model.js";
import Transaction from "../models/transaction.model.js";
import { convertCurrency } from "../services/exchangeRate.service.js";

export const createAccount = async (req, res) => {
  try {
    const { name, type, currency, startingBalance, icon, description, isDefault } = req.body;
    const userId = req.user._id; 

    if (!name || !type || !currency || startingBalance === undefined) {
      return res.status(400).json({ message: "Name, type, currency and startingBalance are required." });
    }

    if (isNaN(startingBalance) || startingBalance < 0) {
      return res.status(400).json({ message: "startingBalance must be a non-negative number." });
    }

    const newAccount = new Account({
      userId,
      name,
      type,
      currency,
      startingBalance: Number(startingBalance.toFixed(2)),
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

    // opcjonalnie: policz saldo każdej z kont
    const accountsWithBalance = await Promise.all(accounts.map(async (account) => {
      const result = await Transaction.aggregate([
        { $match: { accountId: account._id, userId, settled: true } },
        {
          $group: {
            _id: null,
            income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
            expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          }
        }
      ]);

      let balance = account.startingBalance || 0;
      if (result.length > 0) balance += result[0].income - result[0].expense;

      return { ...account.toObject(), balance };
    }));

    res.status(200).json(accountsWithBalance);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


export const getAccount = async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, userId: req.user._id });
    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    // policz saldo dynamicznie
    const result = await Transaction.aggregate([
      { $match: { accountId: account._id, userId: req.user._id, settled: true } },
      {
        $group: {
          _id: null,
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
        }
      }
    ]);

    let balance = account.startingBalance || 0;
    if (result.length > 0) balance += result[0].income - result[0].expense;

    res.status(200).json({ ...account.toObject(), balance });
  } catch (error) {
    console.error("Error fetching account:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


export const updateAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const accountId = req.params.id;

    const { name, type, currency, startingBalance, icon, description, isDefault } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (currency !== undefined) updateData.currency = currency;
    if (startingBalance !== undefined) {
      if (isNaN(startingBalance) || startingBalance < 0) {
        return res.status(400).json({ message: "startingBalance must be a non-negative number." });
      }
      updateData.startingBalance = Number(startingBalance.toFixed(2));
    }
    if (icon !== undefined) updateData.icon = icon;
    if (description !== undefined) updateData.description = description;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updated = await Account.findOneAndUpdate(
      { _id: accountId, userId },
      updateData,
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
    const accountId = req.params.id;
    const userId = req.user._id;

    const deleted = await Account.findOneAndDelete({ _id: accountId, userId });
    if (!deleted) {
      return res.status(404).json({ message: "Account not found." });
    }

    // opcjonalnie: usuń powiązane transakcje
    await Transaction.deleteMany({ accountId, userId });

    res.status(200).json({ message: "Account and related transactions deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


export const setDefaultAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const accountId = req.params.id;

    // 1️⃣ Reset wszystkich kont użytkownika
    await Account.updateMany({ userId }, { $set: { isDefault: false } });

    // 2️⃣ Ustaw konto jako domyślne
    const updatedAccount = await Account.findOneAndUpdate(
      { _id: accountId, userId },
      { $set: { isDefault: true } },
      { new: true } // zwróć zaktualizowany dokument
    );

    if (!updatedAccount) {
      return res.status(404).json({ message: "Account not found." });
    }

    // 3️⃣ Policz dynamiczne saldo
    const result = await Transaction.aggregate([
      { $match: { accountId: updatedAccount._id, userId, settled: true } },
      {
        $group: {
          _id: null,
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
        }
      }
    ]);

    let balance = updatedAccount.startingBalance || 0;
    if (result.length > 0) balance += result[0].income - result[0].expense;

    res.status(200).json({ 
      message: "Default account set successfully", 
      account: { ...updatedAccount.toObject(), balance } 
    });

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

    // dynamiczne saldo
    const result = await Transaction.aggregate([
      { $match: { accountId: defaultAccount._id, userId, settled: true } },
      {
        $group: {
          _id: null,
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
        }
      }
    ]);

    let balance = defaultAccount.startingBalance || 0;
    if (result.length > 0) balance += result[0].income - result[0].expense;

    res.status(200).json({ ...defaultAccount.toObject(), balance });
  } catch (error) {
    console.error("Error fetching default account:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Filtr po type
export const getAccountsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user._id;

    const accounts = await Account.find({ userId, type }).sort({ createdAt: -1 });

    if (!accounts.length) {
      return res.status(200).json([]); // zwracamy pustą listę zamiast 404
    }

    const accountsWithBalance = await Promise.all(accounts.map(async (account) => {
      const result = await Transaction.aggregate([
        { $match: { accountId: account._id, userId ,settled: true } },
        {
          $group: {
            _id: null,
            income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
            expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          }
        }
      ]);

      let balance = account.startingBalance || 0;
      if (result.length > 0) balance += result[0].income - result[0].expense;

      return { ...account.toObject(), balance };
    }));

    res.status(200).json(accountsWithBalance);
  } catch (error) {
    console.error("Error fetching accounts by type:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Filtr po currency
export const getAccountsByCurrency = async (req, res) => {
  try {
    const { currency } = req.params;
    const userId = req.user._id;

    const accounts = await Account.find({ userId, currency }).sort({ createdAt: -1 });

    if (!accounts.length) {
      return res.status(200).json([]);
    }

    const accountsWithBalance = await Promise.all(accounts.map(async (account) => {
      const result = await Transaction.aggregate([
        { $match: { accountId: account._id, userId, settled: true } },
        {
          $group: {
            _id: null,
            income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
            expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          }
        }
      ]);

      let balance = account.startingBalance || 0;
      if (result.length > 0) balance += result[0].income - result[0].expense;

      return { ...account.toObject(), balance };
    }));

    res.status(200).json(accountsWithBalance);
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

    // policz saldo na podstawie income/expense
    const result = await Transaction.aggregate([
      { $match: { accountId: account._id, userId, settled: true } },
      {
        $group: {
          _id: null,
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
        }
      }
    ]);

    let balance = account.startingBalance || 0;
    if (result.length > 0) {
      balance += result[0].income - result[0].expense;
    }

    res.status(200).json({ balance });
  } catch (error) {
    console.error("Error fetching account balance:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


// export const updateAccountBalance = async (req, res) => {
//   try {
//     const amount = Number(req.body.balance);
//     const accountId = req.params.id;
//     const userId = req.user._id;

//     if (isNaN(amount)) {
//       return res.status(400).json({ message: "Invalid amount." });
//     }

//     const updatedAccount = await Account.findOneAndUpdate(
//       { _id: accountId, userId },
//       { $inc: { balance: amount } },
//       { new: true }
//     );

//     if (!updatedAccount) {
//       return res.status(404).json({ message: "Account not found." });
//     }

//     res.status(200).json({ message: "Balance updated successfully", account: updatedAccount });
//   } catch (error) {
//     console.error("Error updating account balance:", error);
//     res.status(500).json({ message: "Internal server error." });
//   }
// };

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
      // policz income/expense dla tego konta
      const result = await Transaction.aggregate([
        { $match: { accountId: account._id, userId, settled: true } },
        {
          $group: {
            _id: null,
            income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
            expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          },
        },
      ]);

      let balance = account.startingBalance || 0;
      if (result.length > 0) {
        balance += result[0].income - result[0].expense;
      }

      // konwersja na walutę bazową
      const converted = await convertCurrency(balance, account.currency, baseCurrency);
      total += converted;
    }

    res.status(200).json({
      totalBalance: total.toFixed(2),
      currency: baseCurrency,
    });

  } catch (error) {
    console.error("Error calculating total balance:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


export const getAccountSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const accounts = await Account.find({ userId });
    if (!accounts.length) {
      return res.status(200).json([]); // pusty array zamiast 404
    }

    const summary = await Promise.all(accounts.map(async (account) => {
      // agregacja transakcji dla dynamicznego salda
      const result = await Transaction.aggregate([
        { $match: { accountId: account._id, userId, settled: true } },
        {
          $group: {
            _id: null,
            income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
            expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          }
        }
      ]);

      let balance = account.startingBalance || 0;
      if (result.length > 0) balance += result[0].income - result[0].expense;

      return {
        id: account._id,
        name: account.name,
        type: account.type,
        currency: account.currency,
        balance,
        isDefault: account.isDefault
      };
    }));

    res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching account summary:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};








