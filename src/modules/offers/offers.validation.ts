import { z } from 'zod';
import { OfferType, OfferScope, OFFER_SCOPE_VALUES } from '../../models/enums';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

/**
 * Offers are limited to percentage/flat discounts in the single-cafe model.
 * `couponCode` is the human-facing unique code customers enter at checkout.
 */
export const createOfferSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    description: z.string().trim().optional(),
    type: z.enum([OfferType.PERCENTAGE, OfferType.FLAT]),
    scope: z.enum(OFFER_SCOPE_VALUES as [string, ...string[]]).default(OfferScope.CART),
    value: z.number().positive('Value must be greater than 0'),
    couponCode: z.string().trim().min(1, 'Coupon code is required'),
    minOrderValue: z.number().min(0).optional(),
    maxDiscount: z.number().positive().optional(),
    category: objectId.optional(),
    menuItem: objectId.optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    isActive: z.boolean().optional(),
    usageLimit: z.number().int().positive().optional(),
  })
  .refine((v) => v.endsAt > v.startsAt, {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  })
  .refine((v) => v.type !== OfferType.PERCENTAGE || v.value <= 100, {
    message: 'Percentage value cannot exceed 100',
    path: ['value'],
  });

export const updateOfferSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    type: z.enum([OfferType.PERCENTAGE, OfferType.FLAT]).optional(),
    scope: z.enum(OFFER_SCOPE_VALUES as [string, ...string[]]).optional(),
    value: z.number().positive().optional(),
    couponCode: z.string().trim().min(1).optional(),
    minOrderValue: z.number().min(0).optional(),
    maxDiscount: z.number().positive().optional(),
    category: objectId.optional(),
    menuItem: objectId.optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
    usageLimit: z.number().int().positive().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

export const listOffersSchema = z.object({
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export const validateOfferSchema = z.object({
  code: z.string().trim().min(1, 'Coupon code is required'),
  subtotal: z.number().nonnegative('Subtotal must be zero or greater'),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
export type ValidateOfferInput = z.infer<typeof validateOfferSchema>;
