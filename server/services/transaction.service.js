import * as transactionRepository from "../repositories/transaction.repository.js";

export const createTransactionService = (transactionRepository) => {
  const create = (userId, data) =>
    transactionRepository.create({
      userId,
      categoryId: data.categoryId,
      accountId: data.accountId,
      type: data.type,
      amount: Number(data.amount.toFixed(2)),
      date: data.date || Date.now(),
      settled: data.settled || false,
      description: data.description,
      exclude: data.exclude || false,
    });

  const getById = (userId, transactionId) => transactionRepository.findById(userId, transactionId);

  // Only these fields may be changed by a client - accepting the raw request
  // body here would let a caller overwrite userId/transferId/importId.
  const update = (userId, transactionId, data) => {
    const updateData = {};
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.accountId !== undefined) updateData.accountId = data.accountId;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.amount !== undefined) updateData.amount = Number(data.amount.toFixed(2));
    if (data.date !== undefined) updateData.date = data.date;
    if (data.settled !== undefined) updateData.settled = data.settled;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.exclude !== undefined) updateData.exclude = data.exclude;

    return transactionRepository.updateById(userId, transactionId, updateData);
  };

  const remove = async (userId, transactionId) =>
    Boolean(await transactionRepository.deleteById(userId, transactionId));

  const toggleSettled = (userId, transactionId) => transactionRepository.toggleSettledById(userId, transactionId);

  const list = async (userId, query = {}) => {
    const { startDate, endDate, type, categoryId, accountId, page, limit } = query;
    const filter = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (type) filter.type = type;
    if (categoryId) filter.categoryId = categoryId;
    if (accountId) filter.accountId = accountId;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      transactionRepository.findPaginated(userId, filter, { skip, limit: limitNum }),
      transactionRepository.count(userId, filter),
    ]);

    return { data, total, page: pageNum, totalPages: Math.ceil(total / limitNum) };
  };

  const listRecent = (userId, limit) => transactionRepository.findRecent(userId, limit);

  return { create, getById, update, remove, toggleSettled, list, listRecent };
};

const defaultService = createTransactionService(transactionRepository);

export const { create, getById, update, remove, toggleSettled, list, listRecent } = defaultService;
