# Transactions 🔒

Base path: `/api/transactions`

See [Authentication](./auth.md) for what 🔒 requires.

---

## POST /

Create an income or expense transaction.

**Body**
```json
{
  "categoryId": "<id>",
  "accountId": "<id>",
  "type": "expense",
  "amount": 49.99,
  "date": "2026-06-01T10:00:00Z",
  "settled": true,
  "description": "Grocery shopping",
  "exclude": false
}
```

- `categoryId`, `accountId`, `type`, `amount` are required.
- `accountId`/`categoryId` must belong to the caller (`404` otherwise).
- `type`: `"income"` or `"expense"`.
- `amount` must be a positive number.
- `settled`: whether the transaction is confirmed (affects the live-computed account balance).
- `exclude`: exclude from analytics/summaries.

**Response `201`** — `{ message, transaction }`

---

## POST /transfer

Create a transfer between two accounts — writes two linked transactions (an expense on the source account, an income on the destination) plus a `Transfer` record, atomically. Currency conversion is automatic when the two accounts use different currencies.

**Body**
```json
{
  "fromAccountId": "<id>",
  "toAccountId": "<id>",
  "amount": 200.00,
  "toAmount": 850.00,
  "date": "2026-06-01T10:00:00Z",
  "description": "Moving funds"
}
```

- `fromAccountId`, `toAccountId`, `amount` are required; the two accounts must differ and both must belong to the caller.
- `toAmount` — optional, provide when you want to fix the received amount manually (otherwise auto-converted using the current exchange rate).

**Response `201`** — `{ message, transfer, transactions: [expenseTransaction, incomeTransaction] }`

---

## GET /

Get all transactions with optional filters, paginated.

**Query params**
| Param | Description |
|-------|-------------|
| `accountId` | Filter by account |
| `categoryId` | Filter by category |
| `type` | `income` / `expense` |
| `startDate` | ISO date |
| `endDate` | ISO date |
| `page` | Pagination page (default 1) |
| `limit` | Results per page (default 20, max 100) |

**Response `200`** — `{ data, total, page, totalPages }`

---

## GET /last

Get the most recent transactions (used on the dashboard).

**Query params** — `limit` (default 5)

---

## GET /:id

Get a single transaction by ID. `404` if not found/not owned.

---

## PUT /:id

Update a transaction. Any subset of the `POST /` body fields. `accountId`/`categoryId`, if sent, must belong to the caller (`404` otherwise); `type` and `amount`, if sent, are validated the same way as on create (`400` if invalid).

---

## DELETE /:id

Soft-deletes the transaction (hidden from every read, not physically removed).

---

## PATCH /:id/toggle-settled

Toggle the `settled` status of a transaction.

**Response `200`** — `{ message, transaction }`
