import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  country: { type: String, default: "US" },
  locale: { type: String, default: "en-US" },
  defaultCurrency: { type: String, required: true, default: "PLN" },
  favoriteCurrencies: { type: [String], default: [] },
  theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
}, { timestamps: true });

export default mongoose.model("Settings", settingsSchema);

