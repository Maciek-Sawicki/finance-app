import mongoose from "mongoose";
import Category, { type CategoryAttrs } from "../models/category.model.js";
import type { Id, SessionOption } from "../types/common.js";

export const findByNameAndType = (userId: Id, name: string, type: string, { session }: SessionOption = {}) =>
  Category.findOne({ userId, name, type }).session(session ?? null);

export const findById = (userId: Id, categoryId: Id) => Category.findOne({ _id: categoryId, userId }).lean();

export const create = async (data: mongoose.AnyKeys<CategoryAttrs>, { session }: SessionOption = {}) => {
  const [doc] = await Category.create([data], { session, ordered: true });
  return doc;
};
