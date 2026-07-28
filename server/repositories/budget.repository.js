import Budget from "../models/budget.model.js";

const CATEGORY_FIELDS = "name icon color type";

export const findByUser = (userId, filter = {}) =>
  Budget.find({ userId, ...filter }).sort({ startDate: -1 }).populate("categoryId", CATEGORY_FIELDS).lean();

export const findByCategory = (userId, categoryId) =>
  Budget.find({ userId, categoryId }).sort({ startDate: -1 }).populate("categoryId", CATEGORY_FIELDS).lean();

export const findById = (userId, budgetId) =>
  Budget.findOne({ _id: budgetId, userId }).populate("categoryId", CATEGORY_FIELDS).lean();

export const create = (data) => Budget.create(data).then((doc) => doc.toObject());

export const updateById = (userId, budgetId, updateData) =>
  Budget.findOneAndUpdate({ _id: budgetId, userId }, { $set: updateData }, { new: true, runValidators: true }).lean();

export const deleteById = (userId, budgetId) => Budget.findOneAndDelete({ _id: budgetId, userId }).lean();
