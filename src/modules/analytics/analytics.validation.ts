import { z } from 'zod';

/**
 * Shared date-range query for all analytics endpoints. `from`/`to` are optional
 * and coerced from ISO strings (or anything `new Date()` accepts). The range is
 * applied to the Order `createdAt` field.
 */
export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

/** Top-items adds an optional result limit. */
export const topItemsSchema = dateRangeSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type TopItemsInput = z.infer<typeof topItemsSchema>;
