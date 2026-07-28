# Recurring Transactions 🔒

Base path: `/api/recurring-transactions`

See [Authentication](./auth.md) for what 🔒 requires.

Recurring transactions are automatically applied by a cron job (`recurringTransactionsJob`, guarded by a distributed lock so only one server instance runs it) based on `nextDueDate` and `frequency`.

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
  "nextDueDate": "2026-07-01",
  "description": "Streaming subscription",
  "isActive": true,
  "settled": false
}
```

- `name`, `categoryId`, `accountId`, `amount`, `frequency`, `nextDueDate` are required.
- `accountId`/`categoryId` must belong to the caller (`404` otherwise).
- `frequency`: `daily`, `weekly`, `biweekly`, `monthly`, `quarterly`, `yearly`, `custom`

**Custom frequency** — provide `customInterval` with **exactly one** of:
```json
{
  "frequency": "custom",
  "customInterval": { "everyXDays": 10 }
}
```
or
```json
{
  "frequency": "custom",
  "customInterval": { "dayOfWeek": "Monday", "weekOfMonth": "First" }
}
```

Options: `everyXDays`, `everyXWeeks`, `everyXMonths`, `dayOfMonth`, or `dayOfWeek` + `weekOfMonth` (must be set together). Setting zero, more than one, or an unpaired `dayOfWeek`/`weekOfMonth` is rejected with a validation error (`400`).

**Response `201`** — `{ message, transaction }`

---

## GET /

Get all recurring transactions for the user.

---

## GET /:id

Get a single recurring transaction. `404` if not found/not owned.

---

## PUT /:id

Update a recurring transaction. Same optional fields as `POST /`. `accountId`/`categoryId`, if sent, must belong to the caller (`404` otherwise).

---

## DELETE /:id

Soft-deletes the recurring transaction (hidden from every read, not physically removed).

---

## PATCH /:id/toggle

Toggle `isActive` on/off.

**Response `200`** — `{ message: "Recurring transaction activated" | "Recurring transaction deactivated", transaction }`
