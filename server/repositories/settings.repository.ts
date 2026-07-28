import mongoose from "mongoose";
import Settings, { type SettingsAttrs } from "../models/settings.model.js";
import type { Id } from "../types/common.js";

export const findByUser = (userId: Id) => Settings.findOne({ userId }).lean();

export const create = (data: mongoose.AnyKeys<SettingsAttrs>) => Settings.create(data).then((doc) => doc.toObject());

export const updateByUser = (userId: Id, updateData: mongoose.UpdateQuery<SettingsAttrs>) =>
  Settings.findOneAndUpdate({ userId }, { $set: updateData }, { new: true, upsert: true }).lean();
