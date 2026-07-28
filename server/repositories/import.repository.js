import Import from "../models/import.model.js";

const LIST_FIELDS = "_id accountId fileName status rowCount importedCount skippedCount createdAt uploadDate";

export const findByUser = (userId) =>
  Import.find({ userId }).sort({ createdAt: -1 }).select(LIST_FIELDS).lean();

export const findById = (userId, importId) => Import.findOne({ _id: importId, userId }).lean();

export const create = async (data, { session } = {}) => {
  const [doc] = await Import.create([data], { session, ordered: true });
  return doc;
};

export const deleteById = (userId, importId) => Import.findOneAndDelete({ _id: importId, userId }).lean();
