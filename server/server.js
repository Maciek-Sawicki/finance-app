import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import fs from "fs";
import https from "https";
import http from "http";


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

import { fetchRatesJob } from "./cron/fetchRatesJob.js";
import { startRecurringTransactionJob } from "./cron/recurringTransactionsJob.js";
import { initWebSocket } from "./ws.js";

import connectMongoDB from './db/connectMongoDB.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

const httpsOptions = {
  key: fs.readFileSync("./certs/server.key"),
  cert: fs.readFileSync("./certs/server.cert"),
};

const httpsServer = https.createServer(httpsOptions, app);
initWebSocket(httpsServer);

httpsServer.listen(PORT, () => {
  console.log(`HTTPS server running on port ${PORT}`);
  connectMongoDB();

  fetchRatesJob();
  startRecurringTransactionJob();
});

