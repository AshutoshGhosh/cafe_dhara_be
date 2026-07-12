import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Central, validated environment loader.
 * Throws early (before the server boots) if required config is missing/invalid.
 * NEVER hardcode secrets here — everything comes from process.env.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),

  CORS_ORIGIN: z.string().default('http://localhost:3001'),

  QR_SECRET: z.string().min(1, 'QR_SECRET is required'),

  // Absolute base URL of the customer web app, used to build QR scan URLs.
  CLIENT_URL: z.string().url().optional(),

  // Optional seed overrides
  SEED_OWNER_EMAIL: z.string().email().default('owner@cafedhara.local'),
  SEED_OWNER_PASSWORD: z.string().min(6).default('ChangeMe123!'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Do NOT print values — only the field names / messages.
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  // eslint-disable-next-line no-console
  console.error(`\nInvalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isDev: raw.NODE_ENV === 'development',
  /** Parsed list of allowed CORS origins. */
  corsOrigins: raw.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
};

export type Env = typeof env;
