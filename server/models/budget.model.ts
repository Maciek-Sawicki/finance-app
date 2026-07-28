import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from "mongoose";
import { softDeletePlugin, type SoftDeleteAttrs } from "./plugins/softDelete.plugin.js";

const budgetSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },

  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  type: { type: String, enum: ["fixed", "recurring"], default: "recurring" },
  recurrencePeriod: {
    type: String,
    enum: ["weekly", "monthly", "quarterly", "yearly"],
  },

  carryOver: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ["active", "completed"],
    default: "active",
  },
}, { timestamps: true });

budgetSchema.plugin(softDeletePlugin);

export type BudgetAttrs = InferSchemaType<typeof budgetSchema> & SoftDeleteAttrs;
export type BudgetDocument = HydratedDocument<BudgetAttrs>;

export default mongoose.model<BudgetAttrs>("Budget", budgetSchema);
