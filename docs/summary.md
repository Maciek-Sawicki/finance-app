# Summary & Analytics 🔒

See [Authentication](./auth.md) for what 🔒 requires. Both endpoints below are rate limited: 10 requests / 30s per IP (they each run one or more Mongo aggregation pipelines plus currency conversions).

---

## Dashboard Summary

Base path: `/api/summary`

### GET /dashboard-summary

Per-month income/expense/profit totals across all accounts, for every month that has settled, non-excluded transactions.

**Query params**
| Param | Required | Description |
|-------|----------|-------------|
| `targetCurrency` | ✅ | Currency to convert all totals into |

**Response `200`**
```json
{
  "targetCurrency": "USD",
  "monthlySummary": {
    "2026-01": { "totalIncome": 3200.00, "totalExpense": 1850.50, "profit": 1349.50, "e_i_ratio": 57.83 }
  }
}
```

`e_i_ratio` is `(totalExpense / totalIncome) * 100` — the percentage of income spent that month — or `null` if there was no income that month.

---

## Category Breakdown

Base path: `/api/category-breakdown`

Top-spending (or top-earning) categories per period, converted into a target currency, with an optional "Other" bucket for anything past `limit`.

### GET /top-monthly-categories

**Query params**
| Param | Required | Description |
|-------|----------|-------------|
| `targetCurrency` | ✅ | Currency to convert totals into |
| `type` | ✅ | `income` or `expense` |
| `limit` | | Max categories per month before the rest are folded into an `"Other"` row |

**Response `200`**
```json
{
  "targetCurrency": "USD",
  "type": "expense",
  "monthlyCategories": {
    "2026-01": [
      { "categoryId": "<id>", "name": "Groceries", "icon": "🛒", "color": "#4CAF50", "total": 420.30, "percent": 38.2 },
      { "categoryId": "Uncategorized", "name": "Uncategorized", "icon": null, "color": null, "total": 50.00, "percent": 4.5 }
    ]
  }
}
```

Transactions in a `"transfer"`-type category are excluded (transfers between your own accounts aren't spending). Transactions with no category are grouped under `categoryId: "Uncategorized"`.

### GET /top-yearly-categories

Same shape and params as above, bucketed by year (`"yearlyCategories"`, keys like `"2026"`) instead of by month.
