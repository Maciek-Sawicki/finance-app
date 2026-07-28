import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  getRecurringTransactions, getRecurringTransaction, createRecurringTransaction,
  updateRecurringTransaction, deleteRecurringTransaction, toggleRecurringTransaction,
} from '../controllers/recurringTransaction.controller.js';
import { errorHandler } from '../middleware/errorHandler.js';

import * as recurringTransactionService from '../services/recurringTransaction.service.js';

jest.mock('../services/recurringTransaction.service.js');

const mockedService = jest.mocked(recurringTransactionService);
type RecurringDoc = Awaited<ReturnType<typeof recurringTransactionService.getById>>;

const app = express();
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  req.user = { _id: 'user123' } as unknown as Request['user'];
  next();
});

app.get('/api/recurring-transactions', getRecurringTransactions);
app.get('/api/recurring-transactions/:id', getRecurringTransaction);
app.post('/api/recurring-transactions', createRecurringTransaction);
app.put('/api/recurring-transactions/:id', updateRecurringTransaction);
app.delete('/api/recurring-transactions/:id', deleteRecurringTransaction);
app.patch('/api/recurring-transactions/:id/toggle', toggleRecurringTransaction);
app.use(errorHandler);

describe('GET /api/recurring-transactions', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns the list scoped to the authenticated user', async () => {
    mockedService.list.mockResolvedValue([{ _id: 'rec1' }] as unknown as Awaited<ReturnType<typeof recurringTransactionService.list>>);

    const res = await request(app).get('/api/recurring-transactions');

    expect(res.statusCode).toBe(200);
    expect(mockedService.list).toHaveBeenCalledWith('user123');
    expect(res.body).toEqual([{ _id: 'rec1' }]);
  });
});

describe('GET /api/recurring-transactions/:id', () => {
  afterEach(() => jest.clearAllMocks());

  it('maps a 404 domain error from the service', async () => {
    mockedService.getById.mockRejectedValue(Object.assign(new Error('Recurring transaction not found'), { status: 404 }));

    const res = await request(app).get('/api/recurring-transactions/missing');

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: 'Recurring transaction not found' });
  });
});

describe('POST /api/recurring-transactions', () => {
  afterEach(() => jest.clearAllMocks());

  it('forwards the body and returns 201 with a confirmation message', async () => {
    mockedService.create.mockResolvedValue({ _id: 'rec1', name: 'Rent' } as unknown as RecurringDoc);

    const res = await request(app).post('/api/recurring-transactions').send({ name: 'Rent', amount: 1000 });

    expect(res.statusCode).toBe(201);
    expect(mockedService.create).toHaveBeenCalledWith('user123', { name: 'Rent', amount: 1000 });
    expect(res.body).toMatchObject({ message: 'Recurring transaction created successfully', transaction: { _id: 'rec1', name: 'Rent' } });
  });
});

describe('PUT /api/recurring-transactions/:id', () => {
  afterEach(() => jest.clearAllMocks());

  it('forwards the body to the service', async () => {
    mockedService.update.mockResolvedValue({ _id: 'rec1', amount: 1200 } as unknown as RecurringDoc);

    const res = await request(app).put('/api/recurring-transactions/rec1').send({ amount: 1200 });

    expect(res.statusCode).toBe(200);
    expect(mockedService.update).toHaveBeenCalledWith('user123', 'rec1', { amount: 1200 });
  });
});

describe('DELETE /api/recurring-transactions/:id', () => {
  afterEach(() => jest.clearAllMocks());

  it('deletes and returns a confirmation message', async () => {
    mockedService.remove.mockResolvedValue({ _id: 'rec1' } as unknown as RecurringDoc);

    const res = await request(app).delete('/api/recurring-transactions/rec1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'Recurring transaction deleted successfully' });
    expect(mockedService.remove).toHaveBeenCalledWith('user123', 'rec1');
  });
});

describe('PATCH /api/recurring-transactions/:id/toggle', () => {
  afterEach(() => jest.clearAllMocks());

  it('reports "activated" when the toggle turns isActive on', async () => {
    mockedService.toggleActive.mockResolvedValue({ _id: 'rec1', isActive: true } as unknown as RecurringDoc);

    const res = await request(app).patch('/api/recurring-transactions/rec1/toggle');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Recurring transaction activated');
  });

  it('reports "deactivated" when the toggle turns isActive off', async () => {
    mockedService.toggleActive.mockResolvedValue({ _id: 'rec1', isActive: false } as unknown as RecurringDoc);

    const res = await request(app).patch('/api/recurring-transactions/rec1/toggle');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Recurring transaction deactivated');
  });
});
