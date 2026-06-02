import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ShieldCheck, Eye } from "lucide-react";
import * as thresholdService from "../api/thresholdService";
import { useAuth } from "../contexts/AuthContext";
import type { ThresholdConfig } from "../types";
import ThresholdCard, {
  type ThresholdFormValues,
} from "../components/settings/ThresholdCard";
import SystemStatus from "../components/settings/SystemStatus";
import SettingsSkeleton from "../components/skeletons/SettingsSkeleton";
import PageTransition from "../components/ui/PageTransition";

const TYPE_ORDER: Record<string, number> = {
  TEMPERATURE: 0,
  HUMIDITY: 1,
  PRESSURE: 2,
};

function sortByType(list: ThresholdConfig[]): ThresholdConfig[] {
  return [...list].sort(
    (a, b) => (TYPE_ORDER[a.sensorType] ?? 99) - (TYPE_ORDER[b.sensorType] ?? 99)
  );
}

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [thresholds, setThresholds] = useState<ThresholdConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [togglingType, setTogglingType] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { thresholds: data } = await thresholdService.getAllThresholds();
        if (active) setThresholds(sortByType(data));
      } catch {
        if (active) toast.error("Failed to load threshold configuration.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const applyUpdate = useCallback((updated: ThresholdConfig) => {
    setThresholds((prev) =>
      sortByType(
        prev.map((t) => (t.sensorType === updated.sensorType ? updated : t))
      )
    );
  }, []);

  const handleSave = useCallback(
    async (sensorType: string, values: ThresholdFormValues) => {
      if (!isAdmin) return;
      setSavingType(sensorType);
      try {
        const { threshold } = await thresholdService.updateThreshold(
          sensorType,
          values
        );
        applyUpdate(threshold);
        toast.success(`${threshold.sensorType} thresholds updated.`);
      } catch {
        toast.error("Failed to save thresholds.");
      } finally {
        setSavingType(null);
      }
    },
    [applyUpdate, isAdmin]
  );

  const handleToggleActive = useCallback(
    async (sensorType: string, isActive: boolean) => {
      if (!isAdmin) return;
      const current = thresholds.find((t) => t.sensorType === sensorType);
      if (!current) return;

      setTogglingType(sensorType);
      // Optimistic toggle
      applyUpdate({ ...current, isActive });

      try {
        const { threshold } = await thresholdService.updateThreshold(sensorType, {
          minValue: current.minValue,
          maxValue: current.maxValue,
          criticalMin: current.criticalMin,
          criticalMax: current.criticalMax,
          isActive,
        });
        applyUpdate(threshold);
        toast.success(
          `${sensorType} monitoring ${isActive ? "enabled" : "disabled"}.`
        );
      } catch {
        applyUpdate(current);
        toast.error("Failed to update monitoring state.");
      } finally {
        setTogglingType(null);
      }
    },
    [thresholds, applyUpdate, isAdmin]
  );

  if (loading) return <SettingsSkeleton />;

  return (
    <PageTransition className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Settings</h1>
            {isAdmin ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-violet/15 text-accent-violet text-xs font-semibold">
                <ShieldCheck size={13} />
                Admin
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted text-xs font-semibold">
                <Eye size={13} />
                Read-only
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted mt-1">
            {isAdmin
              ? "Alert threshold configuration"
              : "Alert threshold configuration — view only"}
          </p>
        </div>
      </div>

      {/* Threshold cards */}
      <div className="flex flex-col gap-4">
        {thresholds.map((config) => (
          <ThresholdCard
            key={config.id}
            config={config}
            saving={savingType === config.sensorType}
            toggling={togglingType === config.sensorType}
            readOnly={!isAdmin}
            onSave={handleSave}
            onToggleActive={handleToggleActive}
          />
        ))}
      </div>

      {/* System status panel */}
      <SystemStatus />
    </PageTransition>
  );
}
