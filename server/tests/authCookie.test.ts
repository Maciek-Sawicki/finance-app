// Self-contained so this doesn't depend on another test file having
// already triggered dotenv.config() (e.g. by importing app.js) first.
process.env.JWT_SECRET ??= 'test-secret-for-authCookie-test';

import request from 'supertest';
import express from 'express';
import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import { signIn } from '../controllers/auth.controller.js';
import { errorHandler } from '../middleware/errorHandler.js';

jest.mock('../models/user.model.js');
jest.mock('bcrypt');

const MockedUser = jest.mocked(User);
const mockedCompare = jest.mocked(bcrypt.compare);

const app = express();
app.use(express.json());
app.post('/api/auth/signin', signIn);
app.use(errorHandler);

// Regression test for a real gap flagged in the architecture review: signIn
// used to set the httpOnly cookie *and* return the same JWT as a plain
// string in the response body, which the client stored in localStorage and
// read back on every request - meaning an XSS bug could steal a
// fully-valid 30-day credential from a place httpOnly cookies are
// specifically designed to be unreadable from.
describe('POST /api/auth/signin', () => {
  afterEach(() => jest.clearAllMocks());

  it('sets the session cookie and does not also leak the token in the response body', async () => {
    const fakeUser = {
      _id: 'user1',
      username: 'alice',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Doe',
      password: 'hashed-password',
    };
    MockedUser.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(fakeUser),
    } as unknown as ReturnType<typeof User.findOne>);
    mockedCompare.mockResolvedValue(true as never);

    const res = await request(app)
      .post('/api/auth/signin')
      .send({ username: 'alice', password: 'password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).not.toHaveProperty('token');
    expect(res.body.user).toMatchObject({ username: 'alice', email: 'alice@example.com' });

    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect((setCookie as unknown as string[]).some((c) => c.startsWith('token='))).toBe(true);
  });

  // Regression test for a user-enumeration gap: an unknown username/email
  // used to get 404 "User not found" while a wrong password got 401
  // "Invalid password" - the different status/message let an attacker
  // discover which usernames/emails have accounts. Both cases must now be
  // indistinguishable from the response alone.
  it('responds identically (401, same message) for an unknown user and a wrong password', async () => {
    MockedUser.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof User.findOne>);

    const unknownUserRes = await request(app)
      .post('/api/auth/signin')
      .send({ username: 'nobody', password: 'password123' });

    MockedUser.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'user1', username: 'alice', password: 'hashed-password' }),
    } as unknown as ReturnType<typeof User.findOne>);
    mockedCompare.mockResolvedValue(false as never);

    const wrongPasswordRes = await request(app)
      .post('/api/auth/signin')
      .send({ username: 'alice', password: 'wrong' });

    expect(unknownUserRes.statusCode).toBe(401);
    expect(wrongPasswordRes.statusCode).toBe(401);
    expect(unknownUserRes.body).toEqual(wrongPasswordRes.body);
  });
});
