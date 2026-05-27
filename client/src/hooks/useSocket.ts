import { useEffect } from "react";
import { useSocketContext } from "../contexts/SocketContext";

export function useSocket<T>(
  event: string,
  callback: (data: T) => void
): void {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    socket.on(event, callback as (...args: unknown[]) => void);

    return () => {
      socket.off(event, callback as (...args: unknown[]) => void);
    };
  }, [socket, event, callback]);
}
