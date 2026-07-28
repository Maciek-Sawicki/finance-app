# Budgets 🔒

Base path: `/api/budgets`

See [Authentication](./auth.md) for what 🔒 requires.

---

## POST /

**Body**
```json
{
  "categoryId": "<id>",
  "amount": 500.00,
  "currency": "USD",
  "startDate": "2026-06-01",
  "endDate": "2026-06-30",
  "type": "recurring",
  "recurrencePeriod": "monthly"
}
```

- `categoryId`, `amount`, `currency`, `startDate`, `endDate` are required.
- `categoryId` must belong to the caller and be an **expense** category, or the request is rejected (`404` if not owned, `400` if not an expense category).
- `type`: `"fixed"` or `"recurring"` (default `"recurring"`).
- `recurrencePeriod`: `"weekly"`, `"monthly"`, `"quarterly"`, `"yearly"` — only valid when `type` is `"recurring"`; a `"fixed"` budget with `recurrencePeriod` set is rejected (`400`).

**Response `201`** — the created budget document.

---

## GET /

Get all budgets with live spending progress.

**Query params**
| Param | Required | Description |
|-------|----------|-------------|
| `targetCurrency` | ✅ | Currency to convert amounts/spend into |
| `status` | | Filter: `active` \| `completed` |
| `type` | | Filter: `fixed` \| `recurring` |

**Response `200`** — Array of budgets, each including:
```json
{
  "spent": 234.50,
  "progress": 46.9,
  "convertedAmount": 500.00,
  "originalAmount": 500.00,
  "originalCurrency": "USD",
  "targetCurrency": "USD",
  ...
}
```

---

## GET /by-status/:status

Filter budgets by status. `status` (path param) must be `active` or `completed`, otherwise `400`.

**Query params** — `targetCurrency` (required)

---

## GET /:id

Get a single budget with progress. **Query params** — `targetCurrency` (required). `404` if not found/not owned.

---

## GET /history/:id

Historical budgets for a category (`:id` is a `categoryId`, not a budget id), each with a computed `status` (`active`/`completed` based on the end date and how much has been spent).

**Query params** — `targetCurrency` (required)

---

## PUT /:id

Update a budget. `categoryId` is not updatable. Any subset of: `amount`, `currency`, `startDate`, `endDate`, `type`, `recurrencePeriod`, `carryOver`, `status`. Setting `endDate` in the past automatically sets `status` to `"completed"`.

---

## DELETE /:id

Soft-deletes the budget (hidden from every read, not physically removed).

**Response `200`** — `{ "message": "Budget deleted successfully." }`
