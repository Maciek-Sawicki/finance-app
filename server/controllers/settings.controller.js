import Settings from "../models/settings.model.js";
import { countryConfig } from "../libs/countryConfig.js";

export const getSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    let settings = await Settings.findOne({ userId });

    if (!settings) {
      const defaultCountry = req.user.country || "US";
      const locale = countryConfig[defaultCountry]?.locale || "en-US";

      settings = await Settings.create({
        userId,
        defaultCurrency: "USD",
        favoriteCurrencies: ["USD", "EUR", "PLN"],
        locale,
        theme: "system",
        country: defaultCountry,
      });
    }

    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


export const createSettings = async (req, res) => {
  try {
    const userId = req.user._id;

    const existing = await Settings.findOne({ userId });
    if (existing) {
      return res.status(400).json({ message: "Settings already exist" });
    }

    const { defaultCurrency = "USD", theme = "system", country = "US" } = req.body;
    const locale = countryConfig[country]?.locale || "en-US";

    const newSettings = await Settings.create({
      userId,
      defaultCurrency,
      theme,
      country,
      locale,
    });

    res.status(201).json(newSettings);
  } catch (error) {
    console.error("Error creating settings:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const userId = req.user._id;

    // Only allow specific fields to be updated
    const allowedFields = [
      "defaultCurrency",
      "favoriteCurrencies",
      "theme",
      "country",
    ];

    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    if (updates.country) {
      const cfg = countryConfig[updates.country];
      if (cfg) {
        updates.locale = cfg.locale; 
      }
    }

    const updated = await Settings.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
