import request from 'supertest';
import express from 'express';
import { createCategory, updateCategory } from '../controllers/category.controller.js';
import { errorHandler } from '../middleware/errorHandler.js';
import Category from '../models/category.model.js';

jest.mock('../models/category.model.js');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  req.user = { _id: '695aecd813b64c1039159fa1' };
  next();
});

app.post('/api/categories', createCategory);
app.put('/api/categories/:id', updateCategory);
app.use(errorHandler);

describe('POST /api/categories', () => {
  afterEach(() => jest.clearAllMocks());
  it('creates a category successfully', async () => {
    Category.findOne.mockResolvedValue(null);
    const newCategory = {
      name: 'Food',
      type: 'expense',
      icon: 'f',
      save: jest.fn().mockResolvedValue(true)
    };
    Category.mockImplementation(() => newCategory);
    const res = await request(app)
      .post('/api/categories')
      .send({ name: 'Food', type: 'expense', icon: 'f' });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Category created successfully');
    expect(newCategory.save).toHaveBeenCalled();
    expect(res.body.category).toMatchObject({ name: 'Food', type: 'expense' });
  });

  it('returns 400 if name or type is missing', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ icon: 'f' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'Name and type are required.' });
  });
});

describe('PUT /api/categories/:id', () => {
  afterEach(() => jest.clearAllMocks());

  it('only forwards whitelisted fields to the update, dropping anything else in the body', async () => {
    Category.findOneAndUpdate.mockResolvedValue({ _id: 'cat1', name: 'Groceries' });

    await request(app)
      .put('/api/categories/cat1')
      .send({
        name: 'Groceries',
        userId: 'attacker-controlled-user-id',
        _id: 'forged-id',
        createdAt: '2000-01-01',
      });

    expect(Category.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'cat1', userId: '695aecd813b64c1039159fa1' },
      { name: 'Groceries' },
      { new: true }
    );
  });

  it('returns 404 when the category does not belong to the user', async () => {
    Category.findOneAndUpdate.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/categories/cat1')
      .send({ name: 'Groceries' });

    expect(res.statusCode).toBe(404);
  });
});
