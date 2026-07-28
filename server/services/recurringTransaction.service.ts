import type mongoose from "mongoose";
import * as recurringTransactionRepository from "../repositories/recurringTransaction.repository.js";
import type { RecurringTransactionAttrs } from "../models/recurringTransaction.model.js";
import type { Id } from "../types/common.js";

type RecurringTransactionRepository = typeof recurringTransactionRepository;

interface RecurringTransactionInput {
  name?: string;
  categoryId?: Id;
  accountId?: Id;
  amount?: number;
  frequency?: string;
  customInterval?: RecurringTransactionAttrs["customInterval"];
  nextDueDate?: Date | string;
  description?: string;
  isActive?: boolean;
  settled?: boolean;
}

const domainError = (message: string, status: number): Error => Object.assign(new Error(message), { status });

// Explicit per-field checks (rather than looping over a field-name array)
// so each assignment stays type-checked - TypeScript can't prove
// result[field] = data[field] is safe when field is a generic union of keys.
const whitelist = (data: RecurringTransactionInput): RecurringTransactionInput => {
  const result: RecurringTransactionInput = {};
  if (data.name !== undefined) result.name = data.name;
  if (data.categoryId !== undefined) result.categoryId = data.categoryId;
  if (data.accountId !== undefined) result.accountId = data.accountId;
  if (data.amount !== undefined) result.amount = data.amount;
  if (data.frequency !== undefined) result.frequency = data.frequency;
  if (data.customInterval !== undefined) result.customInterval = data.customInterval;
  if (data.nextDueDate !== undefined) result.nextDueDate = data.nextDueDate;
  if (data.description !== undefined) result.description = data.description;
  if (data.isActive !== undefined) result.isActive = data.isActive;
  if (data.settled !== undefined) result.settled = data.settled;
  return result;
};

export const createRecurringTransactionService = (repository: RecurringTransactionRepository) => {
  const list = (userId: Id) => repository.findByUser(userId);

  const getById = async (userId: Id, id: Id) => {
    const transaction = await repository.findById(userId, id);
    if (!transaction) throw domainError("Recurring transaction not found", 404);
    return transaction;
  };

  const create = (userId: Id, data: RecurringTransactionInput) =>
    repository.create({ ...whitelist(data), userId } as mongoose.AnyKeys<RecurringTransactionAttrs>);

  const update = async (userId: Id, id: Id, data: RecurringTransactionInput) => {
    const updated = await repository.updateById(userId, id, whitelist(data) as Partial<RecurringTransactionAttrs>);
    if (!updated) throw domainError("Recurring transaction not found", 404);
    return updated;
  };

  const remove = async (userId: Id, id: Id) => {
    const deleted = await repository.deleteById(userId, id);
    if (!deleted) throw domainError("Recurring transaction not found", 404);
    return deleted;
  };

  const toggleActive = async (userId: Id, id: Id) => {
    const toggled = await repository.toggleActive(userId, id);
    if (!toggled) throw domainError("Recurring transaction not found", 404);
    return toggled;
  };

  return { list, getById, create, update, remove, toggleActive };
};

const defaultService = createRecurringTransactionService(recurringTransactionRepository);

export const { list, getById, create, update, remove, toggleActive } = defaultService;
