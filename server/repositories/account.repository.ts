import mongoose from "mongoose";
import Account, { type AccountAttrs } from "../models/account.model.js";
import type { Id } from "../types/common.js";

export const findByUser = (userId: Id, filter: mongoose.FilterQuery<AccountAttrs> = {}) =>
  Account.find({ userId, ...filter }).sort({ createdAt: -1 }).lean();

export const findById = (userId: Id, accountId: Id) =>
  Account.findOne({ _id: accountId, userId }).lean();

export const findDefault = (userId: Id) =>
  Account.findOne({ userId, isDefault: true }).lean();

export const create = (data: mongoose.AnyKeys<AccountAttrs>) => Account.create(data).then((doc) => doc.toObject());

export const updateById = (userId: Id, accountId: Id, updateData: mongoose.UpdateQuery<AccountAttrs>) =>
  Account.findOneAndUpdate({ _id: accountId, userId }, updateData, { new: true }).lean();

export const deleteById = (userId: Id, accountId: Id) =>
  Account.findOneAndDelete({ _id: accountId, userId }).lean();

export const unsetDefaultForUser = (userId: Id) =>
  Account.updateMany({ userId }, { $set: { isDefault: false } });
