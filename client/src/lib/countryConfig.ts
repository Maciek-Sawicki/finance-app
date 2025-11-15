export const countryConfig = {
  // 🇺🇸 United States
  US: {
    name: "United States",
    flag: "🇺🇸",
    locale: "en-US",
  },

  // 🇩🇪 Germany 
  DE: {
    name: "Germany",
    flag: "🇩🇪",
    locale: "de-DE",
  },

  // 🇫🇷 France
  FR: {
    name: "France",
    flag: "🇫🇷",
    locale: "fr-FR",
  },

  // 🇪🇸 Spain
  ES: {
    name: "Spain",
    flag: "🇪🇸",
    locale: "es-ES",
  },

  // 🇮🇹 Italy
  IT: {
    name: "Italy",
    flag: "🇮🇹",
    locale: "it-IT",
  },

  // 🇳🇱 Netherlands
  NL: {
    name: "Netherlands",
    flag: "🇳🇱",
    locale: "nl-NL",
  },

  // 🇬🇧 United Kingdom
  GB: {
    name: "United Kingdom",
    flag: "🇬🇧",
    locale: "en-GB",
  },

  // 🇵🇱 Poland
  PL: {
    name: "Poland",
    flag: "🇵🇱",
    locale: "pl-PL",
  },

  // 🇨🇭 Switzerland
  CH: {
    name: "Switzerland",
    flag: "🇨🇭",
    locale: "de-CH",
  },

  // 🇯🇵 Japan
  JP: {
    name: "Japan",
    flag: "🇯🇵",
    locale: "ja-JP",
  },

  // 🇨🇦 Canada
  CA: {
    name: "Canada",
    flag: "🇨🇦",
    locale: "en-CA",
  },

  // 🇦🇺 Australia
  AU: {
    name: "Australia",
    flag: "🇦🇺",
    locale: "en-AU",
  },

  // 🇳🇿 New Zealand
  NZ: {
    name: "New Zealand",
    flag: "🇳🇿",
    locale: "en-NZ",
  },

  // 🇸🇪 Sweden
  SE: {
    name: "Sweden",
    flag: "🇸🇪",
    locale: "sv-SE",
  },

  // 🇳🇴 Norway
  NO: {
    name: "Norway",
    flag: "🇳🇴",
    locale: "nb-NO",
  },

  // 🇩🇰 Denmark
  DK: {
    name: "Denmark",
    flag: "🇩🇰",
    locale: "da-DK",
  },

  // 🇨🇿 Czech Republic
  CZ: {
    name: "Czech Republic",
    flag: "🇨🇿",
    locale: "cs-CZ",
  },

  // 🇭🇺 Hungary
  HU: {
    name: "Hungary",
    flag: "🇭🇺",
    locale: "hu-HU",
  },

  // 🇦🇪 United Arab Emirates
  AE: {
    name: "United Arab Emirates",
    flag: "🇦🇪",
    locale: "ar-AE",
  },
} as const

export type SupportedCountry = keyof typeof countryConfig
export type CountryInfo = (typeof countryConfig)[SupportedCountry]