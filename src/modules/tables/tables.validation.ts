import { z } from 'zod';

/** A 24-char hex Mongo ObjectId. */
export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'A valid id is required');

export const idParamSchema = z.object({
  id: objectIdSchema,
});

export const createTableSchema = z.object({
  number: z.coerce.number().int().positive('Table number must be a positive integer'),
  name: z.string().trim().min(1).max(60).optional(),
  capacity: z.coerce.number().int().positive().max(100).optional(),
  isActive: z.boolean().optional(),
});

export const updateTableSchema = z
  .object({
    number: z.coerce.number().int().positive().optional(),
    name: z.string().trim().min(1).max(60).optional(),
    capacity: z.coerce.number().int().positive().max(100).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' });

export const listTablesQuerySchema = z.object({
  includeInactive: z.coerce.boolean().optional(),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
