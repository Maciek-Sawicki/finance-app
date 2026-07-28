import mongoose from "mongoose";
import Budget, { type BudgetAttrs } from "../models/budget.model.js";
import type { CategoryAttrs } from "../models/category.model.js";
import type { Id } from "../types/common.js";

const CATEGORY_FIELDS = "name icon color type";

type PopulatedCategory = Pick<CategoryAttrs, "name" | "icon" | "color" | "type"> & { _id: mongoose.Types.ObjectId };
type BudgetPopulate = { categoryId: PopulatedCategory };

export const findByUser = (userId: Id, filter: mongoose.FilterQuery<BudgetAttrs> = {}) =>
  Budget.find({ userId, ...filter }).sort({ startDate: -1 }).populate<BudgetPopulate>("categoryId", CATEGORY_FIELDS).lean();

export const findByCategory = (userId: Id, categoryId: Id) =>
  Budget.find({ userId, categoryId }).sort({ startDate: -1 }).populate<BudgetPopulate>("categoryId", CATEGORY_FIELDS).lean();

export const findById = (userId: Id, budgetId: Id) =>
  Budget.findOne({ _id: budgetId, userId }).populate<BudgetPopulate>("categoryId", CATEGORY_FIELDS).lean();

export const create = (data: mongoose.AnyKeys<BudgetAttrs>) => Budget.create(data).then((doc) => doc.toObject());

export const updateById = (userId: Id, budgetId: Id, updateData: mongoose.UpdateQuery<BudgetAttrs>) =>
  Budget.findOneAndUpdate({ _id: budgetId, userId }, { $set: updateData }, { new: true, runValidators: true }).lean();

export const deleteById = (userId: Id, budgetId: Id) => Budget.findOneAndDelete({ _id: budgetId, userId }).lean();
