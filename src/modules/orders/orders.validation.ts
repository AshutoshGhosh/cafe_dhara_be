import { z } from 'zod';
import { ORDER_STATUS_VALUES, type OrderStatus } from '../../models/enums';

/** 24-char hex Mongo ObjectId. */
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const statusEnum = z.enum(ORDER_STATUS_VALUES as [OrderStatus, ...OrderStatus[]]);

/** POST /api/orders — public customer order placement. */
export const placeOrderSchema = z.object({
  sessionId: objectId,
  items: z
    .array(
      z.object({
        menuItemId: objectId,
        variantId: objectId.nullish(),
        addOnIds: z.array(objectId).max(50).nullish(),
        quantity: z.number().int().min(1).max(99),
        notes: z.string().trim().max(500).nullish(),
      }),
    )
    .min(1, 'At least one item is required')
    .max(50, 'Too many items'),
  notes: z.string().trim().max(1000).nullish(),
});

/** GET /api/orders — staff listing filters (query string). */
export const listOrdersSchema = z.object({
  status: statusEnum.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

/** PATCH /api/orders/:id/status */
export const updateStatusSchema = z.object({
  status: statusEnum,
  cancelReason: z.string().trim().max(500).optional(),
});

/** :id path param. */
export const idParamSchema = z.object({
  id: objectId,
});

/** ?sessionId= query for customer-scoped reads. */
export const sessionQuerySchema = z.object({
  sessionId: objectId.optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type ListOrdersInput = z.infer<typeof listOrdersSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
