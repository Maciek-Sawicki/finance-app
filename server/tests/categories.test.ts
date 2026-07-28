import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createCategory, updateCategory } from '../controllers/category.controller.js';
import { errorHandler } from '../middleware/errorHandler.js';
import * as categoryRepository from '../repositories/category.repository.js';

jest.mock('../repositories/category.repository.js');

const mockedCategoryRepository = jest.mocked(categoryRepository);
type CreatedCategory = Awaited<ReturnType<typeof categoryRepository.create>>;
type UpdatedCategory = Awaited<ReturnType<typeof categoryRepository.updateById>>;

const app = express();
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  req.user = { _id: '695aecd813b64c1039159fa1' } as unknown as Request['user'];
  next();
});

app.post('/api/categories', createCategory);
app.put('/api/categories/:id', updateCategory);
app.use(errorHandler);

// The controller now only talks to categoryRepository, so the test mocks that
// repository directly instead of the Mongoose model it used to call.
describe('POST /api/categories', () => {
  afterEach(() => jest.clearAllMocks());
  it('creates a category successfully', async () => {
    mockedCategoryRepository.findByNameAndType.mockResolvedValue(null);
    mockedCategoryRepository.create.mockResolvedValue(
      { name: 'Food', type: 'expense', icon: 'f' } as unknown as CreatedCategory
    );

    const res = await request(app)
      .post('/api/categories')
      .send({ name: 'Food', type: 'expense', icon: 'f' });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Category created successfully');
    expect(res.body.category).toMatchObject({ name: 'Food', type: 'expense' });
  });

  it('returns 400 if name or type is missing', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ icon: 'f' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'Name and type are required.' });
  });

  it('returns 409 if a category with the same name/type already exists', async () => {
    mockedCategoryRepository.findByNameAndType.mockResolvedValue({ _id: 'existing' } as unknown as Awaited<ReturnType<typeof categoryRepository.findByNameAndType>>);

    const res = await request(app)
      .post('/api/categories')
      .send({ name: 'Food', type: 'expense' });

    expect(res.statusCode).toBe(409);
    expect(mockedCategoryRepository.create).not.toHaveBeenCalled();
  });
});

describe('PUT /api/categories/:id', () => {
  afterEach(() => jest.clearAllMocks());

  it('only forwards whitelisted fields to the update, dropping anything else in the body', async () => {
    mockedCategoryRepository.updateById.mockResolvedValue({ _id: 'cat1', name: 'Groceries' } as unknown as UpdatedCategory);

    await request(app)
      .put('/api/categories/cat1')
      .send({
        name: 'Groceries',
        userId: 'attacker-controlled-user-id',
        _id: 'forged-id',
        createdAt: '2000-01-01',
      });

    expect(mockedCategoryRepository.updateById).toHaveBeenCalledWith(
      '695aecd813b64c1039159fa1',
      'cat1',
      { name: 'Groceries' }
    );
  });

  it('returns 404 when the category does not belong to the user', async () => {
    mockedCategoryRepository.updateById.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/categories/cat1')
      .send({ name: 'Groceries' });

    expect(res.statusCode).toBe(404);
  });
});
