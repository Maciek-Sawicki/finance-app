import request from 'supertest';
import express from 'express';
import { getAccounts } from '../controllers/account.controller.js';

import Account from '../models/account.model.js';
import Transaction from '../models/transaction.model.js';
import { convertCurrency } from '../services/exchangeRate.service.js';

jest.mock('../models/account.model.js');
jest.mock('../models/transaction.model.js');
jest.mock('../services/exchangeRate.service.js');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  req.user = { _id: 'user123' };
  next();
});

app.get('/api/accounts', getAccounts);

describe('GET /api/accounts', () => {
  afterEach(() => jest.clearAllMocks());

  it('zwraca 404 if accounts not found', async () => {
    Account.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

    const res = await request(app).get('/api/accounts?currency=USD');

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: 'No accounts found.' });
  });

  it('should return accounts', async () => {
    Account.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        {
          _id: 'acc1',
          startingBalance: 100,
          currency: 'USD',
          toObject: function () {
            return {
              _id: this._id,
              startingBalance: this.startingBalance,
              currency: this.currency,
            };
          },
        },
      ]),
    });

    Transaction.aggregate.mockResolvedValue([
      { income: 50, expense: 20 },
    ]);

    convertCurrency.mockImplementation((amount) => Promise.resolve(amount * 2));

    const res = await request(app).get('/api/accounts?currency=EUR');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toMatchObject({
      _id: 'acc1',
      balance: 130,
      convertedBalance: 260,
      convertedCurrency: 'EUR',
    });
  });

  it('return 500 if database error', async () => {
    Account.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB error')) });

    const res = await request(app).get('/api/accounts');
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Internal server error.' });
  });
});
