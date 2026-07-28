import mongoose from "mongoose";
import RecurringTransaction, { type RecurringTransactionAttrs } from "../models/recurringTransaction.model.js";
import type { Id } from "../types/common.js";

export const findByUser = (userId: Id) => RecurringTransaction.find({ userId });

export const findById = (userId: Id, id: Id) => RecurringTransaction.findOne({ _id: id, userId });

export const create = (data: mongoose.AnyKeys<RecurringTransactionAttrs>) => new RecurringTransaction(data).save();

// Fetch-then-save (rather than findOneAndUpdate) so the schema's
// pre('validate') hook - which enforces exactly one customInterval field
// when frequency is "custom" - actually runs; findOneAndUpdate skips
// document middleware even with runValidators: true.
export const updateById = async (userId: Id, id: Id, updateData: Partial<RecurringTransactionAttrs>) => {
  const doc = await RecurringTransaction.findOne({ _id: id, userId });
  if (!doc) return null;
  Object.assign(doc, updateData);
  return doc.save();
};

export const deleteById = (userId: Id, id: Id) => RecurringTransaction.findOneAndDelete({ _id: id, userId });

export const toggleActive = async (userId: Id, id: Id) => {
  const doc = await RecurringTransaction.findOne({ _id: id, userId });
  if (!doc) return null;
  doc.isActive = !doc.isActive;
  return doc.save();
};
