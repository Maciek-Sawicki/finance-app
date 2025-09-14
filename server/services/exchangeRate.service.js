import axios from 'axios';
import ExchangeRate from '../models/exchangeRate.model.js';

export const fetchAndSaveRates = async (baseCurrency = "USD") => {
  try {
    const url = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
    const { data } = await axios.get(url);
    if (!data || !data.rates) {
      throw new Error('Failed to fetch exchange rates.');
    }

    const newRates = new ExchangeRate({
      base: data.base,
      rates: data.rates,
      date: new Date(data.date),
    });

    await newRates.save();
    console.log('Exchange rates updated successfully');
    return newRates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
};

export const convertCurrency = async (amount, from, to, baseCurrency = "USD") => {
  const ratesDoc = await ExchangeRate.findOne({ base: baseCurrency }).sort({ createdAt: -1 }).lean();

  if (!ratesDoc) throw new Error("No exchange rates found.");

  const rates = ratesDoc.rates;

  if (!rates[from] || !rates[to]) {
    console.error("Available currencies:", Object.keys(rates));
    throw new Error("Unsupported currency: " + from + " or " + to);
  }

  const rateFrom = Number(rates[from]);
  const rateTo = Number(rates[to]);

  const amountInBase = amount / rateFrom;
  const converted = amountInBase * rateTo;

  return Number(converted.toFixed(2));
};
