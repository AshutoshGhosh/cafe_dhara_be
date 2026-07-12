import http from 'http';
import path from 'path';
import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { connectDatabase } from './config/db';
import apiRouter from './modules';
import { apiLimiter } from './middleware/rateLimit';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { sendOk } from './common/response';
import { initSockets } from './sockets';

export function createApp(): express.Express {
  const app = express();

  // Security & parsing middleware.
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health check (unversioned, no rate limit).
  app.get('/api/health', (_req: Request, res: Response) => {
    sendOk(res, { status: 'ok', service: 'cafe-dhara-be', time: new Date().toISOString() });
  });

  // Rate-limited feature API.
  app.use('/api', apiLimiter, apiRouter);

  // Serve uploaded files (menu images) at root /uploads (dir auto-created on first upload).
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // 404 + global error handler (must be last).
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  // Attach Socket.IO to the same HTTP server.
  initSockets(server);

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] Cafe Dhara API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log(`\n[server] ${signal} received, shutting down...`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

// Only auto-start when run directly (not when imported by tests).
if (require.main === module) {
  bootstrap().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[server] Fatal bootstrap error:', err);
    process.exit(1);
  });
}
