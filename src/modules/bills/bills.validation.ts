import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const generateBillSchema = z
  .object({
    sessionId: objectId.optional(),
    orderIds: z.array(objectId).min(1).optional(),
    paymentMode: z.enum(['CASH', 'CARD', 'UPI', 'OTHER']).optional(),
  })
  .refine((d) => Boolean(d.sessionId) || Boolean(d.orderIds?.length), {
    message: 'Provide sessionId or orderIds',
  });

export type GenerateBillInput = z.infer<typeof generateBillSchema>;

export const listBillsSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type ListBillsInput = z.infer<typeof listBillsSchema>;
