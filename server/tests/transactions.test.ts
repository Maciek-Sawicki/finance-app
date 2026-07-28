import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { updateTransaction } from '../controllers/transaction.controller.js';
import { errorHandler } from '../middleware/errorHandler.js';

import * as transactionService from '../services/transaction.service.js';

jest.mock('../services/transaction.service.js');

const mockedTransactionService = jest.mocked(transactionService);

const app = express();
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  req.user = { _id: 'user123' } as unknown as Request['user'];
  next();
});

app.put('/api/transactions/:id', updateTransaction);
app.use(errorHandler);

// Regression test for a gap flagged in the architecture review: createTransaction
// validated type/amount but updateTransaction forwarded req.body straight to the
// service, so a client could PUT a negative amount or a bogus type and silently
// corrupt the live-computed account balance.
describe('PUT /api/transactions/:id', () => {
  afterEach(() => jest.clearAllMocks());

  it('rejects a non-positive amount', async () => {
    const res = await request(app).put('/api/transactions/tx1').send({ amount: -50 });

    expect(res.statusCode).toBe(400);
    expect(mockedTransactionService.update).not.toHaveBeenCalled();
  });

  it('rejects an invalid type', async () => {
    const res = await request(app).put('/api/transactions/tx1').send({ type: 'sabotage' });

    expect(res.statusCode).toBe(400);
    expect(mockedTransactionService.update).not.toHaveBeenCalled();
  });

  it('accepts a valid partial update', async () => {
    mockedTransactionService.update.mockResolvedValue({ _id: 'tx1', amount: 25 } as unknown as Awaited<ReturnType<typeof transactionService.update>>);

    const res = await request(app).put('/api/transactions/tx1').send({ amount: 25 });

    expect(res.statusCode).toBe(200);
    expect(mockedTransactionService.update).toHaveBeenCalledWith('user123', 'tx1', { amount: 25 });
  });

  it('allows an update that omits type/amount entirely', async () => {
    mockedTransactionService.update.mockResolvedValue({ _id: 'tx1', description: 'new' } as unknown as Awaited<ReturnType<typeof transactionService.update>>);

    const res = await request(app).put('/api/transactions/tx1').send({ description: 'new' });

    expect(res.statusCode).toBe(200);
  });
});
