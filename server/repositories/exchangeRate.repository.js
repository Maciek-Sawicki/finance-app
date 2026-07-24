import ExchangeRate from "../models/exchangeRate.model.js";

export const findLatest = (filter = {}) =>
  ExchangeRate.findOne(filter).sort({ createdAt: -1 }).lean();

export const insertRates = ({ base, rates, date }) =>
  ExchangeRate.create({ base, rates, date });
