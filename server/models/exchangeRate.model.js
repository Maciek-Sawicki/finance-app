import mongoose from "mongoose";

const exchangeRateSchema = new mongoose.Schema({
  base: {
    type: String,
    required: true
  },
  rates: {
    type: Map,
    of: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const ExchangeRate = mongoose.model("ExchangeRate", exchangeRateSchema);
export default ExchangeRate;
