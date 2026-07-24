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
