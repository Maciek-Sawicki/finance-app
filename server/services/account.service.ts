import * as accountRepository from "../repositories/account.repository.js";
import * as transactionRepository from "../repositories/transaction.repository.js";
import * as exchangeRateService from "./exchangeRate.service.js";
import type { CurrencyService } from "./exchangeRate.service.js";
import type { Id } from "../types/common.js";

type AccountRepository = typeof accountRepository;
type TransactionRepository = typeof transactionRepository;

type LeanAccount = NonNullable<Awaited<ReturnType<AccountRepository["findById"]>>>;

// Deliberately just the fields withBalance reads, not the full aggregate
// return type - it's called with both aggregateAccountBalance's result
// ({ _id: null, ... }) and a single entry from aggregateBalancesByAccount's
// Map ({ _id: ObjectId, ... } | undefined), which differ in _id but agree
// on these.
interface BalanceAgg {
  incomeSettled?: number;
  expenseSettled?: number;
  incomeAll?: number;
  expenseAll?: number;
}

interface CreateAccountInput {
  name: string;
  type: string;
  currency: string;
  startingBalance: number;
  icon?: string;
  description?: string;
  isDefault?: boolean;
}

interface UpdateAccountInput {
  name?: string;
  type?: string;
  currency?: string;
  startingBalance?: number;
  icon?: string;
  description?: string;
  isDefault?: boolean;
}

export const createAccountService = (
  accountRepository: AccountRepository,
  transactionRepository: TransactionRepository,
  currencyService: CurrencyService
) => {
  const withBalance = (account: LeanAccount, agg: BalanceAgg | null | undefined) => {
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

  const list = async (userId: Id, filter: Parameters<AccountRepository["findByUser"]>[1] = {}) => {
    const accounts = await accountRepository.findByUser(userId, filter);
    if (accounts.length === 0) return [];

    const balancesByAccount = await transactionRepository.aggregateBalancesByAccount(userId);
    return accounts.map((account) => withBalance(account, balancesByAccount.get(account._id.toString())));
  };

  const getById = async (userId: Id, accountId: Id) => {
    const account = await accountRepository.findById(userId, accountId);
    if (!account) return null;

    const agg = await transactionRepository.aggregateAccountBalance(userId, account._id);
    return withBalance(account, agg);
  };

  const getDefault = async (userId: Id) => {
    const account = await accountRepository.findDefault(userId);
    if (!account) return null;

    const agg = await transactionRepository.aggregateAccountBalance(userId, account._id);
    return withBalance(account, agg);
  };

  const create = (userId: Id, data: CreateAccountInput) =>
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

  const update = (userId: Id, accountId: Id, data: UpdateAccountInput) => {
    const updateData: Partial<CreateAccountInput> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.startingBalance !== undefined) updateData.startingBalance = Number(data.startingBalance.toFixed(2));
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    return accountRepository.updateById(userId, accountId, updateData);
  };

  const remove = async (userId: Id, accountId: Id) => {
    const deleted = await accountRepository.deleteById(userId, accountId);
    if (!deleted) return false;

    await transactionRepository.deleteByAccount(userId, accountId);
    return true;
  };

  const setDefault = async (userId: Id, accountId: Id) => {
    await accountRepository.unsetDefaultForUser(userId);
    const account = await accountRepository.updateById(userId, accountId, { isDefault: true });
    if (!account) return null;

    const agg = await transactionRepository.aggregateAccountBalance(userId, account._id);
    return withBalance(account, agg);
  };

  const getBalance = async (userId: Id, accountId: Id) => {
    const account = await accountRepository.findById(userId, accountId);
    if (!account) return null;

    const agg = await transactionRepository.aggregateAccountBalance(userId, account._id);
    return withBalance(account, agg).balance;
  };

  const getTotalBalance = async (userId: Id, baseCurrency: string) => {
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

  const getSummary = async (userId: Id, targetCurrency: string) => {
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
