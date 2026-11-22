import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from './password';

describe('password utils', () => {
  it('hashes password and verifies successfully', async () => {
    const plain = 'ChaiKadak@123';
    const hash = await hashPassword(plain);

    assert.notEqual(plain, hash);
    assert.ok(hash.startsWith('$2'));

    const isMatch = await verifyPassword(plain, hash);
    assert.equal(isMatch, true);
  });

  it('rejects incorrect password comparison', async () => {
    const plain = 'SecretDhara456';
    const hash = await hashPassword(plain);

    const isMatch = await verifyPassword('WrongPassword', hash);
    assert.equal(isMatch, false);
  });
});
