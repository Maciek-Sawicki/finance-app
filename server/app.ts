import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

dotenv.config();

// Fail loudly and immediately on a misconfigured deploy instead of booting
// "successfully" and only breaking confusingly on the first request that
// needs the missing value (JWT_SECRET) or the first cross-origin request
// silently getting blocked (CLIENT_URL, used below as the CORS origin).
for (const name of ['JWT_SECRET', 'CLIENT_URL'] as const) {
  if (!process.env[name]) {
    console.error(`Missing ${name} environment variable.`);
    process.exit(1);
  }
}

import authRoutes from './routes/auth.routes.js';
import accountRoutes from './routes/account.routes.js';
import categoryRoutes from './routes/category.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import exchangeRateRoutes from './routes/exchangeRates.routes.js';
import summaryRoutes from './routes/summary.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import categoryBreakdownRoutes from './routes/categoryBreakdown.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import RecurringTransactionRoutes from './routes/recurringTransaction.routes.js';
import importRoutes from './routes/import.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// The app is only ever reachable through the nginx container in front of it
// (docker-compose gives the server service no published port) - trusting
// exactly that one hop lets req.ip (and express-rate-limit, which keys off
// it) read the real client IP from X-Forwarded-For instead of nginx's own
// container IP. Without this every rate limiter below throttles all users
// combined, not per client.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => res.send('API works!'));

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/rates', exchangeRateRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/category-breakdown', categoryBreakdownRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/recurring-transactions', RecurringTransactionRoutes);
app.use('/api/imports', importRoutes);

app.use(errorHandler);

export default app;
