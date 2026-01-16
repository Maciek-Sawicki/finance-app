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
    default: null,
    required: function () {
      return this.importId === null;
    }
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
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
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transfer",
    default: null,
  },
  importId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Import",
    default: null,
  }  
}, {
  timestamps: true, 
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;