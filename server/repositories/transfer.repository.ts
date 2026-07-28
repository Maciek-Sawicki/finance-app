import mongoose from "mongoose";
import Transfer, { type TransferAttrs } from "../models/transfer.model.js";
import type { SessionOption } from "../types/common.js";

export const create = async (data: mongoose.AnyKeys<TransferAttrs>, { session }: SessionOption = {}) => {
  const [doc] = await Transfer.create([data], { session, ordered: true });
  return doc;
};
