import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account", 
    required: true,
  },
  type: {
    type: String,
    enum: ["income", "expense", "exclude"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0, 
  },
  currency: {
    type: String,
    required: true,
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
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transfer",
    default: null,
  },
}, {
  timestamps: true, 
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;