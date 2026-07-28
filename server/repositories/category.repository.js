import Category from "../models/category.model.js";

export const findByNameAndType = (userId, name, type, { session } = {}) =>
  Category.findOne({ userId, name, type }).session(session ?? null);

export const findById = (userId, categoryId) => Category.findOne({ _id: categoryId, userId }).lean();

export const create = async (data, { session } = {}) => {
  const [doc] = await Category.create([data], { session, ordered: true });
  return doc;
};
