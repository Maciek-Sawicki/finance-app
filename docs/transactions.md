# Transactions 🔒

Base path: `/api/transactions`

All endpoints require `Authorization: Bearer <token>`.

---

## POST /create

Create an income or expense transaction.

**Body**
```json
{
  "categoryId": "<id>",
  "accountId": "<id>",
  "type": "expense",
  "amount": 49.99,
  "date": "2025-06-01T10:00:00Z",
  "settled": true,
  "description": "Grocery shopping",
  "exclude": false
}
```

- `type`: `"income"` or `"expense"`
- `settled`: whether the transaction is confirmed (affects balance)
- `exclude`: exclude from analytics/summaries

**Response `201`** — `{ message, transaction }`

---

## POST /transfer

Create a transfer between two accounts. Automatically handles currency conversion.

**Body**
```json
{
  "fromAccountId": "<id>",
  "toAccountId": "<id>",
  "amount": 200.00,
  "toAmount": 850.00,
  "date": "2025-06-01T10:00:00Z",
  "description": "Moving funds"
}
```

- `toAmount` — optional, provide when you want to fix the received amount manually (otherwise auto-converted)

**Response `201`** — `{ message, expense, income, transfer }`

---

## GET /

Get all transactions with optional filters.

**Query params**
| Param | Description |
|-------|-------------|
| `accountId` | Filter by account |
| `categoryId` | Filter by category |
| `type` | `income` / `expense` |
| `settled` | `true` / `false` |
| `startDate` | ISO date |
| `endDate` | ISO date |
| `page` | Pagination page |
| `limit` | Results per page |

---

## GET /last

Get the most recent transactions (used on the dashboard).

---

## GET /:id

Get a single transaction by ID.

---

## PUT /:id

Update a transaction. Same fields as POST /create.

---

## DELETE /:id

Delete a transaction.

---

## PATCH /:id/toggle-settled

Toggle the `settled` status of a transaction.

**Response `200`** — `{ message, transaction }`
