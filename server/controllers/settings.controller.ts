import Settings from "../models/settings.model.js";
import { countryConfig } from "../libs/countryConfig.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

interface SettingsUpdate {
  defaultCurrency?: string;
  favoriteCurrencies?: string[];
  theme?: string;
  country?: string;
  locale?: string;
}

export const getSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  let settings = await Settings.findOne({ userId });

  if (!settings) {
    // The User schema has no country field, so this is always "US" - kept
    // as a literal default rather than a fake req.user.country read.
    const defaultCountry = "US";
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
});

export const createSettings = asyncHandler(async (req, res) => {
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
});

export const updateSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Only allow specific fields to be updated - explicit per-field checks
  // (rather than looping over a field-name array) so each assignment stays
  // type-checked.
  const updates: SettingsUpdate = {};
  if (req.body.defaultCurrency !== undefined) updates.defaultCurrency = req.body.defaultCurrency;
  if (req.body.favoriteCurrencies !== undefined) updates.favoriteCurrencies = req.body.favoriteCurrencies;
  if (req.body.theme !== undefined) updates.theme = req.body.theme;
  if (req.body.country !== undefined) updates.country = req.body.country;

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
});
