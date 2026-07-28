import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  createBudget, getBudgets, getBudgetById, updateBudget, deleteBudget, getBudgetsByType, getBudgetHistory,
} from '../controllers/budget.controller.js';
import { errorHandler } from '../middleware/errorHandler.js';

import * as budgetService from '../services/budget.service.js';

jest.mock('../services/budget.service.js');

const mockedBudgetService = jest.mocked(budgetService);
type Budget = Awaited<ReturnType<typeof budgetService.create>>;

const app = express();
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  req.user = { _id: 'user123' } as unknown as Request['user'];
  next();
});

app.post('/api/budgets', createBudget);
app.get('/api/budgets', getBudgets);
app.get('/api/budgets/by-status/:status', getBudgetsByType);
app.get('/api/budgets/history/:id', getBudgetHistory);
app.get('/api/budgets/:id', getBudgetById);
app.put('/api/budgets/:id', updateBudget);
app.delete('/api/budgets/:id', deleteBudget);
app.use(errorHandler);

describe('POST /api/budgets', () => {
  afterEach(() => jest.clearAllMocks());

  it('forwards the body to the service and returns 201', async () => {
    mockedBudgetService.create.mockResolvedValue({ _id: 'budget1', amount: 500 } as unknown as Budget);

    const res = await request(app).post('/api/budgets').send({ categoryId: 'cat1', amount: 500 });

    expect(res.statusCode).toBe(201);
    expect(mockedBudgetService.create).toHaveBeenCalledWith('user123', { categoryId: 'cat1', amount: 500 });
    expect(res.body).toMatchObject({ _id: 'budget1', amount: 500 });
  });

  it('maps a domain error from the service to its HTTP status', async () => {
    mockedBudgetService.create.mockRejectedValue(Object.assign(new Error('Category not found.'), { status: 404 }));

    const res = await request(app).post('/api/budgets').send({ categoryId: 'missing', amount: 500 });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: 'Category not found.' });
  });
});

describe('GET /api/budgets', () => {
  afterEach(() => jest.clearAllMocks());

  it('builds a filter from status/type query params and forwards targetCurrency', async () => {
    mockedBudgetService.list.mockResolvedValue([]);

    await request(app).get('/api/budgets').query({ status: 'active', type: 'recurring', targetCurrency: 'USD' });

    expect(mockedBudgetService.list).toHaveBeenCalledWith('user123', { status: 'active', type: 'recurring' }, 'USD');
  });

  it('omits filter keys that were not sent', async () => {
    mockedBudgetService.list.mockResolvedValue([]);

    await request(app).get('/api/budgets').query({ targetCurrency: 'USD' });

    expect(mockedBudgetService.list).toHaveBeenCalledWith('user123', {}, 'USD');
  });
});

describe('GET /api/budgets/:id', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns the budget from the service', async () => {
    mockedBudgetService.getById.mockResolvedValue({ _id: 'budget1' } as unknown as Awaited<ReturnType<typeof budgetService.getById>>);

    const res = await request(app).get('/api/budgets/budget1').query({ targetCurrency: 'USD' });

    expect(res.statusCode).toBe(200);
    expect(mockedBudgetService.getById).toHaveBeenCalledWith('user123', 'budget1', 'USD');
  });

  it('maps a 404 domain error from the service', async () => {
    mockedBudgetService.getById.mockRejectedValue(Object.assign(new Error('Budget not found.'), { status: 404 }));

    const res = await request(app).get('/api/budgets/missing').query({ targetCurrency: 'USD' });

    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /api/budgets/:id', () => {
  afterEach(() => jest.clearAllMocks());

  it('forwards the body to the service', async () => {
    mockedBudgetService.update.mockResolvedValue({ _id: 'budget1', amount: 600 } as unknown as Awaited<ReturnType<typeof budgetService.update>>);

    const res = await request(app).put('/api/budgets/budget1').send({ amount: 600 });

    expect(res.statusCode).toBe(200);
    expect(mockedBudgetService.update).toHaveBeenCalledWith('user123', 'budget1', { amount: 600 });
  });
});

describe('DELETE /api/budgets/:id', () => {
  afterEach(() => jest.clearAllMocks());

  it('deletes and returns a confirmation message', async () => {
    mockedBudgetService.remove.mockResolvedValue(undefined);

    const res = await request(app).delete('/api/budgets/budget1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'Budget deleted successfully.' });
    expect(mockedBudgetService.remove).toHaveBeenCalledWith('user123', 'budget1');
  });
});

describe('GET /api/budgets/by-status/:status', () => {
  afterEach(() => jest.clearAllMocks());

  it('forwards the status param and targetCurrency to the service', async () => {
    mockedBudgetService.getByType.mockResolvedValue([]);

    await request(app).get('/api/budgets/by-status/active').query({ targetCurrency: 'USD' });

    expect(mockedBudgetService.getByType).toHaveBeenCalledWith('user123', 'active', 'USD');
  });
});

describe('GET /api/budgets/history/:id', () => {
  afterEach(() => jest.clearAllMocks());

  it('forwards the category id and targetCurrency to the service', async () => {
    mockedBudgetService.getHistory.mockResolvedValue([]);

    await request(app).get('/api/budgets/history/cat1').query({ targetCurrency: 'USD' });

    expect(mockedBudgetService.getHistory).toHaveBeenCalledWith('user123', 'cat1', 'USD');
  });
});
