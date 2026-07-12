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
      // TEMP debug — remove after diagnosing realtime.
      // eslint-disable-next-line no-console
      console.log(`[socket-debug] ${socket.id} authed as staff (role=${payload.role}) → joined '${STAFF_ROOM}'`);
    } catch {
      // Invalid/expired staff token — silently ignored; socket stays unprivileged.
      // TEMP debug — remove after diagnosing realtime.
      // eslint-disable-next-line no-console
      console.log(`[socket-debug] ${socket.id} staff token present but INVALID — not joined to '${STAFF_ROOM}'`);
    }
  }

  // Customer session room (from handshake).
  if (typeof auth.sessionId === 'string' && auth.sessionId.length > 0) {
    socket.data.sessionId = auth.sessionId;
    void socket.join(sessionRoom(auth.sessionId));
    // TEMP debug — remove after diagnosing realtime.
    // eslint-disable-next-line no-console
    console.log(`[socket-debug] ${socket.id} customer → joined '${sessionRoom(auth.sessionId)}'`);
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
    // Allow both transports (this is the default, made explicit for clarity).
    transports: ['websocket', 'polling'],
  });

  // TEMP debug — log the CORS allow-list once at startup. Remove after diagnosing realtime.
  // eslint-disable-next-line no-console
  console.log('[socket-debug] CORS origins:', env.corsOrigins);

  io.on('connection', (socket) => {
    // eslint-disable-next-line no-console
    console.log(`[socket] client connected: ${socket.id}`);
    registerHandlers(socket);
    // TEMP debug — report every room this socket ended up in. Remove after diagnosing realtime.
    // eslint-disable-next-line no-console
    console.log(`[socket-debug] ${socket.id} joined rooms:`, [...socket.rooms]);
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
/** TEMP debug helper — how many sockets are currently in a room. Remove after diagnosing realtime. */
function roomSize(room: string): number {
  return io?.sockets.adapter.rooms.get(room)?.size ?? 0;
}

export function emitOrderNew(order: unknown): void {
  if (!io) return;
  // TEMP debug — remove after diagnosing realtime.
  // eslint-disable-next-line no-console
  console.log(`[socket-debug] emit 'order:new' → room '${STAFF_ROOM}' (${roomSize(STAFF_ROOM)} client[s])`);
  io.to(STAFF_ROOM).emit('order:new', order);
}

export function emitOrderUpdated(order: unknown, sessionId?: string | null): void {
  if (!io) return;
  const rooms = [STAFF_ROOM, ...(sessionId ? [sessionRoom(sessionId)] : [])];
  // TEMP debug — remove after diagnosing realtime.
  // eslint-disable-next-line no-console
  console.log(
    `[socket-debug] emit 'order:updated' → rooms`,
    rooms.map((r) => `${r} (${roomSize(r)} client[s])`),
  );
  io.to(STAFF_ROOM).emit('order:updated', order);
  if (sessionId) {
    io.to(sessionRoom(sessionId)).emit('order:updated', order);
  }
}
