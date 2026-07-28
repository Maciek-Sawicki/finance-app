import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { getMonthlySummary } from '../controllers/summary.controller.js';
import { errorHandler } from '../middleware/errorHandler.js';

import * as summaryService from '../services/summary.service.js';

jest.mock('../services/summary.service.js');

const mockedSummaryService = jest.mocked(summaryService);

const app = express();
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  req.user = { _id: 'user123' } as unknown as Request['user'];
  next();
});

app.get('/api/summary/dashboard-summary', getMonthlySummary);
app.use(errorHandler);

describe('GET /api/summary/dashboard-summary', () => {
  afterEach(() => jest.clearAllMocks());

  it('rejects a missing targetCurrency without calling the service', async () => {
    const res = await request(app).get('/api/summary/dashboard-summary');

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'targetCurrency is required.' });
    expect(mockedSummaryService.getMonthlySummary).not.toHaveBeenCalled();
  });

  it('forwards targetCurrency and wraps the result', async () => {
    mockedSummaryService.getMonthlySummary.mockResolvedValue({
      '2026-01': { totalIncome: 100, totalExpense: 40, profit: 60, e_i_ratio: 0.4 },
    });

    const res = await request(app).get('/api/summary/dashboard-summary').query({ targetCurrency: 'USD' });

    expect(res.statusCode).toBe(200);
    expect(mockedSummaryService.getMonthlySummary).toHaveBeenCalledWith('user123', 'USD');
    expect(res.body).toEqual({
      targetCurrency: 'USD',
      monthlySummary: { '2026-01': { totalIncome: 100, totalExpense: 40, profit: 60, e_i_ratio: 0.4 } },
    });
  });

  it('returns 500 when the service throws unexpectedly', async () => {
    mockedSummaryService.getMonthlySummary.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/summary/dashboard-summary').query({ targetCurrency: 'USD' });

    expect(res.statusCode).toBe(500);
  });
});
