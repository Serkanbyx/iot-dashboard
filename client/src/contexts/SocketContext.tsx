import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useBackendWake } from "./BackendWakeContext";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

const SOCKET_URL = import.meta.env.VITE_API_URL || "";

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const { status: backendStatus } = useBackendWake();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token || backendStatus !== "awake") {
      setSocket(null); // eslint-disable-line react-hooks/set-state-in-effect -- clear when logged out or backend asleep
      setIsConnected(false);
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => setIsConnected(true));
    newSocket.on("disconnect", () => setIsConnected(false));

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, backendStatus]);

  const value = useMemo(
    () => ({ socket, isConnected }),
    [socket, isConnected]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocketContext(): SocketContextValue {
  return useContext(SocketContext);
}
