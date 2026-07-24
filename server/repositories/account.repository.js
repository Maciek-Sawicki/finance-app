import Account from "../models/account.model.js";

export const findByUser = (userId, filter = {}) =>
  Account.find({ userId, ...filter }).sort({ createdAt: -1 }).lean();

export const findById = (userId, accountId) =>
  Account.findOne({ _id: accountId, userId }).lean();

export const findDefault = (userId) =>
  Account.findOne({ userId, isDefault: true }).lean();

export const create = (data) => Account.create(data).then((doc) => doc.toObject());

export const updateById = (userId, accountId, updateData) =>
  Account.findOneAndUpdate({ _id: accountId, userId }, updateData, { new: true }).lean();

export const deleteById = (userId, accountId) =>
  Account.findOneAndDelete({ _id: accountId, userId }).lean();

export const unsetDefaultForUser = (userId) =>
  Account.updateMany({ userId }, { $set: { isDefault: false } });
