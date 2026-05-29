# Budgets 🔒

Base path: `/api/budgets`

All endpoints require `Authorization: Bearer <token>`.

---

## POST /create

**Body**
```json
{
  "categoryId": "<id>",
  "amount": 500.00,
  "currency": "USD",
  "startDate": "2025-06-01",
  "endDate": "2025-06-30",
  "type": "monthly",
  "recurrencePeriod": "monthly"
}
```

**Response `201`** — `{ message, budget }`

---

## GET /

Get all budgets with live spending progress.

**Query params**
| Param | Default | Description |
|-------|---------|-------------|
| `currency` | `USD` | Target currency for conversion |

**Response `200`** — Array of budgets, each including:
```json
{
  "spent": 234.50,
  "progress": 46.9,
  "convertedAmount": 500.00,
  "targetCurrency": "USD",
  ...
}
```

---

## GET /getByType

Filter budgets by type.

**Query params** — `type`

---

## GET /:id

Get a single budget with progress.

---

## GET /history/:id

Get historical spending data for a budget.

---

## PUT /:id

Update a budget. Same fields as POST /create.

---

## DELETE /:id

Delete a budget.
