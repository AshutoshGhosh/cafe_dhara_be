import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildToken, verifyTokenSignature } from './qr.token';
import { AppError } from '../../common/AppError';

describe('qr.token', () => {
  it('builds a token and verifies its tableId signature correctly', () => {
    const tableId = '654321654321654321654321';
    const token = buildToken(tableId);

    assert.ok(typeof token === 'string');
    assert.equal(token.split('.').length, 3);

    const verifiedTableId = verifyTokenSignature(token);
    assert.equal(verifiedTableId, tableId);
  });

  it('throws unauthorized error on tampered token payload', () => {
    const tableId = '654321654321654321654321';
    const token = buildToken(tableId);

    const parts = token.split('.');
    const tamperedToken = `tamperedId.${parts[1]}.${parts[2]}`;

    assert.throws(
      () => verifyTokenSignature(tamperedToken),
      (err: any) => err instanceof AppError && err.statusCode === 401,
    );
  });

  it('throws unauthorized on malformed token strings', () => {
    assert.throws(
      () => verifyTokenSignature('malformed-token-without-dots'),
      (err: any) => err instanceof AppError && err.statusCode === 401,
    );
    assert.throws(
      () => verifyTokenSignature(''),
      (err: any) => err instanceof AppError && err.statusCode === 401,
    );
  });
});
