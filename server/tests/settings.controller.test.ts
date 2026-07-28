import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { errorHandler } from '../middleware/errorHandler.js';
import * as settingsRepository from '../repositories/settings.repository.js';

jest.mock('../repositories/settings.repository.js');

// jest.mocked() over-narrows these particular functions' inferred return
// type (Mongoose's Query/upsert typings don't round-trip through
// Awaited<ReturnType<...>> the way a plain Promise does), so the mocks are
// typed by hand instead - runtime behavior (jest.mock auto-replacing every
// export with jest.fn()) is unaffected.
const mockedSettingsRepository = settingsRepository as unknown as {
  findByUser: jest.Mock;
  create: jest.Mock;
  updateByUser: jest.Mock;
};
type SettingsDoc = Awaited<ReturnType<typeof settingsRepository.findByUser>>;

const app = express();
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  req.user = { _id: 'user123' } as unknown as Request['user'];
  next();
});

app.get('/api/settings/me', getSettings);
app.patch('/api/settings/me', updateSettings);
app.use(errorHandler);

describe('GET /api/settings/me', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns existing settings without creating new ones', async () => {
    mockedSettingsRepository.findByUser.mockResolvedValue({ userId: 'user123', defaultCurrency: 'PLN' } as unknown as SettingsDoc);

    const res = await request(app).get('/api/settings/me');

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ defaultCurrency: 'PLN' });
    expect(mockedSettingsRepository.create).not.toHaveBeenCalled();
  });

  it('lazily creates default US/USD settings on first access', async () => {
    mockedSettingsRepository.findByUser.mockResolvedValue(null);
    mockedSettingsRepository.create.mockResolvedValue(
      { userId: 'user123', defaultCurrency: 'USD', country: 'US' } as unknown as SettingsDoc
    );

    const res = await request(app).get('/api/settings/me');

    expect(res.statusCode).toBe(200);
    expect(mockedSettingsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user123', defaultCurrency: 'USD', country: 'US' })
    );
  });
});

describe('PATCH /api/settings/me', () => {
  afterEach(() => jest.clearAllMocks());

  it('only forwards whitelisted fields', async () => {
    mockedSettingsRepository.updateByUser.mockResolvedValue({ userId: 'user123', theme: 'dark' } as unknown as SettingsDoc);

    await request(app)
      .patch('/api/settings/me')
      .send({ theme: 'dark', userId: 'attacker-controlled', _id: 'forged' });

    expect(mockedSettingsRepository.updateByUser).toHaveBeenCalledWith('user123', { theme: 'dark' });
  });

  it('derives locale from the country when a known country is sent', async () => {
    mockedSettingsRepository.updateByUser.mockResolvedValue({ userId: 'user123' } as unknown as SettingsDoc);

    await request(app).patch('/api/settings/me').send({ country: 'PL' });

    expect(mockedSettingsRepository.updateByUser).toHaveBeenCalledWith('user123', { country: 'PL', locale: 'pl-PL' });
  });
});
