import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from "mongoose";

const settingsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  country: { type: String, default: "US" },
  locale: { type: String, default: "en-US" },
  defaultCurrency: { type: String, required: true, default: "PLN" },
  favoriteCurrencies: { type: [String], default: [] },
  theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
}, { timestamps: true });

export type SettingsAttrs = InferSchemaType<typeof settingsSchema>;
export type SettingsDocument = HydratedDocument<SettingsAttrs>;

export default mongoose.model<SettingsAttrs>("Settings", settingsSchema);
