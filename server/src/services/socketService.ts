import { Server } from "socket.io";
import type { IncomingMessage, ServerResponse, Server as HttpServer } from "node:http";
import config from "../config/env.js";
import type { ServerToClientEvents, ClientToServerEvents } from "../types/socket.js";

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

let io: TypedServer | null = null;

export function initSocket(
  httpServer: HttpServer<typeof IncomingMessage, typeof ServerResponse>
): TypedServer {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: config.CLIENT_URL, credentials: true },
  });

  io.on("connection", (socket) => {
    socket.join("dashboard");
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    socket.on("subscribe:floor", (floor: string) => {
      socket.join(`floor:${floor}`);
    });

    socket.on("unsubscribe:floor", (floor: string) => {
      socket.leave(`floor:${floor}`);
    });

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
