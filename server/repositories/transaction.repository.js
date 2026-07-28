import Transaction from "../models/transaction.model.js";

// Shared by both aggregations below so "how we define settled/all sums"
// stays in one place instead of being retyped per pipeline.
const BALANCE_SUMS = {
  incomeSettled: { $sum: { $cond: [{ $and: [{ $eq: ["$type", "income"] }, { $eq: ["$settled", true] }] }, "$amount", 0] } },
  expenseSettled: { $sum: { $cond: [{ $and: [{ $eq: ["$type", "expense"] }, { $eq: ["$settled", true] }] }, "$amount", 0] } },
  incomeAll: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
  expenseAll: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
};

export const aggregateAccountBalance = async (userId, accountId) => {
  const [result] = await Transaction.aggregate([
    { $match: { userId, accountId } },
    { $group: { _id: null, ...BALANCE_SUMS } },
  ]);
  return result || null;
};

// One aggregation for every account of a user, grouped by accountId, instead
// of one aggregation per account (previously N queries for N accounts).
export const aggregateBalancesByAccount = async (userId) => {
  const results = await Transaction.aggregate([
    { $match: { userId } },
    { $group: { _id: "$accountId", ...BALANCE_SUMS } },
  ]);
  return new Map(results.map((r) => [r._id.toString(), r]));
};

export const deleteByAccount = (userId, accountId) =>
  Transaction.deleteMany({ userId, accountId });

// Settled expense total for a category within a date range, grouped by
// account currency - a category's transactions are normally all in one
// currency, but this stays correct for the multi-account case without a
// currency-conversion call per transaction.
export const aggregateCategorySpendByCurrency = (userId, categoryId, startDate, endDate) =>
  Transaction.aggregate([
    {
      $match: {
        userId,
        categoryId,
        type: "expense",
        settled: true,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    { $lookup: { from: "accounts", localField: "accountId", foreignField: "_id", as: "account" } },
    { $unwind: { path: "$account", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$account.currency", total: { $sum: "$amount" } } },
  ]);

// Settled, non-excluded totals grouped by month/type/currency for the
// dashboard summary - one aggregation instead of loading every transaction
// into Node and converting currency per row.
export const aggregateMonthlySummary = (userId) =>
  Transaction.aggregate([
    { $match: { userId, exclude: { $ne: true }, settled: true } },
    { $lookup: { from: "accounts", localField: "accountId", foreignField: "_id", as: "account" } },
    { $unwind: { path: "$account", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { month: { $dateToString: { format: "%Y-%m", date: "$date" } }, type: "$type", currency: "$account.currency" },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

export const create = async (data, { session } = {}) => {
  const [doc] = await Transaction.create([data], { session, ordered: true });
  return doc;
};

// For multi-document writes (e.g. a transfer's two legs) that must land in
// the same session/transaction as sibling writes. Mongoose requires
// `ordered: true` explicitly when create() is called with both a session
// and more than one document.
export const createMany = (docs, { session } = {}) => Transaction.create(docs, { session, ordered: true });

export const findById = (userId, transactionId) =>
  Transaction.findOne({ _id: transactionId, userId }).populate("categoryId accountId");

export const updateById = (userId, transactionId, updateData) =>
  Transaction.findOneAndUpdate({ _id: transactionId, userId }, updateData, { new: true });

export const deleteById = (userId, transactionId) =>
  Transaction.findOneAndDelete({ _id: transactionId, userId });

// Aggregation-pipeline update: flips the flag atomically server-side instead
// of a read-then-save round trip.
export const toggleSettledById = (userId, transactionId) =>
  Transaction.findOneAndUpdate(
    { _id: transactionId, userId },
    [{ $set: { settled: { $not: "$settled" } } }],
    { new: true }
  );

export const findPaginated = (userId, filter, { skip, limit }) =>
  Transaction.find({ userId, ...filter })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .populate("categoryId accountId");

export const count = (userId, filter) => Transaction.countDocuments({ userId, ...filter });

export const findRecent = (userId, limit) =>
  Transaction.find({ userId }).sort({ date: -1 }).limit(limit).populate("categoryId accountId");

export const findByImport = (userId, importId) =>
  Transaction.find({ userId, importId }).sort({ date: -1 });

export const deleteByImport = (userId, importId) =>
  Transaction.deleteMany({ userId, importId });

export const bulkUpdateCategories = (userId, importId, updates) => {
  const bulkOps = updates.map((u) => ({
    updateOne: {
      filter: { _id: u.transactionId, importId, userId },
      update: { $set: { categoryId: u.categoryId } },
    },
  }));
  return Transaction.bulkWrite(bulkOps);
};
