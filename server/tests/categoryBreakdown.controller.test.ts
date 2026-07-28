import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { getMonthlyTopCategories, getYearlyTopCategories } from '../controllers/categoryBreakdown.controller.js';
import { errorHandler } from '../middleware/errorHandler.js';

import * as categoryBreakdownService from '../services/categoryBreakdown.service.js';

jest.mock('../services/categoryBreakdown.service.js');

const mockedService = jest.mocked(categoryBreakdownService);

const app = express();
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  req.user = { _id: 'user123' } as unknown as Request['user'];
  next();
});

app.get('/api/category-breakdown/top-monthly-categories', getMonthlyTopCategories);
app.get('/api/category-breakdown/top-yearly-categories', getYearlyTopCategories);
app.use(errorHandler);

describe('GET /api/category-breakdown/top-monthly-categories', () => {
  afterEach(() => jest.clearAllMocks());

  it('rejects a missing targetCurrency', async () => {
    const res = await request(app).get('/api/category-breakdown/top-monthly-categories').query({ type: 'expense' });

    expect(res.statusCode).toBe(400);
    expect(mockedService.getTopCategoriesByPeriod).not.toHaveBeenCalled();
  });

  it('rejects an invalid type', async () => {
    const res = await request(app)
      .get('/api/category-breakdown/top-monthly-categories')
      .query({ type: 'sabotage', targetCurrency: 'USD' });

    expect(res.statusCode).toBe(400);
    expect(mockedService.getTopCategoriesByPeriod).not.toHaveBeenCalled();
  });

  it('delegates to the service with a "%Y-%m" dateFormat and returns monthlyCategories', async () => {
    mockedService.getTopCategoriesByPeriod.mockResolvedValue({ '2026-01': [] });

    const res = await request(app)
      .get('/api/category-breakdown/top-monthly-categories')
      .query({ type: 'expense', targetCurrency: 'USD', limit: '5' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ targetCurrency: 'USD', type: 'expense', monthlyCategories: { '2026-01': [] } });
    expect(mockedService.getTopCategoriesByPeriod).toHaveBeenCalledWith('user123', {
      type: 'expense', targetCurrency: 'USD', limit: 5, dateFormat: '%Y-%m',
    });
  });
});

describe('GET /api/category-breakdown/top-yearly-categories', () => {
  afterEach(() => jest.clearAllMocks());

  it('delegates to the service with a "%Y" dateFormat and returns yearlyCategories', async () => {
    mockedService.getTopCategoriesByPeriod.mockResolvedValue({ '2026': [] });

    const res = await request(app)
      .get('/api/category-breakdown/top-yearly-categories')
      .query({ type: 'income', targetCurrency: 'PLN' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ targetCurrency: 'PLN', type: 'income', yearlyCategories: { '2026': [] } });
    expect(mockedService.getTopCategoriesByPeriod).toHaveBeenCalledWith('user123', {
      type: 'income', targetCurrency: 'PLN', limit: undefined, dateFormat: '%Y',
    });
  });
});
