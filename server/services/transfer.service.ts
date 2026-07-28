import mongoose from "mongoose";
import * as accountRepository from "../repositories/account.repository.js";
import * as categoryRepository from "../repositories/category.repository.js";
import * as transactionRepository from "../repositories/transaction.repository.js";
import * as transferRepository from "../repositories/transfer.repository.js";
import * as exchangeRateService from "./exchangeRate.service.js";
import type { CurrencyService } from "./exchangeRate.service.js";
import type { Id, MongooseSessionFactory } from "../types/common.js";

type AccountRepository = typeof accountRepository;
type CategoryRepository = typeof categoryRepository;
type TransactionRepository = typeof transactionRepository;
type TransferRepository = typeof transferRepository;

interface TransferInput {
  fromAccountId: Id;
  toAccountId: Id;
  amount: number;
  toAmount?: number;
  date?: Date | string;
  description?: string;
}

const TRANSFER_CATEGORY = {
  name: "Transfer",
  type: "expense",
  icon: "🔄",
  color: "#888888",
  favorite: false,
};

const domainError = (message: string, status: number): Error => Object.assign(new Error(message), { status });

export const createTransferService = (
  accountRepository: AccountRepository,
  categoryRepository: CategoryRepository,
  transactionRepository: TransactionRepository,
  transferRepository: TransferRepository,
  currencyService: CurrencyService,
  mongooseInstance: MongooseSessionFactory = mongoose
) => {
  const getOrCreateTransferCategory = async (userId: Id, session: mongoose.ClientSession) => {
    const existing = await categoryRepository.findByNameAndType(userId, TRANSFER_CATEGORY.name, TRANSFER_CATEGORY.type, { session });
    if (existing) return existing;
    return categoryRepository.create({ ...TRANSFER_CATEGORY, userId }, { session });
  };

  const create = async (userId: Id, data: TransferInput) => {
    const { fromAccountId, toAccountId, amount, toAmount: customToAmount, date, description } = data;

    if (fromAccountId === toAccountId) {
      throw domainError("From and To accounts must be different.", 400);
    }

    const [fromAccount, toAccount] = await Promise.all([
      accountRepository.findById(userId, fromAccountId),
      accountRepository.findById(userId, toAccountId),
    ]);
    if (!fromAccount || !toAccount) {
      throw domainError("One of the accounts not found.", 404);
    }

    let toAmount = Number(amount.toFixed(2));
    let exchangeRate = 1;

    if (fromAccount.currency !== toAccount.currency) {
      if (customToAmount && !isNaN(customToAmount)) {
        toAmount = Number(customToAmount.toFixed(2));
        exchangeRate = Number((toAmount / amount).toFixed(6));
      } else {
        try {
          toAmount = await currencyService.convertCurrency(amount, fromAccount.currency, toAccount.currency);
        } catch (err) {
          throw domainError(err instanceof Error ? err.message : String(err), 400);
        }
        exchangeRate = Number((toAmount / amount).toFixed(6));
      }
    }

    const transferDate = date || new Date();

    // A transfer is a Transfer doc + two Transaction docs (+ possibly a new
    // "Transfer" category) that all must land together or not at all -
    // previously these were 3-4 independent writes, so a failure partway
    // through left half a transfer on the books.
    const session = await mongooseInstance.startSession();
    let transfer!: Awaited<ReturnType<TransferRepository["create"]>>;
    let expenseTransaction!: Awaited<ReturnType<TransactionRepository["createMany"]>>[number];
    let incomeTransaction!: Awaited<ReturnType<TransactionRepository["createMany"]>>[number];

    try {
      await session.withTransaction(async () => {
        const transferCategory = await getOrCreateTransferCategory(userId, session);

        transfer = await transferRepository.create({
          userId,
          fromAccountId,
          toAccountId,
          fromAmount: Number(amount.toFixed(2)),
          toAmount,
          exchangeRate,
        }, { session });

        [expenseTransaction, incomeTransaction] = await transactionRepository.createMany([
          {
            userId,
            accountId: fromAccountId,
            type: "expense",
            amount: Number(amount.toFixed(2)),
            date: transferDate,
            settled: true,
            categoryId: transferCategory._id,
            description: description
              ? `Transfer to ${toAccount.name} (${toAmount} ${toAccount.currency}): ${description}`
              : `Transfer to ${toAccount.name} (${toAmount} ${toAccount.currency})`,
            transferId: transfer._id,
          },
          {
            userId,
            accountId: toAccountId,
            type: "income",
            amount: toAmount,
            date: transferDate,
            settled: true,
            categoryId: transferCategory._id,
            description: description
              ? `Transfer from ${fromAccount.name} (${amount} ${fromAccount.currency}): ${description}`
              : `Transfer from ${fromAccount.name} (${amount} ${fromAccount.currency})`,
            transferId: transfer._id,
          },
        ], { session });
      });
    } finally {
      await session.endSession();
    }

    return { transfer, transactions: [expenseTransaction, incomeTransaction] };
  };

  return { create };
};

const defaultService = createTransferService(
  accountRepository,
  categoryRepository,
  transactionRepository,
  transferRepository,
  exchangeRateService
);

export const { create } = defaultService;
