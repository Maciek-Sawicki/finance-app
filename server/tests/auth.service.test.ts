import { createAuthService } from '../services/auth.service.js';
import User from '../models/user.model.js';
import Settings from '../models/settings.model.js';
import { initDefaultCategoriesForUser } from '../libs/utils/createCategories.js';
import bcrypt from 'bcrypt';
import type { MongooseSessionFactory } from '../types/common.js';

jest.mock('../models/user.model.js');
jest.mock('../models/settings.model.js');
jest.mock('../libs/utils/createCategories.js');
jest.mock('bcrypt');

const MockedUser = jest.mocked(User);
const MockedSettings = jest.mocked(Settings);
const mockedInitDefaultCategories = jest.mocked(initDefaultCategoriesForUser);
const mockedGenSalt = jest.mocked(bcrypt.genSalt);
const mockedHash = jest.mocked(bcrypt.hash);

type CreatedUser = { _id: string; username: string; email: string; firstName: string; lastName: string };

// A fake session whose withTransaction just invokes the callback directly -
// enough to unit-test that the writes happen in the right order and share
// a session, and that a failure partway through propagates and still ends
// the session, without needing a real MongoDB replica set.
const createFakeMongoose = () => {
  const session = { withTransaction: jest.fn((fn: () => unknown) => fn()), endSession: jest.fn() };
  const mongooseInstance = { startSession: jest.fn().mockResolvedValue(session) } as unknown as MongooseSessionFactory;
  return { mongooseInstance, session };
};

const signUpInput = {
  username: 'alice', email: 'alice@example.com', firstName: 'Alice', lastName: 'Doe', password: 'password123',
};

describe('auth.service.signUp', () => {
  afterEach(() => jest.clearAllMocks());

  it('creates the user, default categories and settings inside the same session', async () => {
    mockedGenSalt.mockResolvedValue('salt' as never);
    mockedHash.mockResolvedValue('hashed-password' as never);
    const createdUser = { _id: 'user1', ...signUpInput } as unknown as CreatedUser;
    MockedUser.create.mockResolvedValue([createdUser] as never);
    MockedSettings.create.mockResolvedValue([] as never);
    const { mongooseInstance, session } = createFakeMongoose();
    const service = createAuthService(mongooseInstance);

    const result = await service.signUp(signUpInput);

    expect(result).toEqual(createdUser);
    const [[userDocs, userOpts]] = MockedUser.create.mock.calls;
    expect(userDocs).toEqual([expect.objectContaining({ username: 'alice', password: 'hashed-password' })]);
    expect(userOpts).toEqual({ session });

    expect(mockedInitDefaultCategories).toHaveBeenCalledWith('user1', { session });

    const [[settingsDocs, settingsOpts]] = MockedSettings.create.mock.calls;
    expect(settingsDocs).toEqual([expect.objectContaining({ userId: 'user1', country: 'US', defaultCurrency: 'USD' })]);
    expect(settingsOpts).toEqual({ session });

    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  it('uses the given country instead of the default', async () => {
    mockedGenSalt.mockResolvedValue('salt' as never);
    mockedHash.mockResolvedValue('hashed-password' as never);
    MockedUser.create.mockResolvedValue([{ _id: 'user1' }] as never);
    MockedSettings.create.mockResolvedValue([] as never);
    const { mongooseInstance } = createFakeMongoose();
    const service = createAuthService(mongooseInstance);

    await service.signUp({ ...signUpInput, country: 'PL' });

    const [[settingsDocs]] = MockedSettings.create.mock.calls;
    expect(settingsDocs).toEqual([expect.objectContaining({ country: 'PL' })]);
  });

  // Regression test for a real gap: category seeding used to swallow its own
  // errors (caught, console.error'd, and otherwise ignored), so a failure
  // there left a real, working user account with zero categories and no
  // Settings doc, and nothing told the caller anything had gone wrong.
  it('propagates an error from category seeding instead of leaving a partial account', async () => {
    mockedGenSalt.mockResolvedValue('salt' as never);
    mockedHash.mockResolvedValue('hashed-password' as never);
    MockedUser.create.mockResolvedValue([{ _id: 'user1' }] as never);
    mockedInitDefaultCategories.mockRejectedValue(new Error('category insert failed'));
    const { mongooseInstance, session } = createFakeMongoose();
    const service = createAuthService(mongooseInstance);

    await expect(service.signUp(signUpInput)).rejects.toThrow('category insert failed');

    expect(MockedSettings.create).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });
});
