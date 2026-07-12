import { z } from 'zod';
import { VegType, SpiceLevel } from '../../models/enums';

/** 24-char hex Mongo ObjectId. */
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const variantSchema = z.object({
  name: z.string().trim().min(1).max(120),
  priceAdjustment: z.number().default(0),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const addOnSchema = z.object({
  name: z.string().trim().min(1).max(120),
  price: z.number().min(0, 'Price must be >= 0'),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const createMenuItemSchema = z
  .object({
    category: objectIdSchema,
    name: z.string().trim().min(1, 'Name is required').max(160),
    description: z.string().trim().max(4000).optional(),
    price: z.number().min(0, 'Price must be >= 0'),
    discountPrice: z.number().min(0).optional(),
    image: z.string().trim().max(2000).optional(),
    vegType: z.nativeEnum(VegType).optional(),
    spiceLevel: z.nativeEnum(SpiceLevel).optional(),
    prepTime: z.number().int().min(0).optional(),
    isAvailable: z.boolean().optional(),
    isRecommended: z.boolean().optional(),
    isBestseller: z.boolean().optional(),
    sku: z.string().trim().max(120).optional(),
    sortOrder: z.number().int().optional(),
    variants: z.array(variantSchema).optional(),
    addOns: z.array(addOnSchema).optional(),
  })
  .refine(
    (d) => d.discountPrice === undefined || d.discountPrice <= d.price,
    { message: 'discountPrice cannot exceed price', path: ['discountPrice'] },
  );

export const updateMenuItemSchema = z
  .object({
    category: objectIdSchema.optional(),
    name: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(4000).optional(),
    price: z.number().min(0).optional(),
    discountPrice: z.number().min(0).nullable().optional(),
    image: z.string().trim().max(2000).optional(),
    vegType: z.nativeEnum(VegType).optional(),
    spiceLevel: z.nativeEnum(SpiceLevel).optional(),
    prepTime: z.number().int().min(0).optional(),
    isAvailable: z.boolean().optional(),
    isRecommended: z.boolean().optional(),
    isBestseller: z.boolean().optional(),
    sku: z.string().trim().max(120).optional(),
    sortOrder: z.number().int().optional(),
    variants: z.array(variantSchema).optional(),
    addOns: z.array(addOnSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const availabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export const listItemsQuerySchema = z.object({
  category: objectIdSchema.optional(),
  available: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
