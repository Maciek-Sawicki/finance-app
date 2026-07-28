import type { Request, Response } from 'express';
import { errorHandler } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const createRes = (): Response => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res) as unknown as Response['status'];
  res.json = jest.fn().mockReturnValue(res) as unknown as Response['json'];
  return res as Response;
};

const req = { method: 'GET', originalUrl: '/api/whatever' } as unknown as Request;

describe('errorHandler', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('maps a domain error (Object.assign(new Error(), { status })) to its own status', () => {
    const res = createRes();
    const err = Object.assign(new Error('Category not found.'), { status: 404 });

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Category not found.' });
  });

  it('maps a Mongoose ValidationError to 400 with joined messages', () => {
    const res = createRes();
    const err = { name: 'ValidationError', errors: { name: { message: 'name is required' }, type: { message: 'type is required' } } };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'name is required, type is required' });
  });

  it('maps a Mongoose CastError (malformed ObjectId) to 400 instead of leaking a 500', () => {
    const res = createRes();
    const err = { name: 'CastError', message: 'Cast to ObjectId failed' };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid identifier.' });
  });

  it('maps a MongoDB duplicate key error (code 11000) to 409', () => {
    const res = createRes();
    const err = { code: 11000, message: 'E11000 duplicate key' };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Duplicate value.' });
  });

  it('falls back to a generic 500 for anything else, without leaking the raw error message', () => {
    const res = createRes();
    const err = new Error('connection refused at mongodb://internal-host:27017');

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error.' });
  });
});

describe('asyncHandler', () => {
  it('does not call next when the wrapped handler resolves', async () => {
    const next = jest.fn();
    const handler = asyncHandler(async (req, res) => res.json({ ok: true }));
    const res = createRes();

    await handler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('forwards a rejection to next instead of crashing the process', async () => {
    const next = jest.fn();
    const boom = new Error('boom');
    const handler = asyncHandler(async () => {
      throw boom;
    });

    await handler(req, createRes(), next);

    expect(next).toHaveBeenCalledWith(boom);
  });
});
