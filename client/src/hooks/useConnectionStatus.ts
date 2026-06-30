import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { isConnected } = useSocketContext();
  const { status: backendStatus } = useBackendWake();

  if (backendStatus === "checking" || backendStatus === "waking") {
    return {
      connectionState: "waking",
      indicatorStatus: "warning",
      label: t("connection.wakingUp"),
    };
  }

  if (backendStatus === "unavailable") {
    return {
      connectionState: "offline",
      indicatorStatus: "offline",
      label: t("connection.backendUnavailable"),
    };
  }

  if (isConnected) {
    return {
      connectionState: "connected",
      indicatorStatus: "online",
      label: t("connection.live"),
    };
  }

  return {
    connectionState: "reconnecting",
    indicatorStatus: "warning",
    label: t("connection.reconnecting"),
  };
}
