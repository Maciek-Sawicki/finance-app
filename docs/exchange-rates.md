# Exchange Rates

Base path: `/api/rates`

Exchange rates endpoints are **public** (no auth required). Rates are based on USD and updated automatically by a cron job.

---

## GET /

Get the latest exchange rates document.

**Response `200`**
```json
{
  "base": "USD",
  "rates": { "EUR": 0.92, "PLN": 3.97, "GBP": 0.79, ... },
  "updatedAt": "2025-06-01T06:00:00Z"
}
```

---

## GET /currencies

Get all available currency codes.

**Response `200`** — `["USD", "EUR", "PLN", ...]`

---

## GET /currencies/popular

Get a short list of popular currencies.

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
{ "amount": 100, "from": "USD", "to": "PLN", "result": 397.00 }
```

---

## POST /update

Manually trigger a rates refresh (fetches latest data from external API).

**Response `200`** — `{ message }`
