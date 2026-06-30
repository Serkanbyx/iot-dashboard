import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { pingHealth, wakeBackend as wakeBackendRequest } from "../api/healthService";

export type BackendStatus = "checking" | "waking" | "awake" | "unavailable";

interface BackendWakeContextValue {
  status: BackendStatus;
  isWaking: boolean;
  wakeBackend: () => Promise<boolean>;
}

const BackendWakeContext = createContext<BackendWakeContextValue | null>(null);

export function BackendWakeProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<BackendStatus>("checking");
  const wakePromiseRef = useRef<Promise<boolean> | null>(null);
  const statusRef = useRef<BackendStatus>("checking");

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const wakeBackend = useCallback(async (): Promise<boolean> => {
    if (statusRef.current === "awake") return true;
    if (wakePromiseRef.current) return wakePromiseRef.current;

    const promise = (async () => {
      setStatus((current) => (current === "awake" ? "awake" : "waking"));

      try {
        await wakeBackendRequest();
        setStatus("awake");
        return true;
      } catch {
        setStatus("unavailable");
        return false;
      } finally {
        wakePromiseRef.current = null;
      }
    })();

    wakePromiseRef.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    let active = true;

    void pingHealth()
      .then(() => {
        if (active) setStatus("awake");
      })
      .catch(() => {
        if (active) void wakeBackend();
      });

    return () => {
      active = false;
    };
  }, [wakeBackend]);

  const value = useMemo(
    () => ({
      status,
      isWaking: status === "checking" || status === "waking",
      wakeBackend,
    }),
    [status, wakeBackend]
  );

  return (
    <BackendWakeContext.Provider value={value}>
      {children}
    </BackendWakeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBackendWake(): BackendWakeContextValue {
  const context = useContext(BackendWakeContext);
  if (!context) {
    throw new Error("useBackendWake must be used within a BackendWakeProvider");
  }
  return context;
}
