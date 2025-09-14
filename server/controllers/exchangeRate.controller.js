import { fetchAndSaveRates, convertCurrency } from '../services/exchangeRate.service.js';

export const updateExchangeRates = async (req, res) => {
  try {
   const { base } = req.query;
    const rates = await fetchAndSaveRates(base || "USD");
    res.status(200).json({ message: "Exchange rates updated successfully", rates });
  } catch (error) {
    console.error("Error updating exchange rates:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const convertAmount = async (req, res) => {
  try {
    const { amount, from, to } = req.query;
    if (!amount || !from || !to) {
      return res.status(400).json({ message: "Missing required query parameters: amount, from, to" });
    }

    const convertedAmount = await convertCurrency(parseFloat(amount), from, to);
    res.status(200).json({ amount: convertedAmount, from, to });
  } catch (error) {
    console.error("Error converting currency:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};