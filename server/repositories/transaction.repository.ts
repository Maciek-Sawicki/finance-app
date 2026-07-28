import mongoose from "mongoose";
import Transaction, { type TransactionAttrs } from "../models/transaction.model.js";
import { softDeleteUpdate } from "../models/plugins/softDelete.plugin.js";
import type { Id, SessionOption } from "../types/common.js";

interface BalanceSums {
  incomeSettled: number;
  expenseSettled: number;
  incomeAll: number;
  expenseAll: number;
}

// Shared by both aggregations below so "how we define settled/all sums"
// stays in one place instead of being retyped per pipeline.
const BALANCE_SUMS = {
  incomeSettled: { $sum: { $cond: [{ $and: [{ $eq: ["$type", "income"] }, { $eq: ["$settled", true] }] }, "$amount", 0] } },
  expenseSettled: { $sum: { $cond: [{ $and: [{ $eq: ["$type", "expense"] }, { $eq: ["$settled", true] }] }, "$amount", 0] } },
  incomeAll: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
  expenseAll: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
};

export const aggregateAccountBalance = async (userId: Id, accountId: Id) => {
  const [result] = await Transaction.aggregate<{ _id: null } & BalanceSums>([
    { $match: { userId, accountId } },
    { $group: { _id: null, ...BALANCE_SUMS } },
  ]);
  return result || null;
};

// One aggregation for every account of a user, grouped by accountId, instead
// of one aggregation per account (previously N queries for N accounts).
export const aggregateBalancesByAccount = async (userId: Id) => {
  const results = await Transaction.aggregate<{ _id: mongoose.Types.ObjectId } & BalanceSums>([
    { $match: { userId } },
    { $group: { _id: "$accountId", ...BALANCE_SUMS } },
  ]);
  return new Map(results.map((r) => [r._id.toString(), r]));
};

export const deleteByAccount = (userId: Id, accountId: Id) =>
  Transaction.updateMany({ userId, accountId }, softDeleteUpdate());

// Settled expense total for a category within a date range, grouped by
// account currency - a category's transactions are normally all in one
// currency, but this stays correct for the multi-account case without a
// currency-conversion call per transaction.
export const aggregateCategorySpendByCurrency = (userId: Id, categoryId: Id, startDate: Date, endDate: Date) =>
  Transaction.aggregate<{ _id: string | null; total: number }>([
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
export const aggregateMonthlySummary = (userId: Id) =>
  Transaction.aggregate<{ _id: { month: string; type: string; currency: string | null }; totalAmount: number }>([
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

export const create = async (data: mongoose.AnyKeys<TransactionAttrs>, { session }: SessionOption = {}) => {
  const [doc] = await Transaction.create([data], { session, ordered: true });
  return doc;
};

// For multi-document writes (e.g. a transfer's two legs) that must land in
// the same session/transaction as sibling writes. Mongoose requires
// `ordered: true` explicitly when create() is called with both a session
// and more than one document.
export const createMany = (docs: mongoose.AnyKeys<TransactionAttrs>[], { session }: SessionOption = {}) =>
  Transaction.create(docs, { session, ordered: true });

export const findById = (userId: Id, transactionId: Id) =>
  Transaction.findOne({ _id: transactionId, userId }).populate("categoryId accountId");

export const updateById = (userId: Id, transactionId: Id, updateData: mongoose.UpdateQuery<TransactionAttrs>) =>
  Transaction.findOneAndUpdate({ _id: transactionId, userId }, updateData, { new: true });

export const deleteById = (userId: Id, transactionId: Id) =>
  Transaction.findOneAndUpdate({ _id: transactionId, userId }, softDeleteUpdate(), { new: true });

// Aggregation-pipeline update: flips the flag atomically server-side instead
// of a read-then-save round trip.
export const toggleSettledById = (userId: Id, transactionId: Id) =>
  Transaction.findOneAndUpdate(
    { _id: transactionId, userId },
    [{ $set: { settled: { $not: "$settled" } } }],
    { new: true }
  );

export const findPaginated = (userId: Id, filter: mongoose.FilterQuery<TransactionAttrs>, { skip, limit }: { skip: number; limit: number }) =>
  Transaction.find({ userId, ...filter })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .populate("categoryId accountId");

export const count = (userId: Id, filter: mongoose.FilterQuery<TransactionAttrs>) =>
  Transaction.countDocuments({ userId, ...filter });

export const findRecent = (userId: Id, limit: number) =>
  Transaction.find({ userId }).sort({ date: -1 }).limit(limit).populate("categoryId accountId");

export const findByImport = (userId: Id, importId: Id) =>
  Transaction.find({ userId, importId }).sort({ date: -1 });

export const deleteByImport = (userId: Id, importId: Id) =>
  Transaction.updateMany({ userId, importId }, softDeleteUpdate());

export const bulkUpdateCategories = (userId: Id, importId: Id, updates: Array<{ transactionId: Id; categoryId: Id }>) => {
  const bulkOps = updates.map((u) => ({
    updateOne: {
      filter: { _id: u.transactionId, importId, userId },
      update: { $set: { categoryId: u.categoryId } },
    },
  }));
  return Transaction.bulkWrite(bulkOps);
};
