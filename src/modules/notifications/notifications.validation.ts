import { z } from 'zod';

export const listNotificationsSchema = z.object({
  isRead: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export const notificationIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
});

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
