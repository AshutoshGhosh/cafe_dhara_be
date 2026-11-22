import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from './AppError';

describe('AppError', () => {
  it('creates badRequest error with status 400', () => {
    const err = AppError.badRequest('Invalid payload', 'INVALID_BODY');
    assert.equal(err.statusCode, 400);
    assert.equal(err.message, 'Invalid payload');
    assert.equal(err.code, 'INVALID_BODY');
    assert.equal(err.isOperational, true);
  });

  it('creates unauthorized error with status 401', () => {
    const err = AppError.unauthorized('Invalid login token');
    assert.equal(err.statusCode, 401);
    assert.equal(err.code, 'UNAUTHORIZED');
  });

  it('creates forbidden error with status 403', () => {
    const err = AppError.forbidden('Owner role required');
    assert.equal(err.statusCode, 403);
    assert.equal(err.code, 'FORBIDDEN');
  });

  it('creates notFound error with status 404', () => {
    const err = AppError.notFound('Table not found');
    assert.equal(err.statusCode, 404);
    assert.equal(err.code, 'NOT_FOUND');
  });

  it('creates conflict error with status 409', () => {
    const err = AppError.conflict('Table number already exists');
    assert.equal(err.statusCode, 409);
    assert.equal(err.code, 'CONFLICT');
  });

  it('creates internal error with status 500', () => {
    const err = AppError.internal('Database connection lost');
    assert.equal(err.statusCode, 500);
    assert.equal(err.code, 'INTERNAL');
  });
});
