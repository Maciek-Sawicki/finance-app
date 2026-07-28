# Settings 🔒

Base path: `/api/settings`

See [Authentication](./auth.md) for what 🔒 requires.

User settings store display preferences like currency, locale, and theme. There's no explicit "create" endpoint — a default settings document is created lazily the first time `GET /me` is called for a user who doesn't have one yet.

---

## GET /me

Get settings for the authenticated user. If none exist yet, creates and returns defaults (`country: "US"`, `defaultCurrency: "USD"`, `favoriteCurrencies: ["USD", "EUR", "PLN"]`, `theme: "system"`, `locale: "en-US"`).

**Response `200`**
```json
{
  "userId": "<id>",
  "country": "US",
  "locale": "en-US",
  "defaultCurrency": "USD",
  "favoriteCurrencies": ["USD", "EUR", "PLN"],
  "theme": "system"
}
```

---

## PATCH /me

Update one or more settings fields. Creates the document (upsert) if it doesn't exist yet.

**Body** — any subset of:
```json
{
  "country": "PL",
  "defaultCurrency": "PLN",
  "favoriteCurrencies": ["USD", "EUR"],
  "theme": "dark"
}
```

- `theme`: `"light"` | `"dark"` | `"system"`
- `locale` is not settable directly — sending a recognized `country` code automatically derives and sets the matching `locale` (see `libs/countryConfig.ts` for the supported country → locale map).

**Response `200`** — the updated settings document.
