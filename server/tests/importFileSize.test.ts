import request from 'supertest';
import express from 'express';
import multer from 'multer';
import { errorHandler } from '../middleware/errorHandler.js';
import { MAX_IMPORT_FILE_SIZE_BYTES } from '../routes/import.routes.js';

// Exercises the real multer config (same limit constant the real route
// uses) through the real errorHandler, without needing authenticate or a
// database - only the "does an oversized upload get rejected cleanly"
// behavior is under test here.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMPORT_FILE_SIZE_BYTES } });

const app = express();
app.post('/api/imports', upload.single('file'), (req, res) => {
  res.status(200).json({ received: req.file?.size ?? 0 });
});
app.use(errorHandler);

describe('import file size limit', () => {
  it('rejects a file larger than the configured limit with a 400, not a 500', async () => {
    const oversized = Buffer.alloc(MAX_IMPORT_FILE_SIZE_BYTES + 1, 'a');

    const res = await request(app)
      .post('/api/imports')
      .attach('file', oversized, 'huge.csv');

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'File is too large.' });
  });

  it('accepts a file at or under the limit', async () => {
    const withinLimit = Buffer.from('date,amount\n2026-01-01,100');

    const res = await request(app)
      .post('/api/imports')
      .attach('file', withinLimit, 'statement.csv');

    expect(res.statusCode).toBe(200);
    expect(res.body.received).toBe(withinLimit.length);
  });
});
