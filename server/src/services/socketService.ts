import { Server } from "socket.io";
import type { IncomingMessage, ServerResponse, Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import config from "../config/env.js";
import prisma from "../config/database.js";
import type { ServerToClientEvents, ClientToServerEvents } from "../types/socket.js";

interface JwtPayload {
  userId: string;
}

interface SocketUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "VIEWER";
}

interface SocketData {
  user: SocketUser;
}

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

let io: TypedServer | null = null;

async function authenticateSocket(
  token: unknown
): Promise<SocketUser | null> {
  if (typeof token !== "string" || !token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export function initSocket(
  httpServer: HttpServer<typeof IncomingMessage, typeof ServerResponse>
): TypedServer {
  io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(
    httpServer,
    {
      cors: { origin: config.CLIENT_URL, credentials: true },
    }
  );

  io.use(async (socket, next) => {
    const user = await authenticateSocket(socket.handshake.auth.token);

    if (!user) {
      next(new Error("Authentication failed"));
      return;
    }

    socket.data.user = user;
    next();
  });

  io.on("connection", (socket) => {
    socket.join("dashboard");
    console.log(
      `[SOCKET] Client connected: ${socket.id} (${socket.data.user.email})`
    );

    socket.on("disconnect", () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): TypedServer {
  if (!io) {
    throw new Error("Socket.io not initialized — call initSocket() first");
  }
  return io;
}

export function closeSocket(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!io) {
      resolve();
      return;
    }

    const server = io;
    io = null;

    server.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log("[SOCKET] Server closed");
      resolve();
    });
  });
}
