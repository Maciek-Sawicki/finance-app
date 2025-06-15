import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';


import authRoutes from './routes/auth.routes.js';
import accountRoutes from './routes/account.routes.js';

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

app.listen(PORT, () => {
  console.log(`Server works on port ${PORT}`);
  connectMongoDB();
}); 
