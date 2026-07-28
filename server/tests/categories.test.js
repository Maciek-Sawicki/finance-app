import request from 'supertest';
import express from 'express';
import { createCategory } from '../controllers/category.controller.js';
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


// import request from 'supertest';
// import express from 'express';
// import { getCategories, createCategory } from '../controllers/category.controller.js';
// import Category from '../models/category.model.js';

// jest.mock('../models/category.model.js');

// const app = express();
// app.use(express.json());

// app.use((req, res, next) => {
//   req.user = { _id: '695aecd813b64c1039159fa1' };
//   next();
// });

// app.get('/api/categories', getCategories);
// app.post('/api/categories', createCategory);

// describe('GET /api/categories', () => {
//   afterEach(() => jest.clearAllMocks());

//   it('return 200 and categories', async () => {
//     const mockCategories = [
//       { _id: '1', name: 'Food', type: 'expense', icon: '🍔', favorite: true },
//       { _id: '2', name: 'Salary', type: 'income', icon: '💰', favorite: false },
//     ];

//     Category.find.mockReturnValue({
//       sort: jest.fn().mockResolvedValue(mockCategories),
//     });

//     const res = await request(app).get('/api/categories');

//     expect(res.statusCode).toBe(200);
//     expect(res.body).toHaveLength(mockCategories.length);
//     expect(res.body[0]).toMatchObject({ name: 'Food', type: 'expense' });
//   });

//   it('return 500 if error occured', async () => {
//     Category.find.mockReturnValue({
//       sort: jest.fn().mockRejectedValue(new Error('DB error')),
//     });

//     const res = await request(app).get('/api/categories');
//     expect(res.statusCode).toBe(500);
//     expect(res.body).toEqual({ message: 'Internal server error.' });
//   });
// });

// describe('POST /api/categories', () => {
//   afterEach(() => jest.clearAllMocks());

//   it('creates a category successfully', async () => {
//     Category.findOne.mockResolvedValue(null);
  
//     const newCategory = {
//       name: 'Food',
//       type: 'expense',
//       icon: '🍔',
//       save: jest.fn().mockResolvedValue(true)
//     };
  
//     Category.mockImplementation(() => newCategory);
  
//     const res = await request(app)
//       .post('/api/categories')
//       .send({ name: 'Food', type: 'expense', icon: '🍔' });
  
//     expect(res.statusCode).toBe(201);
//     expect(res.body.message).toBe('Category created successfully');
//     expect(newCategory.save).toHaveBeenCalled();
//     expect(res.body.category).toMatchObject({ name: 'Food', type: 'expense' });
//   });
  

//   it('returns 400 if name or type is missing', async () => {
//     const res = await request(app)
//       .post('/api/categories')
//       .send({ icon: '🍔' });

//     expect(res.statusCode).toBe(400);
//     expect(res.body).toEqual({ message: 'Name and type are required.' });
//   });

//   it('returns 409 if category already exists', async () => {
//     Category.findOne.mockResolvedValue({ name: 'Food', type: 'expense' });

//     const res = await request(app)
//       .post('/api/categories')
//       .send({ name: 'Food', type: 'expense' });

//     expect(res.statusCode).toBe(409);
//     expect(res.body).toEqual({ message: 'Category already exists.' });
//   });

//   it('returns 500 if database error occurs', async () => {
//     Category.findOne.mockRejectedValue(new Error('DB error'));

//     // Wyłącz logowanie błędów w teście
//     const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

//     const res = await request(app)
//       .post('/api/categories')
//       .send({ name: 'Food', type: 'expense' });

//     expect(res.statusCode).toBe(500);
//     expect(res.body).toEqual({ message: 'Internal server error.' });

//     spy.mockRestore();
//   });
// });
