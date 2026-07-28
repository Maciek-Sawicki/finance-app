import mongoose from "mongoose";
import ExchangeRate, { type ExchangeRateAttrs } from "../models/exchangeRate.model.js";

export const findLatest = (filter: mongoose.FilterQuery<ExchangeRateAttrs> = {}) =>
  ExchangeRate.findOne(filter).sort({ createdAt: -1 }).lean();

interface InsertRatesInput {
  base: string;
  rates: Record<string, number> | Map<string, number>;
  date: Date;
}

export const insertRates = ({ base, rates, date }: InsertRatesInput) =>
  ExchangeRate.create({ base, rates, date });
