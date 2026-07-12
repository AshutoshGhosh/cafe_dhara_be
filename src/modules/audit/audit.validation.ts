import { z } from 'zod';
import { Types } from 'mongoose';

const objectId = z
  .string()
  .refine((v) => Types.ObjectId.isValid(v), 'Must be a valid id');

/**
 * Query params for GET /api/audit. All filters optional; results are paginated.
 * `actor` filters by the acting user's id; date range applies to `createdAt`.
 */
export const auditQuerySchema = z.object({
  actor: objectId.optional(),
  action: z.string().min(1).max(100).optional(),
  entity: z.string().min(1).max(100).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AuditQueryInput = z.infer<typeof auditQuerySchema>;
