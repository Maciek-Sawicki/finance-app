import { fetchAndSaveRates, convertCurrency, getLatestDocument } from '../services/exchangeRate.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const updateExchangeRates = asyncHandler(async (req, res) => {
  const { base } = req.query as { base?: string };
  const rates = await fetchAndSaveRates(base || "USD");
  res.status(200).json({ message: "Exchange rates updated successfully", rates });
});

export const convertAmount = asyncHandler(async (req, res) => {
  const { amount, from, to } = req.query as { amount?: string; from?: string; to?: string };
  if (!amount || !from || !to) {
    return res.status(400).json({ message: "Missing required query parameters: amount, from, to" });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) {
    return res.status(400).json({ message: "amount must be a number." });
  }

  const convertedAmount = await convertCurrency(numericAmount, from, to);
  res.status(200).json({ amount: convertedAmount, from, to });
});

export const getAvailableCurrencies = asyncHandler(async (req, res) => {
  const ratesDoc = await getLatestDocument();
  if (!ratesDoc) {
    return res.status(404).json({ message: "No exchange rates found." });
  }
  const currencies = Object.keys(ratesDoc.rates).map(code => ({
    code
  }));

  res.status(200).json(currencies);
});

const POPULAR_CURRENCIES = [
  "USD", "EUR", "GBP", "PLN", "CHF", "JPY", "CAD", "AUD", "NZD",
  "SEK", "NOK", "DKK", "CZK", "HUF", "AED"
];

export const getPopularCurrencies = asyncHandler(async (req, res) => {
  const ratesDoc = await getLatestDocument();

  if (!ratesDoc) {
    return res.status(404).json({ message: "No exchange rates found." });
  }

  const currencies = POPULAR_CURRENCIES
    .filter(code => ratesDoc.rates[code])
    .map(code => ({
      code,
    }));

  res.status(200).json(currencies);
});

export const getExchangeRates = asyncHandler(async (req, res) => {
  const { base } = req.query as { base?: string };
  const ratesDoc = await getLatestDocument(base);

  if (!ratesDoc) {
    return res.status(404).json({ message: "No exchange rates found." });
  }

  res.status(200).json(ratesDoc);
});
