import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateBillSchema, listBillsSchema } from './bills.validation';

describe('bills.validation', () => {
  describe('generateBillSchema', () => {
    it('accepts orderIds without sessionId for counter/takeaway orders', () => {
      const valid = generateBillSchema.safeParse({
        orderIds: ['507f1f77bcf86cd799439011'],
        paymentMode: 'CASH',
      });
      assert.equal(valid.success, true);
      if (valid.success) {
        assert.deepEqual(valid.data.orderIds, ['507f1f77bcf86cd799439011']);
        assert.equal(valid.data.sessionId, undefined);
        assert.equal(valid.data.paymentMode, 'CASH');
      }
    });

    it('accepts multiple orderIds for batch counter billing', () => {
      const valid = generateBillSchema.safeParse({
        orderIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
        paymentMode: 'UPI',
      });
      assert.equal(valid.success, true);
      if (valid.success) {
        assert.equal(valid.data.orderIds?.length, 2);
      }
    });

    it('accepts sessionId without orderIds for table QR sessions', () => {
      const valid = generateBillSchema.safeParse({
        sessionId: '507f1f77bcf86cd799439013',
      });
      assert.equal(valid.success, true);
      if (valid.success) {
        assert.equal(valid.data.sessionId, '507f1f77bcf86cd799439013');
      }
    });

    it('rejects payload when neither sessionId nor orderIds is provided', () => {
      const empty = generateBillSchema.safeParse({});
      assert.equal(empty.success, false);

      const emptyList = generateBillSchema.safeParse({ orderIds: [] });
      assert.equal(emptyList.success, false);
    });

    it('rejects invalid ObjectId strings in orderIds and sessionId', () => {
      const badOrder = generateBillSchema.safeParse({
        orderIds: ['not-an-object-id'],
      });
      assert.equal(badOrder.success, false);

      const badSession = generateBillSchema.safeParse({
        sessionId: 'short-id',
      });
      assert.equal(badSession.success, false);
    });

    it('validates allowed paymentMode options', () => {
      for (const mode of ['CASH', 'CARD', 'UPI', 'OTHER'] as const) {
        const res = generateBillSchema.safeParse({
          orderIds: ['507f1f77bcf86cd799439011'],
          paymentMode: mode,
        });
        assert.equal(res.success, true);
      }

      const invalidMode = generateBillSchema.safeParse({
        orderIds: ['507f1f77bcf86cd799439011'],
        paymentMode: 'BITCOIN' as any,
      });
      assert.equal(invalidMode.success, false);
    });
  });

  describe('listBillsSchema', () => {
    it('accepts optional date range filters', () => {
      const res = listBillsSchema.safeParse({
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-01-31T23:59:59.999Z',
      });
      assert.equal(res.success, true);
      if (res.success) {
        assert.ok(res.data.from instanceof Date);
        assert.ok(res.data.to instanceof Date);
      }
    });

    it('accepts empty filter for all bills', () => {
      const res = listBillsSchema.safeParse({});
      assert.equal(res.success, true);
    });
  });
});
