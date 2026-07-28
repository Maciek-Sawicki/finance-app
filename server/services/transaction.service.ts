import mongoose from "mongoose";
import * as transactionRepository from "../repositories/transaction.repository.js";
import * as accountRepository from "../repositories/account.repository.js";
import * as categoryRepository from "../repositories/category.repository.js";
import type { TransactionAttrs } from "../models/transaction.model.js";
import type { Id } from "../types/common.js";

type TransactionRepository = typeof transactionRepository;
type AccountRepository = typeof accountRepository;
type CategoryRepository = typeof categoryRepository;

const domainError = (message: string, status: number): Error => Object.assign(new Error(message), { status });

interface TransactionInput {
  categoryId?: Id;
  accountId?: Id;
  type?: string;
  amount?: number;
  date?: Date | string;
  settled?: boolean;
  description?: string;
  exclude?: boolean;
}

export interface ListQuery {
  startDate?: string;
  endDate?: string;
  type?: string;
  categoryId?: Id;
  accountId?: Id;
  page?: string;
  limit?: string;
}

export const createTransactionService = (
  transactionRepository: TransactionRepository,
  accountRepository: AccountRepository,
  categoryRepository: CategoryRepository
) => {
  // accountId/categoryId come from the client - without checking they
  // actually belong to this user, a caller could write a transaction onto
  // (and later, via populate, read details of) someone else's account.
  const assertOwnedRefs = async (userId: Id, data: Pick<TransactionInput, "accountId" | "categoryId">) => {
    if (data.accountId !== undefined) {
      const account = await accountRepository.findById(userId, data.accountId);
      if (!account) throw domainError("Account not found.", 404);
    }
    if (data.categoryId !== undefined) {
      const category = await categoryRepository.findById(userId, data.categoryId);
      if (!category) throw domainError("Category not found.", 404);
    }
  };

  const create = async (userId: Id, data: Required<Pick<TransactionInput, "accountId" | "type" | "amount">> & TransactionInput) => {
    await assertOwnedRefs(userId, data);

    return transactionRepository.create({
      userId,
      categoryId: data.categoryId,
      accountId: data.accountId,
      type: data.type,
      amount: Number(data.amount.toFixed(2)),
      date: data.date || Date.now(),
      settled: data.settled || false,
      description: data.description,
      exclude: data.exclude || false,
    } as mongoose.AnyKeys<TransactionAttrs>);
  };

  const getById = (userId: Id, transactionId: Id) => transactionRepository.findById(userId, transactionId);

  // Only these fields may be changed by a client - accepting the raw request
  // body here would let a caller overwrite userId/transferId/importId.
  const update = async (userId: Id, transactionId: Id, data: TransactionInput) => {
    await assertOwnedRefs(userId, data);

    const updateData: TransactionInput = {};
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.accountId !== undefined) updateData.accountId = data.accountId;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.amount !== undefined) updateData.amount = Number(data.amount.toFixed(2));
    if (data.date !== undefined) updateData.date = data.date;
    if (data.settled !== undefined) updateData.settled = data.settled;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.exclude !== undefined) updateData.exclude = data.exclude;

    return transactionRepository.updateById(userId, transactionId, updateData as mongoose.UpdateQuery<TransactionAttrs>);
  };

  const remove = async (userId: Id, transactionId: Id) =>
    Boolean(await transactionRepository.deleteById(userId, transactionId));

  const toggleSettled = (userId: Id, transactionId: Id) => transactionRepository.toggleSettledById(userId, transactionId);

  const list = async (userId: Id, query: ListQuery = {}) => {
    const { startDate, endDate, type, categoryId, accountId, page, limit } = query;
    const filter: mongoose.FilterQuery<TransactionAttrs> = {};

    if (startDate || endDate) {
      const dateFilter: { $gte?: Date; $lte?: Date } = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      filter.date = dateFilter;
    }
    if (type) filter.type = type as TransactionAttrs["type"];
    if (categoryId) filter.categoryId = categoryId;
    if (accountId) filter.accountId = accountId;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      transactionRepository.findPaginated(userId, filter, { skip, limit: limitNum }),
      transactionRepository.count(userId, filter),
    ]);

    return { data, total, page: pageNum, totalPages: Math.ceil(total / limitNum) };
  };

  const listRecent = (userId: Id, limit: number) => transactionRepository.findRecent(userId, limit);

  return { create, getById, update, remove, toggleSettled, list, listRecent };
};

const defaultService = createTransactionService(transactionRepository, accountRepository, categoryRepository);

export const { create, getById, update, remove, toggleSettled, list, listRecent } = defaultService;
