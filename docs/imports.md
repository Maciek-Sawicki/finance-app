# Imports 🔒

Base path: `/api/imports`

See [Authentication](./auth.md) for what 🔒 requires.

Imports allow uploading a CSV file to bulk-create transactions for an account.

---

## POST /

Rate limited: 5 requests / min. Upload a CSV file to create an import.

**Content-Type:** `multipart/form-data`

**Form fields**
| Field | Required | Description |
|-------|----------|-------------|
| `file` | ✅ | CSV file, max **5 MB** |
| `accountId` | ✅ | Target account ID — must belong to the caller |

**Response `400`** — `{ "message": "File is too large." }` if the file exceeds 5 MB.
**Response `404`** — `{ "message": "Account not found." }` if `accountId` doesn't belong to the caller.

**CSV format** — supports `,` and `;` delimiters (auto-detected from the header row). Required columns:

| Column | Aliases | Description |
|--------|---------|-------------|
| `date` | `data` | Transaction date |
| `amount` | `kwota` | Positive = income, negative = expense (comma decimal separator accepted) |
| `description` | `opis` | Optional description |

Rows with a missing/invalid date or amount are skipped and recorded in `importErrors`, not fatal to the whole import. Imported transactions have `categoryId: null` until categorized.

**Response `201`** — `{ message, import: { _id, fileName, status, rowCount, importedCount, skippedCount, importErrors } }`

---

## GET /

Get all imports for the user, newest first.

---

## GET /:id/transactions

Get all transactions belonging to an import. `404` if the import doesn't belong to the caller.

---

## PATCH /transactions/:transactionId/category

Assign a category to a single imported transaction.

**Body**
```json
{ "categoryId": "<id>" }
```

`categoryId` must belong to the caller (`404` otherwise).

---

## PATCH /:id/categories

Batch-assign categories to multiple transactions in an import.

**Body**
```json
{
  "updates": [
    { "transactionId": "<id>", "categoryId": "<id>" },
    { "transactionId": "<id>", "categoryId": "<id>" }
  ]
}
```

Every distinct `categoryId` in the batch must belong to the caller, or the whole batch is rejected (`404`).

**Response `200`** — `{ message, modifiedCount }`

---

## DELETE /:id

Soft-deletes the import and its associated transactions (hidden from every read, not physically removed).

**Response `200`** — `{ "message": "Import and associated transactions deleted" }`
