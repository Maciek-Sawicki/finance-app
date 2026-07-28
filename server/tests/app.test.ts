import request from 'supertest';
import express from 'express';
import app from '../app.js';
import importRoutes from '../routes/import.routes.js';

jest.mock('../routes/import.routes.js', () => {
  const express = require('express');
  return express.Router(); 
});

describe('Test', () => {
  it('GET /should retun "API works!"', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('API works!');
  });

  it('sets helmet security headers on every response', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
  });
});
