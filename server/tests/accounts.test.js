import request from 'supertest';
import express from 'express';
import { getAccounts } from '../controllers/account.controller.js';
import { errorHandler } from '../middleware/errorHandler.js';

import * as accountService from '../services/account.service.js';
import { convertCurrency } from '../services/exchangeRate.service.js';

jest.mock('../services/account.service.js');
jest.mock('../services/exchangeRate.service.js');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  req.user = { _id: 'user123' };
  next();
});

app.get('/api/accounts', getAccounts);
app.use(errorHandler);

// The controller now only talks to accountService, so the test mocks that
// service directly instead of the Mongoose models it used to call - no more
// chaining .find().sort() mocks to match the query shape.
describe('GET /api/accounts', () => {
  afterEach(() => jest.clearAllMocks());

  it('zwraca 404 if accounts not found', async () => {
    accountService.list.mockResolvedValue([]);

    const res = await request(app).get('/api/accounts?currency=USD');

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: 'No accounts found.' });
  });

  it('should return accounts with converted balance', async () => {
    accountService.list.mockResolvedValue([
      { _id: 'acc1', startingBalance: 100, currency: 'USD', balance: 130, balanceAfterRP: 130 },
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

  it('return 500 if the service throws', async () => {
    accountService.list.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/accounts');
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Internal server error.' });
  });
});
