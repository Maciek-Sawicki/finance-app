# Exchange Rates

Base path: `/api/rates`

All endpoints here are **public** (no auth required) — rate limited instead (60 requests/min per IP for the reads below). Rates are based on USD and refreshed automatically every 6 hours by a cron job (`fetchRatesJob`), guarded by a distributed lock so only one server instance runs it.

---

## GET /

Get the latest exchange rates document.

**Query params**
| Param | Default | Description |
|-------|---------|-------------|
| `base` | `USD` | Base currency of the document to fetch |

**Response `200`**
```json
{
  "base": "USD",
  "rates": { "EUR": 0.92, "PLN": 3.97, "GBP": 0.79, ... },
  "date": "2026-06-01T06:00:00Z"
}
```

**Response `404`** — no rates document exists yet for that base currency.

---

## GET /currencies

All available currency codes from the latest rates document.

**Response `200`** — `[{ "code": "USD" }, { "code": "EUR" }, ...]`

---

## GET /currencies/popular

A fixed shortlist of popular currencies (USD, EUR, GBP, PLN, CHF, JPY, CAD, AUD, NZD, SEK, NOK, DKK, CZK, HUF, AED), filtered to only ones present in the latest rates document.

---

## GET /convert

Convert an amount between two currencies.

**Query params**
| Param | Required | Description |
|-------|----------|-------------|
| `amount` | ✅ | Numeric amount |
| `from` | ✅ | Source currency code |
| `to` | ✅ | Target currency code |

**Example** — `GET /api/rates/convert?amount=100&from=USD&to=PLN`

**Response `200`**
```json
{ "amount": 397.00, "from": "USD", "to": "PLN" }
```
(`amount` in the response is the *converted* amount, not the input.)

**Response `400`** — missing param, or `amount` isn't a valid number.

---

## POST /update 🔒

Rate limited: 10 requests / 30s. Manually trigger a rates refresh from the external API (same thing the cron job does).

**Query params** — `base` (optional, defaults to `USD`)

**Response `200`** — `{ message, rates }`
