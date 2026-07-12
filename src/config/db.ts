import mongoose from 'mongoose';
import { env } from './env';

/**
 * Establish the MongoDB connection.
 * Call once during bootstrap. Reuses Mongoose's internal connection pool.
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);

  // Serialize documents with a string `id` (alongside `_id`) so API consumers
  // can rely on `id`. Per-schema transforms (e.g. User stripping passwordHash)
  // still apply — Mongoose merges these options.
  mongoose.set('toJSON', { virtuals: true });
  mongoose.set('toObject', { virtuals: true });

  mongoose.connection.on('connected', () => {
    // eslint-disable-next-line no-console
    console.log('[db] MongoDB connected');
  });
  mongoose.connection.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[db] MongoDB connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('[db] MongoDB disconnected');
  });

  await mongoose.connect(env.MONGODB_URI);
  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
