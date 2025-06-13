import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  defaultCurrency: {
    type: String,
    required: true,
    trim: true,
  },
  theme: {
    type: String,
    enum: ["light", "dark", "system"],
    default: "system",
  }
}, {
  timestamps: true, 
});
const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;