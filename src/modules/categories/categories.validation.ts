import { z } from 'zod';

/** 24-char hex Mongo ObjectId. */
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  slug: z.string().trim().min(1).max(140).optional(),
  description: z.string().trim().max(2000).optional(),
  image: z.string().trim().max(2000).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
);

export const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: objectIdSchema,
        sortOrder: z.number().int(),
      }),
    )
    .min(1, 'At least one item is required'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
