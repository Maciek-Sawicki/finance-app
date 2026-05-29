# Recurring Transactions 🔒

Base path: `/api/recurring-transactions`

All endpoints require `Authorization: Bearer <token>`.

Recurring transactions are automatically applied by a cron job based on `nextDueDate` and `frequency`.

---

## POST /

Create a recurring transaction.

**Body**
```json
{
  "name": "Netflix",
  "categoryId": "<id>",
  "accountId": "<id>",
  "amount": 15.99,
  "frequency": "monthly",
  "nextDueDate": "2025-07-01",
  "description": "Streaming subscription",
  "isActive": true,
  "settled": false
}
```

**`frequency` values:** `daily`, `weekly`, `biweekly`, `monthly`, `quarterly`, `yearly`, `custom`

**Custom frequency** — provide `customInterval` with exactly one of:
```json
{
  "frequency": "custom",
  "customInterval": {
    "everyXDays": 10
  }
}
```
or
```json
{
  "customInterval": {
    "dayOfWeek": "Monday",
    "weekOfMonth": "First"
  }
}
```

Options: `everyXDays`, `everyXWeeks`, `everyXMonths`, `dayOfMonth`, `dayOfWeek` + `weekOfMonth` (paired)

**Response `201`** — `{ message, transaction }`

---

## GET /

Get all recurring transactions for the user.

---

## GET /:id

Get a single recurring transaction.

---

## PUT /:id

Update a recurring transaction. Same fields as POST.

---

## DELETE /:id

Delete a recurring transaction.

---

## PATCH /toggle/:id

Toggle `isActive` on/off.

**Response `200`** — `{ message, transaction }`
