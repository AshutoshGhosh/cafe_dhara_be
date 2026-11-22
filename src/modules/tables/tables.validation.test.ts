import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  objectIdSchema,
  createTableSchema,
  updateTableSchema,
} from './tables.validation';

describe('tables.validation', () => {
  describe('objectIdSchema', () => {
    it('accepts valid 24-character hex ObjectId', () => {
      const valid = '507f1f77bcf86cd799439011';
      const result = objectIdSchema.safeParse(valid);
      assert.equal(result.success, true);
    });

    it('rejects invalid ObjectId strings', () => {
      assert.equal(objectIdSchema.safeParse('not-an-id').success, false);
      assert.equal(objectIdSchema.safeParse('123').success, false);
      assert.equal(objectIdSchema.safeParse('507f1f77bcf86cd79943901z').success, false);
    });
  });

  describe('createTableSchema', () => {
    it('validates a correct table creation payload', () => {
      const result = createTableSchema.safeParse({
        number: 4,
        name: 'Window Booth',
        capacity: 6,
        isActive: true,
      });
      assert.equal(result.success, true);
    });

    it('rejects negative or zero table numbers', () => {
      const zero = createTableSchema.safeParse({ number: 0 });
      assert.equal(zero.success, false);

      const negative = createTableSchema.safeParse({ number: -2 });
      assert.equal(negative.success, false);
    });

    it('coerces numeric string inputs', () => {
      const coerced = createTableSchema.safeParse({
        number: '5',
        capacity: '4',
      });
      assert.equal(coerced.success, true);
      if (coerced.success) {
        assert.equal(coerced.data.number, 5);
        assert.equal(coerced.data.capacity, 4);
      }
    });
  });

  describe('updateTableSchema', () => {
    it('rejects empty update payload', () => {
      const result = updateTableSchema.safeParse({});
      assert.equal(result.success, false);
    });

    it('accepts partial updates', () => {
      const result = updateTableSchema.safeParse({ isActive: false });
      assert.equal(result.success, true);
    });
  });
});
