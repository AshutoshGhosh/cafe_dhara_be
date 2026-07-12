import { z } from 'zod';

export const updateSettingsSchema = z.object({
  cafeName: z.string().trim().min(1).max(120).optional(),
  legalName: z.string().trim().max(160).optional(),
  addressLine1: z.string().trim().max(200).optional(),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  pincode: z.string().trim().max(12).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().max(160).optional(),
  gstEnabled: z.boolean().optional(),
  gstin: z.string().trim().max(20).optional(),
  gstRate: z.number().min(0).max(28).optional(),
  invoicePrefix: z.string().trim().max(12).optional(),
  billFooterNote: z.string().trim().max(500).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
