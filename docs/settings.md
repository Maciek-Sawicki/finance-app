# Settings 🔒

Base path: `/api/settings`

All endpoints require `Authorization: Bearer <token>`.

User settings store display preferences like currency, locale, and theme.

---

## GET /me

Get settings for the authenticated user.

**Response `200`**
```json
{
  "userId": "<id>",
  "country": "US",
  "preferredLocale": "en-US",
  "defaultCurrency": "USD",
  "favoriteCurrencies": ["EUR", "PLN"],
  "theme": "system"
}
```

---

## PATCH /me

Update one or more settings fields.

**Body** — any subset of:
```json
{
  "country": "PL",
  "preferredLocale": "pl-PL",
  "defaultCurrency": "PLN",
  "favoriteCurrencies": ["USD", "EUR"],
  "theme": "dark"
}
```

- `theme`: `"light"` | `"dark"` | `"system"`

**Response `200`** — `{ message, settings }`
