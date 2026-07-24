import * as accountRepository from "../repositories/account.repository.js";
import * as transactionRepository from "../repositories/transaction.repository.js";
import * as exchangeRateService from "./exchangeRate.service.js";

export const createAccountService = (accountRepository, transactionRepository, currencyService) => {
  const withBalance = (account, agg) => {
    const incomeSettled = agg?.incomeSettled || 0;
    const expenseSettled = agg?.expenseSettled || 0;
    const incomeAll = agg?.incomeAll || 0;
    const expenseAll = agg?.expenseAll || 0;
    const starting = account.startingBalance || 0;

    return {
      ...account,
      balance: Number((starting + incomeSettled - expenseSettled).toFixed(2)),
      balanceAfterRP: Number((starting + incomeAll - expenseAll).toFixed(2)),
    };
  };

  const list = async (userId, filter = {}) => {
    const accounts = await accountRepository.findByUser(userId, filter);
    if (accounts.length === 0) return [];

    const balancesByAccount = await transactionRepository.aggregateBalancesByAccount(userId);
    return accounts.map((account) => withBalance(account, balancesByAccount.get(account._id.toString())));
  };

  const getById = async (userId, accountId) => {
    const account = await accountRepository.findById(userId, accountId);
    if (!account) return null;

    const agg = await transactionRepository.aggregateAccountBalance(userId, account._id);
    return withBalance(account, agg);
  };

  const getDefault = async (userId) => {
    const account = await accountRepository.findDefault(userId);
    if (!account) return null;

    const agg = await transactionRepository.aggregateAccountBalance(userId, account._id);
    return withBalance(account, agg);
  };

  const create = (userId, data) =>
    accountRepository.create({
      userId,
      name: data.name,
      type: data.type,
      currency: data.currency,
      startingBalance: Number(data.startingBalance.toFixed(2)),
      icon: data.icon,
      description: data.description,
      isDefault: data.isDefault,
    });

  const update = (userId, accountId, data) => {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.startingBalance !== undefined) updateData.startingBalance = Number(data.startingBalance.toFixed(2));
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    return accountRepository.updateById(userId, accountId, updateData);
  };

  const remove = async (userId, accountId) => {
    const deleted = await accountRepository.deleteById(userId, accountId);
    if (!deleted) return false;

    await transactionRepository.deleteByAccount(userId, accountId);
    return true;
  };

  const setDefault = async (userId, accountId) => {
    await accountRepository.unsetDefaultForUser(userId);
    const account = await accountRepository.updateById(userId, accountId, { isDefault: true });
    if (!account) return null;

    const agg = await transactionRepository.aggregateAccountBalance(userId, account._id);
    return withBalance(account, agg);
  };

  const getBalance = async (userId, accountId) => {
    const account = await accountRepository.findById(userId, accountId);
    if (!account) return null;

    const agg = await transactionRepository.aggregateAccountBalance(userId, account._id);
    return withBalance(account, agg).balance;
  };

  const getTotalBalance = async (userId, baseCurrency) => {
    const accounts = await accountRepository.findByUser(userId);
    if (accounts.length === 0) return null;

    const [balancesByAccount, rates] = await Promise.all([
      transactionRepository.aggregateBalancesByAccount(userId),
      currencyService.getRates("USD"),
    ]);

    let totalBalance = 0;
    let totalAfterRP = 0;

    for (const account of accounts) {
      const { balance, balanceAfterRP } = withBalance(account, balancesByAccount.get(account._id.toString()));

      const rateFrom = Number(rates[account.currency]);
      const rateTo = Number(rates[baseCurrency]);
      if (!rateFrom || !rateTo) {
        throw new Error(`Unsupported currency: ${account.currency} or ${baseCurrency}`);
      }

      totalBalance += (balance / rateFrom) * rateTo;
      totalAfterRP += (balanceAfterRP / rateFrom) * rateTo;
    }

    return {
      totalBalance: Number(totalBalance.toFixed(2)),
      totalAfterRP: Number(totalAfterRP.toFixed(2)),
    };
  };

  const getSummary = async (userId, targetCurrency) => {
    const accounts = await accountRepository.findByUser(userId);
    if (accounts.length === 0) {
      return { accounts: [], total: 0, totalAfterRAndP: 0 };
    }

    const balancesByAccount = await transactionRepository.aggregateBalancesByAccount(userId);

    const summary = await Promise.all(
      accounts.map(async (account) => {
        const { balance, balanceAfterRP } = withBalance(account, balancesByAccount.get(account._id.toString()));

        const [convertedSettled, convertedWithRAndP] = await Promise.all([
          currencyService.convertCurrency(balance, account.currency, targetCurrency),
          currencyService.convertCurrency(balanceAfterRP, account.currency, targetCurrency),
        ]);

        return {
          id: account._id,
          name: account.name,
          type: account.type,
          currency: account.currency,
          originalSettled: balance,
          originalWithRAndP: balanceAfterRP,
          convertedSettled,
          convertedWithRAndP,
          isDefault: account.isDefault,
        };
      })
    );

    const total = summary.reduce((acc, s) => acc + s.convertedSettled, 0);
    const totalAfterRAndP = summary.reduce((acc, s) => acc + s.convertedWithRAndP, 0);

    return { accounts: summary, total, totalAfterRAndP };
  };

  return {
    list,
    getById,
    getDefault,
    create,
    update,
    remove,
    setDefault,
    getBalance,
    getTotalBalance,
    getSummary,
  };
};

const defaultService = createAccountService(accountRepository, transactionRepository, exchangeRateService);

export const {
  list,
  getById,
  getDefault,
  create,
  update,
  remove,
  setDefault,
  getBalance,
  getTotalBalance,
  getSummary,
} = defaultService;
