import RecurringTransaction from "../models/recurringTransaction.model.js";

export const findByUser = (userId) => RecurringTransaction.find({ userId });

export const findById = (userId, id) => RecurringTransaction.findOne({ _id: id, userId });

export const create = (data) => new RecurringTransaction(data).save();

// Fetch-then-save (rather than findOneAndUpdate) so the schema's
// pre('validate') hook - which enforces exactly one customInterval field
// when frequency is "custom" - actually runs; findOneAndUpdate skips
// document middleware even with runValidators: true.
export const updateById = async (userId, id, updateData) => {
  const doc = await RecurringTransaction.findOne({ _id: id, userId });
  if (!doc) return null;
  Object.assign(doc, updateData);
  return doc.save();
};

export const deleteById = (userId, id) => RecurringTransaction.findOneAndDelete({ _id: id, userId });

export const toggleActive = async (userId, id) => {
  const doc = await RecurringTransaction.findOne({ _id: id, userId });
  if (!doc) return null;
  doc.isActive = !doc.isActive;
  return doc.save();
};
