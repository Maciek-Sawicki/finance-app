# Accounts 🔒

Base path: `/api/accounts`

All endpoints require `Authorization: Bearer <token>`.

---

## POST /create

Create a new account.

**Body**
```json
{
  "name": "Main Checking",
  "type": "checking",
  "currency": "USD",
  "startingBalance": 1000.00,
  "icon": "🏦",
  "description": "My main bank account",
  "isDefault": true
}
```

**Response `201`** — `{ message, account }`

---

## GET /

Get all accounts with calculated balances.

**Query params**
| Param | Default | Description |
|-------|---------|-------------|
| `currency` | `USD` | Target currency for `convertedBalance` |

**Response `200`** — Array of accounts, each with `balance` and `convertedBalance`.

---

## GET /default

Get the user's default account with settled and total (including receivables/payables) balance.

**Response `200`**
```json
{
  "name": "Main Checking",
  "balance": 1250.00,
  "balanceAfterRP": 1320.00,
  "currency": "USD",
  ...
}
```

---

## GET /total-balance

Get the total balance across all accounts converted to a single currency.

**Query params**
| Param | Required | Description |
|-------|----------|-------------|
| `base` | ✅ | Target currency (e.g. `PLN`) |

**Response `200`**
```json
{
  "totalBalance": 5200.00,
  "totalAfterRP": 5450.00,
  "currency": "PLN"
}
```

---

## GET /summary

Get per-account balances with settled and receivables/payables breakdown, all converted to a target currency.

**Query params**
| Param | Default | Description |
|-------|---------|-------------|
| `currency` | `USD` | Target currency |

---

## GET /by-type/:type

Get accounts filtered by type (e.g. `checking`, `savings`, `investment`).

---

## GET /by-currency/:currency

Get accounts filtered by currency (e.g. `USD`, `EUR`).

---

## GET /:id

Get a single account by ID with its current balance.

---

## GET /:id/balance

Get just the numeric balance for an account.

**Response `200`** — `{ "balance": 1250.00 }`

---

## PUT /:id

Update account fields. All body fields are optional.

**Body** — any subset of: `name`, `type`, `currency`, `startingBalance`, `icon`, `description`, `isDefault`

---

## DELETE /:id

Delete an account and all its transactions.

---

## POST /:id/default

Set an account as the default. Clears the previous default.
