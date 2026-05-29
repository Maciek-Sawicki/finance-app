# Imports 🔒

Base path: `/api/imports`

All endpoints require `Authorization: Bearer <token>`.

Imports allow uploading a CSV file to bulk-create transactions for an account.

---

## POST /

Upload a CSV file to create an import.

**Content-Type:** `multipart/form-data`

**Form fields**
| Field | Required | Description |
|-------|----------|-------------|
| `file` | ✅ | CSV file |
| `accountId` | ✅ | Target account ID |

**CSV format** — supports `,` and `;` delimiters. Required columns:

| Column | Aliases | Description |
|--------|---------|-------------|
| `date` | `data` | Transaction date |
| `amount` | `kwota` | Positive = income, negative = expense |
| `description` | `opis` | Optional description |

**Response `201`** — `{ message, import: { _id, fileName, status, rowCount, importedCount, skippedCount } }`

---

## GET /

Get all imports for the user.

---

## GET /:id/transactions

Get all transactions belonging to an import.

---

## PATCH /transactions/:transactionId/category

Assign a category to a single imported transaction.

**Body**
```json
{ "categoryId": "<id>" }
```

---

## PATCH /:id/categories

Batch assign categories to multiple transactions in an import.

**Body**
```json
{
  "assignments": [
    { "transactionId": "<id>", "categoryId": "<id>" },
    { "transactionId": "<id>", "categoryId": "<id>" }
  ]
}
```

---

## DELETE /:id

Delete an import and all its associated transactions.
