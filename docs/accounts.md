# Accounts 🔒

Base path: `/api/accounts`

See [Authentication](./auth.md) for what 🔒 requires.

---

## POST /

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

`name`, `type`, `currency`, `startingBalance` are required. `startingBalance` must be ≥ 0.

**Response `201`** — `{ message, account }`

---

## GET /

Get all accounts with calculated balances, each converted into a target currency.

**Query params**
| Param | Default | Description |
|-------|---------|-------------|
| `currency` | `USD` | Target currency for `convertedBalance` |

**Response `200`** — Array of accounts, each with `balance` (settled), `balanceAfterRP` (including unsettled receivables/payables), `convertedBalance`, `convertedCurrency`.

**Response `404`** — no accounts exist yet.

---

## GET /default

Get the user's default account (`isDefault: true`) with its balance.

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

Total balance across all accounts, converted into a single currency.

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

Per-account balances (settled + after-receivables/payables), each converted into a target currency.

**Query params**
| Param | Default | Description |
|-------|---------|-------------|
| `currency` | `USD` | Target currency |

---

## GET /by-type/:type

Accounts filtered by `type` (e.g. `checking`, `savings`, `investment` — free-text field, not an enum).

---

## GET /by-currency/:currency

Accounts filtered by `currency` (e.g. `USD`, `EUR`).

---

## GET /:id

Get a single account by ID with its current balance.

---

## GET /:id/balance

Just the numeric settled balance.

**Response `200`** — `{ "balance": 1250.00 }`

---

## PUT /:id

Update account fields. All body fields optional.

**Body** — any subset of: `name`, `type`, `currency`, `startingBalance`, `icon`, `description`, `isDefault`. `startingBalance`, if sent, must be ≥ 0.

---

## DELETE /:id

Soft-deletes the account and all of its transactions (marked `isDeleted`, hidden from every read — not physically removed).

**Response `200`** — `{ "message": "Account and related transactions deleted successfully" }`

---

## POST /:id/default

Set an account as the default. Unsets the previous default first.
