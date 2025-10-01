import mongoose from "mongoose";

const transferSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fromAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  toAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  fromAmount: {
    type: Number,
    required: true,
    min: 0, 
  },
  fromCurrency: {
    type: String,
    required: true,
  },
  toAmount: {
    type: Number,
    required: true,
    min: 0, 
  },
  toCurrency: {
    type: String,
    required: true,
  },
  exchangeRate: {
    type: Number,
    required: true,
    min: 0, 
  },
}, {
  timestamps: true, 
});

const Transfer = mongoose.model("Transfer", transferSchema);
export default Transfer;