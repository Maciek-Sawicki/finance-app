# Categories 🔒

Base path: `/api/categories`

See [Authentication](./auth.md) for what 🔒 requires.

Eight default categories are created automatically for every new user at sign-up (Food, Transport, Entertainment, Shopping, Health, Salary, Investments, Gift).

---

## POST /

**Body**
```json
{
  "name": "Groceries",
  "type": "expense",
  "icon": "🛒"
}
```

- `name`, `type` are required.
- `type`: `"income"`, `"expense"`, `"transfer"`, or `"exclude"`.
- The `(userId, name, type)` combination must be unique — a duplicate returns `409`.

**Response `201`** — `{ message, category }`
**Response `409`** — `{ "message": "Category already exists." }`

---

## GET /

Get all categories for the authenticated user, newest first.

---

## GET /favorites

Get only categories marked `favorite: true`.

---

## GET /:id

Get a single category. `404` if not found/not owned.

---

## PUT /:id

Update a category. All fields optional.

**Body** — any subset of: `name`, `type`, `icon`, `color`, `favorite`

---

## DELETE /:id

Soft-deletes the category (hidden from every read, not physically removed). Its `(userId, name, type)` slot is freed up immediately — you can create a new category with the same name/type right after deleting the old one.

Note: deleting a category does **not** currently clean up or block on Transactions/Budgets/RecurringTransactions that still reference it — they simply keep the old `categoryId`.
