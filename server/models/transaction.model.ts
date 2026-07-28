import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from "mongoose";

const transactionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    default: null,
    required: function (this: { importId: mongoose.Types.ObjectId | null }) {
      return this.importId === null;
    }
  },
  accountId: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  type: {
    type: String,
    enum: ["income", "expense"],
    required: true,
  },
  exclude: {
    type: Boolean,
    default: false,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  settled: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    trim: true,
  },
  transferId: {
    type: Schema.Types.ObjectId,
    ref: "Transfer",
    default: null,
  },
  importId: {
    type: Schema.Types.ObjectId,
    ref: "Import",
    default: null,
  }
}, {
  timestamps: true,
});

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, accountId: 1 });
transactionSchema.index({ userId: 1, categoryId: 1 });
transactionSchema.index({ importId: 1 });
transactionSchema.index({ transferId: 1 });

export type TransactionAttrs = InferSchemaType<typeof transactionSchema>;
export type TransactionDocument = HydratedDocument<TransactionAttrs>;

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
