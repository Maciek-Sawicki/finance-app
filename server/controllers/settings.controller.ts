import * as settingsRepository from "../repositories/settings.repository.js";
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
  let settings = await settingsRepository.findByUser(userId);

  if (!settings) {
    // The User schema has no country field, so this is always "US" - kept
    // as a literal default rather than a fake req.user.country read.
    const defaultCountry = "US";
    const locale = countryConfig[defaultCountry]?.locale || "en-US";

    settings = await settingsRepository.create({
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

  const updated = await settingsRepository.updateByUser(userId, updates);

  res.status(200).json(updated);
});
