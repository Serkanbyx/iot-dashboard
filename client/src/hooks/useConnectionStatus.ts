import { useBackendWake } from "../contexts/BackendWakeContext";
import { useSocketContext } from "../contexts/SocketContext";

export type ConnectionState =
  | "connected"
  | "waking"
  | "reconnecting"
  | "offline";

export type IndicatorStatus = "online" | "offline" | "warning";

export function useConnectionStatus(): {
  connectionState: ConnectionState;
  indicatorStatus: IndicatorStatus;
  label: string;
} {
  const { isConnected } = useSocketContext();
  const { status: backendStatus } = useBackendWake();

  if (backendStatus === "checking" || backendStatus === "waking") {
    return {
      connectionState: "waking",
      indicatorStatus: "warning",
      label: "Waking up",
    };
  }

  if (backendStatus === "unavailable") {
    return {
      connectionState: "offline",
      indicatorStatus: "offline",
      label: "Backend unavailable",
    };
  }

  if (isConnected) {
    return {
      connectionState: "connected",
      indicatorStatus: "online",
      label: "Live",
    };
  }

  return {
    connectionState: "reconnecting",
    indicatorStatus: "warning",
    label: "Reconnecting",
  };
}
