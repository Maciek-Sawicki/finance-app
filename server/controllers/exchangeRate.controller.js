import { fetchAndSaveRates, convertCurrency, getLatestDocument } from '../services/exchangeRate.service.js';

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

export const getAvailableCurrencies = async (req, res) => {
  try {
    const ratesDoc = await getLatestDocument();
    if (!ratesDoc) {
      return res.status(404).json({ message: "No exchange rates found." });
    }
    const currencies = Object.keys(ratesDoc.rates).map(code => ({
      code
    }));

    res.status(200).json(currencies);
  } catch (error) {
    console.error("Error fetching currencies:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const POPULAR_CURRENCIES = [
  "USD", "EUR", "GBP", "PLN", "CHF", "JPY", "CAD", "AUD", "NZD",
  "SEK", "NOK", "DKK", "CZK", "HUF", "AED"
];

export const getPopularCurrencies = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error fetching popular currencies:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getExchangeRates = async (req, res) => {
  try {
    const { base } = req.query;
    const ratesDoc = await getLatestDocument(base);

    if (!ratesDoc) {
      return res.status(404).json({ message: "No exchange rates found." });
    }

    res.status(200).json(ratesDoc);
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}