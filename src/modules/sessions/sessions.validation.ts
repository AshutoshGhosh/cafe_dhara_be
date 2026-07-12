import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'A valid id is required');

export const idParamSchema = z.object({
  id: objectIdSchema,
});

export const startSessionSchema = z.object({
  token: z.string().min(1, 'token is required').max(512),
  deviceFingerprint: z.string().trim().max(200).optional(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
