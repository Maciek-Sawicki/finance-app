import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';


import authRoutes from './routes/auth.routes.js';
import accountRoutes from './routes/account.routes.js';
import categoryRoutes from './routes/category.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import exchangeRateRoutes from './routes/exchangeRates.routes.js';
import summaryRoutes from './routes/summary.routes.js';

import connectMongoDB from './db/connectMongoDB.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => res.send('API works!'));

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/rates', exchangeRateRoutes);
app.use('/api/summary', summaryRoutes);


app.listen(PORT, () => {
  console.log(`Server works on port ${PORT}`);
  connectMongoDB();

  cron.schedule('0 0 * * *', async () => {
    console.log('Cron: updating exchange rates...');
    await fetchAndSaveRates("USD");
  });
}); 
