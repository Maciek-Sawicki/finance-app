# Cashora

A personal finance management app for tracking accounts, transactions, budgets, and spending across multiple currencies.

## Tech Stack

**Frontend** — React 19 + TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router v7, Recharts, Axios

**Backend** — Node.js, Express 5, MongoDB + Mongoose, JWT auth, node-cron

## Features

- Multi-account management with live balance calculation
- Income / expense / transfer transactions
- Custom categories with favorites
- Budgets with real-time progress tracking
- Recurring transactions (daily, weekly, monthly, custom)
- CSV import with category mapping
- Exchange rate updates via cron job
- Multi-currency support with automatic conversion
- Dashboard summaries: cash flow, trends, savings rate, category breakdown

## Getting Started

### Local development

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Run both (from root)
npm run dev
```

Requires a `.env` file in `server/`:

```env
MONGO_URI=your_mongodb_uri
PORT=3000
JWT_SECRET=your_secret
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Docker

```bash
docker compose up --build
```

App available at `http://localhost`. Uses your Atlas URI from `server/.env`.

## Project Structure

```
finance-app/
├── client/          # React frontend
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── pages/
│       └── services/
├── server/          # Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── cron/
└── docs/            # API documentation
```

## API Docs

See [`docs/`](./docs) for full endpoint reference:

- [Authentication](./docs/auth.md)
- [Accounts](./docs/accounts.md)
- [Transactions](./docs/transactions.md)
- [Categories](./docs/categories.md)
- [Budgets](./docs/budgets.md)
- [Recurring Transactions](./docs/recurring-transactions.md)
- [Imports](./docs/imports.md)
- [Summary & Analytics](./docs/summary.md)
- [Exchange Rates](./docs/exchange-rates.md)
- [Settings](./docs/settings.md)
