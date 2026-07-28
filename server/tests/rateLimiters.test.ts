import request from 'supertest';
import express from 'express';
import { signInLimiter } from '../middleware/rateLimiters.js';
import { signIn } from '../controllers/auth.controller.js';
import { errorHandler } from '../middleware/errorHandler.js';

// signIn short-circuits with 400 before touching the database when neither
// username nor email is sent, so this exercises the real route (limiter +
// controller) without needing to mock User or connect to MongoDB - only the
// rate-limiting behavior itself is under test here.
const app = express();
app.use(express.json());
app.post('/api/auth/signin', signInLimiter, signIn);
app.use(errorHandler);

describe('signInLimiter', () => {
  it('blocks further sign-in attempts once the configured max is exceeded within the window', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await request(app).post('/api/auth/signin').send({});
      expect(res.statusCode).toBe(400);
    }

    const blocked = await request(app).post('/api/auth/signin').send({});
    expect(blocked.statusCode).toBe(429);
  });
});
