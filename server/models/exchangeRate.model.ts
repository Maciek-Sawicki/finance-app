import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from "mongoose";

const exchangeRateSchema = new Schema({
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

export type ExchangeRateAttrs = InferSchemaType<typeof exchangeRateSchema>;
export type ExchangeRateDocument = HydratedDocument<ExchangeRateAttrs>;

const ExchangeRate = mongoose.model("ExchangeRate", exchangeRateSchema);
export default ExchangeRate;
