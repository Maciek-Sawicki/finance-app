# Summary & Analytics 🔒

Base path: `/api/summary`

All endpoints require `Authorization: Bearer <token>`.

---

## GET /dashboard-summary

Main dashboard summary — income, expenses, and balance for the current month.

**Query params**
| Param | Description |
|-------|-------------|
| `accountId` | Limit to one account |
| `currency` | Target currency |

---

## GET /account-summary

Transaction summary (income/expense totals) for a specific account and period.

**Query params** — `accountId`, `startDate`, `endDate`, `currency`

---

## GET /summary

Transaction summary across all accounts.

**Query params** — `startDate`, `endDate`, `currency`

---

## GET /category-summary

Spending breakdown by category for a given period.

**Query params** — `accountId`, `startDate`, `endDate`, `currency`

---

## GET /balance-summary

Historical balance over time.

**Query params** — `accountId`, `period` (`monthly` / `yearly`), `currency`

---

## GET /cashflow-summary

Monthly cash flow — income vs expenses per month.

**Query params** — `accountId`, `year`, `currency`

---

## GET /trends-summary

Spending trends over time.

**Query params** — `accountId`, `currency`

---

## GET /monthly-trends

Month-over-month income and expense trends.

**Query params** — `accountId`, `currency`, `months` (default: 6)

---

## GET /savings-rate

Savings rate as a percentage — `(income - expenses) / income * 100`.

**Query params** — `accountId`, `startDate`, `endDate`, `currency`

---

## Category Breakdown

Base path: `/api/category-breakdown`

### GET /top-categories

Top spending categories overall.

**Query params** — `accountId`, `startDate`, `endDate`, `currency`, `limit`

### GET /top-monthly-categories

Top categories for the current month.

### GET /top-yearly-categories

Top categories for the current year.
