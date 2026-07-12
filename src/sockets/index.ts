import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { env } from '../config/env';
import { verifyAccessToken } from '../utils/jwt';

/**
 * Socket.IO bootstrap + real-time layer for the orders module.
 *
 * Rooms:
 *   - 'staff'            : every authenticated staff/kitchen socket. Receives
 *                          'order:new' and 'order:updated'.
 *   - `session:<id>`     : one room per customer table session. Receives
 *                          'order:updated' for its own orders only.
 *
 * Handshake auth (socket.handshake.auth):
 *   - { token }      : staff access JWT — verified; on success the socket joins
 *                      the 'staff' room.
 *   - { sessionId }  : customer table session id — the socket joins that
 *                      session's room. Customers may also emit 'session:join'.
 */
let io: SocketIOServer | null = null;

export const STAFF_ROOM = 'staff';

/** Room name for a given customer session id. */
export function sessionRoom(sessionId: string): string {
  return `session:${sessionId}`;
}

function registerHandlers(socket: Socket): void {
  const auth = (socket.handshake.auth ?? {}) as {
    token?: unknown;
    sessionId?: unknown;
  };

  // Staff authentication — verify the access token from the handshake.
  if (typeof auth.token === 'string' && auth.token.length > 0) {
    try {
      const payload = verifyAccessToken(auth.token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      void socket.join(STAFF_ROOM);
    } catch {
      // Invalid/expired staff token — silently ignored; socket stays unprivileged.
    }
  }

  // Customer session room (from handshake).
  if (typeof auth.sessionId === 'string' && auth.sessionId.length > 0) {
    socket.data.sessionId = auth.sessionId;
    void socket.join(sessionRoom(auth.sessionId));
  }

  // Customers may also join their session room after connecting.
  socket.on('session:join', (sessionId: unknown) => {
    if (typeof sessionId === 'string' && sessionId.length > 0) {
      socket.data.sessionId = sessionId;
      void socket.join(sessionRoom(sessionId));
    }
  });

  socket.on('disconnect', () => {
    // eslint-disable-next-line no-console
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
}

export function initSockets(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.corsOrigins,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // eslint-disable-next-line no-console
    console.log(`[socket] client connected: ${socket.id}`);
    registerHandlers(socket);
  });

  return io;
}

/** Access the initialized Socket.IO server (throws if not yet initialized). */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized — call initSockets() first');
  }
  return io;
}

/**
 * Emit helpers used by the orders service. They are no-ops (not throwing) when
 * sockets are not initialized, so HTTP request handling never fails just
 * because the realtime layer is unavailable (e.g. in tests).
 */
export function emitOrderNew(order: unknown): void {
  if (!io) return;
  io.to(STAFF_ROOM).emit('order:new', order);
}

export function emitOrderUpdated(order: unknown, sessionId?: string | null): void {
  if (!io) return;
  io.to(STAFF_ROOM).emit('order:updated', order);
  if (sessionId) {
    io.to(sessionRoom(sessionId)).emit('order:updated', order);
  }
}
