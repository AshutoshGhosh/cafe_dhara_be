import { z } from 'zod';
import { ROLE_VALUES } from '../../models/enums';
import type { Role } from '../../models/enums';

const roleSchema = z.enum(ROLE_VALUES as [Role, ...Role[]]);

export const createUserSchema = z.object({
  email: z.string().email('A valid email is required').toLowerCase(),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1).optional(),
  role: roleSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateUserSchema = z
  .object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    role: roleSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const listUsersSchema = z.object({
  role: roleSchema.optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ListUsersInput = z.infer<typeof listUsersSchema>;
