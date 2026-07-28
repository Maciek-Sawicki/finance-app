import request from 'supertest';
import app from '../app.js';

// Regression test for a real gap flagged in the architecture review: POST
// /api/rates/update had no authenticate middleware, so anyone could trigger
// the external exchange-rate fetch and write to the ExchangeRate collection.
describe('POST /api/rates/update', () => {
  it('rejects an unauthenticated request instead of hitting the external API', async () => {
    const res = await request(app).post('/api/rates/update');

    expect(res.statusCode).toBe(401);
  });
});
