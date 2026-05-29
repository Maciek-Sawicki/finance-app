# Categories 🔒

Base path: `/api/categories`

All endpoints require `Authorization: Bearer <token>`.

---

## POST /create

**Body**
```json
{
  "name": "Groceries",
  "type": "expense",
  "icon": "🛒",
  "color": "#4CAF50",
  "favorite": false
}
```

- `type`: `"income"` or `"expense"`

**Response `201`** — `{ message, category }`

---

## GET /

Get all categories for the authenticated user.

---

## GET /favorites

Get only categories marked as favorite.

---

## GET /:id

Get a single category.

---

## PUT /:id

Update a category. All fields optional.

**Body** — any subset of: `name`, `type`, `icon`, `color`, `favorite`

---

## DELETE /:id

Delete a category.
