import { useEffect, useState } from "react";
import { Wifi, WifiOff, Cpu, Clock, Activity } from "lucide-react";
import { useSocketContext } from "../../contexts/SocketContext";
import * as healthService from "../../api/healthService";
import * as sensorService from "../../api/sensorService";
import { cn } from "../../utils/cn";

const DATA_RETENTION = "30 days";
const HEALTH_POLL_MS = 30_000;

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

interface StatusItemProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  iconColor: string;
}

function StatusItem({ icon: Icon, label, value, iconColor }: StatusItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex items-center justify-center h-9 w-9 rounded-lg glass", iconColor)}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-semibold text-text-primary truncate">{value}</p>
      </div>
    </div>
  );
}

export default function SystemStatus() {
  const { isConnected } = useSocketContext();
  const [uptime, setUptime] = useState<number | null>(null);
  const [activeSensors, setActiveSensors] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function loadHealth() {
      try {
        const { uptime: value } = await healthService.getHealth();
        if (active) setUptime(value);
      } catch {
        if (active) setUptime(null);
      }
    }

    loadHealth();
    const interval = setInterval(loadHealth, HEALTH_POLL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { readings } = await sensorService.getLatestReadings();
        if (active) {
          const unique = new Set(readings.map((r) => r.sensorId));
          setActiveSensors(unique.size);
        }
      } catch {
        if (active) setActiveSensors(null);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary">
          System Status
        </h2>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-success" : "bg-danger"
            )}
          />
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatusItem
          icon={isConnected ? Wifi : WifiOff}
          label="MQTT Status"
          value={isConnected ? "Online" : "Offline"}
          iconColor={isConnected ? "text-success" : "text-danger"}
        />
        <StatusItem
          icon={Cpu}
          label="Active Sensors"
          value={activeSensors === null ? "—" : String(activeSensors)}
          iconColor="text-accent-blue"
        />
        <StatusItem
          icon={Clock}
          label="Data Retention"
          value={DATA_RETENTION}
          iconColor="text-accent-violet"
        />
        <StatusItem
          icon={Activity}
          label="Uptime"
          value={uptime === null ? "—" : formatUptime(uptime)}
          iconColor="text-sensor-humidity"
        />
      </div>
    </div>
  );
}
