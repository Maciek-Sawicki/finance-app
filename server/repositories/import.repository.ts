import mongoose from "mongoose";
import Import, { type ImportAttrs } from "../models/import.model.js";
import type { Id, SessionOption } from "../types/common.js";

const LIST_FIELDS = "_id accountId fileName status rowCount importedCount skippedCount createdAt uploadDate";

export const findByUser = (userId: Id) =>
  Import.find({ userId }).sort({ createdAt: -1 }).select(LIST_FIELDS).lean();

export const findById = (userId: Id, importId: Id) => Import.findOne({ _id: importId, userId }).lean();

export const create = async (
  data: mongoose.AnyKeys<ImportAttrs> & { _id?: mongoose.Types.ObjectId },
  { session }: SessionOption = {}
) => {
  const [doc] = await Import.create([data], { session, ordered: true });
  return doc;
};

export const deleteById = (userId: Id, importId: Id) => Import.findOneAndDelete({ _id: importId, userId }).lean();
