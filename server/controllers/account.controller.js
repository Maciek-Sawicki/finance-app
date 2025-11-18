import Account from "../models/account.model.js";
import Transaction from "../models/transaction.model.js";
import ExchangeRate from "../models/exchangeRate.model.js";
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
    const targetCurrency = req.query.currency ?? "USD"; // waluta docelowa

    const accounts = await Account.find({ userId }).sort({ createdAt: -1 });

    if (accounts.length === 0) {
      return res.status(404).json({ message: "No accounts found." });
    }

    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        const result = await Transaction.aggregate([
          { $match: { accountId: account._id, userId, settled: true } },
          {
            $group: {
              _id: null,
              income: {
                $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
              },
              expense: {
                $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
              },
            },
          },
        ]);

        let balance = account.startingBalance || 0;
        if (result.length > 0) balance += result[0].income - result[0].expense;

        // przelicz na walutę docelową
        const convertedBalance = await convertCurrency(
          balance,
          account.currency, // zakładam, że masz pole currency w koncie
          targetCurrency
        );

        return {
          ...account.toObject(),
          balance,
          convertedBalance,
          convertedCurrency: targetCurrency,
        };
      })
    );

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

    await Account.updateMany({ userId }, { $set: { isDefault: false } });

    const updatedAccount = await Account.findOneAndUpdate(
      { _id: accountId, userId },
      { $set: { isDefault: true } },
      { new: true }
    );

    if (!updatedAccount) {
      return res.status(404).json({ message: "Account not found." });
    }

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

    const defaultAccount = await Account.findOne({ userId, isDefault: true }).lean();
    if (!defaultAccount) {
      return res.status(404).json({ message: "No default account found." });
    }

    const result = await Transaction.aggregate([
      { $match: { accountId: defaultAccount._id, userId } },
      {
        $group: {
          _id: null,
          incomeSettled: { $sum: { $cond: [{ $and: [{ $eq: ["$type", "income"] }, { $eq: ["$settled", true] }] }, "$amount", 0] } },
          expenseSettled: { $sum: { $cond: [{ $and: [{ $eq: ["$type", "expense"] }, { $eq: ["$settled", true] }] }, "$amount", 0] } },
          incomeAll: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expenseAll: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
        }
      }
    ]);

    const startingBalance = defaultAccount.startingBalance || 0;

    let balanceSettled = startingBalance;
    let balanceAfterRP = startingBalance;

    if (result.length > 0) {
      balanceSettled += result[0].incomeSettled - result[0].expenseSettled;
      balanceAfterRP += result[0].incomeAll - result[0].expenseAll;
    }

    res.status(200).json({
      ...defaultAccount,
      balance: Number(balanceSettled.toFixed(2)),
      balanceAfterRP: Number(balanceAfterRP.toFixed(2)),
      currency: defaultAccount.currency,
    });

  } catch (error) {
    console.error("Error fetching default account:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


export const getAccountsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user._id;

    const accounts = await Account.find({ userId, type }).sort({ createdAt: -1 });

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
    console.error("Error fetching accounts by type:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

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

export const getTotalBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    const baseCurrency = req.query.base;
    if (!baseCurrency) return res.status(400).json({ message: "Base currency is required" });

    const accounts = await Account.find({ userId }).lean();
    if (accounts.length === 0) {
      return res.status(404).json({ message: "No accounts found." });
    }

    const ratesDoc = await ExchangeRate.findOne({ base: "USD" }).sort({ createdAt: -1 }).lean();
    if (!ratesDoc) throw new Error("No exchange rates found.");
    const rates = ratesDoc.rates;

    const accountMap = {};
    accounts.forEach(acc => (accountMap[acc._id.toString()] = acc));

    const transactionAgg = await Transaction.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$accountId",
          incomeSettled: { $sum: { $cond: [{ $and: [{ $eq: ["$type", "income"] }, { $eq: ["$settled", true] }] }, "$amount", 0] } },
          expenseSettled: { $sum: { $cond: [{ $and: [{ $eq: ["$type", "expense"] }, { $eq: ["$settled", true] }] }, "$amount", 0] } },
          incomeAll: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expenseAll: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
        }
      }
    ]);

    let total = 0;
    let totalAfterRP = 0;

    transactionAgg.forEach(tx => {
      const acc = accountMap[tx._id.toString()];
      if (!acc) return;

      const startingBalance = acc.startingBalance || 0;

      const balanceSettled = startingBalance + (tx.incomeSettled - tx.expenseSettled);
      const balanceAll = startingBalance + (tx.incomeAll - tx.expenseAll);

      const rateFrom = Number(rates[acc.currency]);      
      const rateTo = Number(rates[baseCurrency]);       

      if (!rateFrom || !rateTo) throw new Error(`Unsupported currency: ${acc.currency} or ${baseCurrency}`);

      const convertedSettled = (balanceSettled / rateFrom) * rateTo;
      const convertedAll = (balanceAll / rateFrom) * rateTo;

      total += convertedSettled;
      totalAfterRP += convertedAll;
    });

    res.status(200).json({
      totalBalance: Number(total.toFixed(2)),
      totalAfterRP: Number(totalAfterRP.toFixed(2)),
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
    const targetCurrency = req.query.currency || "USD";

    const accounts = await Account.find({ userId });
    if (!accounts.length) {
      return res.status(200).json({
        currency: targetCurrency,
        accounts: [],
        total: 0,
        totalAfterRAndP: 0,
      });
    }

    const summary = await Promise.all(
      accounts.map(async (account) => {
        const resultSettled = await Transaction.aggregate([
          {
            $match: {
              accountId: account._id,
              userId,
              settled: true,
            },
          },
          {
            $group: {
              _id: null,
              income: {
                $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
              },
              expense: {
                $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
              },
            },
          },
        ]);

        const resultUnsettled = await Transaction.aggregate([
          {
            $match: {
              accountId: account._id,
              userId,
              settled: false,
            },
          },
          {
            $group: {
              _id: null,
              receivables: {
                $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
              },
              payables: {
                $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
              },
            },
          },
        ]);

        const settled =
          resultSettled.length > 0
            ? resultSettled[0].income - resultSettled[0].expense
            : 0;

        const unsettled =
          resultUnsettled.length > 0
            ? resultUnsettled[0].receivables - resultUnsettled[0].payables
            : 0;

        const baseBalance = account.startingBalance || 0;
        const balanceSettled = baseBalance + settled;
        const balanceWithReceivablesAndPayables = balanceSettled + unsettled;

        const convertedSettled = await convertCurrency(
          balanceSettled,
          account.currency,
          targetCurrency
        );
        const convertedWithRAndP = await convertCurrency(
          balanceWithReceivablesAndPayables,
          account.currency,
          targetCurrency
        );

        return {
          id: account._id,
          name: account.name,
          type: account.type,
          currency: account.currency,
          originalSettled: balanceSettled,
          originalWithRAndP: balanceWithReceivablesAndPayables,
          convertedSettled,
          convertedWithRAndP,
          isDefault: account.isDefault,
        };
      })
    );

    const total = summary.reduce((acc, s) => acc + s.convertedSettled, 0);
    const totalAfterRAndP = summary.reduce(
      (acc, s) => acc + s.convertedWithRAndP,
      0
    );

    res.status(200).json({
      currency: targetCurrency,
      accounts: summary,
      total,
      totalAfterRAndP,
    });
  } catch (error) {
    console.error("Error fetching account summary:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};