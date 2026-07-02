import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

/**
 * Real-time layer for study rooms. Attaches Socket.IO to the existing HTTP
 * server (no separate host required), so it runs anywhere the API runs and
 * simply does nothing if a client can't connect.
 *
 * Features per room: presence (member count), live chat, and a shared Pomodoro
 * timer that any member can drive and everyone else stays in sync with.
 */

interface AuthedSocket extends Socket {
  userId?: string;
  displayName?: string;
}

const roomMemberCount = (io: Server, roomId: string): number =>
  io.sockets.adapter.rooms.get(roomId)?.size ?? 0;

export const initSocket = (httpServer: HttpServer): Server => {
  const allowedOrigins = (process.env.FRONTEND_URL || 'https://eduguardian.netlify.app')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
      credentials: true,
    },
  });

  // Handshake auth: a valid JWT is required to use real-time features.
  io.use((socket: AuthedSocket, next) => {
    try {
      const token: string | undefined =
        socket.handshake.auth?.token || (socket.handshake.query?.token as string | undefined);
      if (!token || !process.env.JWT_SECRET) {
        return next(new Error('unauthorized'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
      socket.userId = decoded.id;
      socket.displayName =
        (socket.handshake.auth?.name as string | undefined)?.slice(0, 40) || 'A student';
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket: AuthedSocket) => {
    socket.on('room:join', ({ roomId }: { roomId: string }) => {
      if (!roomId) return;
      socket.join(roomId);
      io.to(roomId).emit('room:presence', { roomId, members: roomMemberCount(io, roomId) });
      socket.to(roomId).emit('room:system', {
        text: `${socket.displayName} joined the room`,
        ts: Date.now(),
      });
    });

    socket.on('room:leave', ({ roomId }: { roomId: string }) => {
      if (!roomId) return;
      socket.leave(roomId);
      io.to(roomId).emit('room:presence', { roomId, members: roomMemberCount(io, roomId) });
    });

    socket.on('room:message', ({ roomId, text }: { roomId: string; text: string }) => {
      const clean = (text || '').toString().slice(0, 1000).trim();
      if (!roomId || !clean) return;
      io.to(roomId).emit('room:message', {
        userId: socket.userId,
        user: socket.displayName,
        text: clean,
        ts: Date.now(),
      });
    });

    // Shared Pomodoro: whoever changes the timer broadcasts the authoritative
    // state to the rest of the room.
    socket.on(
      'pomodoro:update',
      ({ roomId, state }: { roomId: string; state: unknown }) => {
        if (!roomId) return;
        socket.to(roomId).emit('pomodoro:state', { state, by: socket.displayName });
      }
    );

    socket.on('disconnecting', () => {
      // Notify each room this socket was part of that the population changed.
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          socket.to(roomId).emit('room:presence', {
            roomId,
            members: Math.max(roomMemberCount(io, roomId) - 1, 0),
          });
        }
      }
    });
  });

  console.log('[socket] Real-time study rooms enabled');
  return io;
};

export default initSocket;
