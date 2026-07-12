import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'A valid id is required');

export const tableIdParamSchema = z.object({
  tableId: objectIdSchema,
});

export const verifyTokenSchema = z.object({
  token: z.string().min(1, 'token is required').max(512),
});

export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>;
