import * as recurringTransactionRepository from "../repositories/recurringTransaction.repository.js";

const domainError = (message, status) => Object.assign(new Error(message), { status });

const EDITABLE_FIELDS = [
  "name", "categoryId", "accountId", "amount", "frequency",
  "customInterval", "nextDueDate", "description", "isActive", "settled",
];

const whitelist = (data) => {
  const result = {};
  for (const field of EDITABLE_FIELDS) {
    if (data[field] !== undefined) result[field] = data[field];
  }
  return result;
};

export const createRecurringTransactionService = (repository) => {
  const list = (userId) => repository.findByUser(userId);

  const getById = async (userId, id) => {
    const transaction = await repository.findById(userId, id);
    if (!transaction) throw domainError("Recurring transaction not found", 404);
    return transaction;
  };

  const create = (userId, data) => repository.create({ ...whitelist(data), userId });

  const update = async (userId, id, data) => {
    const updated = await repository.updateById(userId, id, whitelist(data));
    if (!updated) throw domainError("Recurring transaction not found", 404);
    return updated;
  };

  const remove = async (userId, id) => {
    const deleted = await repository.deleteById(userId, id);
    if (!deleted) throw domainError("Recurring transaction not found", 404);
    return deleted;
  };

  const toggleActive = async (userId, id) => {
    const toggled = await repository.toggleActive(userId, id);
    if (!toggled) throw domainError("Recurring transaction not found", 404);
    return toggled;
  };

  return { list, getById, create, update, remove, toggleActive };
};

const defaultService = createRecurringTransactionService(recurringTransactionRepository);

export const { list, getById, create, update, remove, toggleActive } = defaultService;
