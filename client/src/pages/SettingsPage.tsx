import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ShieldCheck, Eye, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import * as thresholdService from "../api/thresholdService";
import * as deviceService from "../api/deviceService";
import { useAuth } from "../contexts/AuthContext";
import type { Device, ThresholdConfig } from "../types";
import ThresholdCard, {
  type ThresholdFormValues,
} from "../components/settings/ThresholdCard";
import SystemStatus from "../components/settings/SystemStatus";
import SettingsSkeleton from "../components/skeletons/SettingsSkeleton";
import PageTransition from "../components/ui/PageTransition";
import { cn } from "../utils/cn";

const TYPE_ORDER: Record<string, number> = {
  TEMPERATURE: 0,
  HUMIDITY: 1,
  PRESSURE: 2,
};

const SENSOR_TYPES = ["TEMPERATURE", "HUMIDITY", "PRESSURE"] as const;

function sortByType(list: ThresholdConfig[]): ThresholdConfig[] {
  return [...list].sort(
    (a, b) => (TYPE_ORDER[a.sensorType] ?? 99) - (TYPE_ORDER[b.sensorType] ?? 99)
  );
}

function thresholdKey(config: Pick<ThresholdConfig, "sensorType" | "sensorId">) {
  return `${config.sensorType}:${config.sensorId ?? ""}`;
}

function isGlobalThreshold(config: ThresholdConfig) {
  return !config.sensorId;
}

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const [thresholds, setThresholds] = useState<ThresholdConfig[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [overrideDeviceId, setOverrideDeviceId] = useState("");
  const [overrideType, setOverrideType] = useState<(typeof SENSOR_TYPES)[number]>(
    "TEMPERATURE"
  );
  const [creatingOverride, setCreatingOverride] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [{ thresholds: data }, { devices: deviceList }] = await Promise.all([
          thresholdService.getAllThresholds(),
          deviceService.getDevices(),
        ]);
        if (active) {
          setThresholds(sortByType(data));
          setDevices(deviceList);
          if (deviceList.length > 0) {
            setOverrideDeviceId(deviceList[0].sensorId);
          }
        }
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

  const globalThresholds = useMemo(
    () => sortByType(thresholds.filter(isGlobalThreshold)),
    [thresholds]
  );

  const deviceOverrides = useMemo(
    () =>
      sortByType(thresholds.filter((item) => !isGlobalThreshold(item))).sort(
        (a, b) => (a.sensorId ?? "").localeCompare(b.sensorId ?? "")
      ),
    [thresholds]
  );

  const applyUpdate = useCallback((updated: ThresholdConfig) => {
    setThresholds((prev) => {
      const key = thresholdKey(updated);
      const exists = prev.some((item) => thresholdKey(item) === key);
      const next = exists
        ? prev.map((item) => (thresholdKey(item) === key ? updated : item))
        : [...prev, updated];
      return sortByType(next);
    });
  }, []);

  const removeThreshold = useCallback((sensorType: string, sensorId: string) => {
    setThresholds((prev) =>
      sortByType(
        prev.filter(
          (item) => !(item.sensorType === sensorType && item.sensorId === sensorId)
        )
      )
    );
  }, []);

  const handleSave = useCallback(
    async (sensorType: string, values: ThresholdFormValues, sensorId = "") => {
      if (!isAdmin) return;
      const key = `${sensorType}:${sensorId}`;
      setSavingKey(key);
      try {
        const { threshold } = await thresholdService.updateThreshold(
          sensorType,
          values,
          sensorId || undefined
        );
        applyUpdate(threshold);
        toast.success(`${threshold.sensorType} thresholds updated.`);
      } catch {
        toast.error("Failed to save thresholds.");
      } finally {
        setSavingKey(null);
      }
    },
    [applyUpdate, isAdmin]
  );

  const handleToggleActive = useCallback(
    async (sensorType: string, isActive: boolean, sensorId = "") => {
      if (!isAdmin) return;
      const key = `${sensorType}:${sensorId}`;
      const current = thresholds.find(
        (item) => item.sensorType === sensorType && (item.sensorId ?? "") === sensorId
      );
      if (!current) return;

      setTogglingKey(key);
      applyUpdate({ ...current, isActive });

      try {
        const { threshold } = await thresholdService.updateThreshold(
          sensorType,
          {
            minValue: current.minValue,
            maxValue: current.maxValue,
            criticalMin: current.criticalMin,
            criticalMax: current.criticalMax,
            isActive,
          },
          sensorId || undefined
        );
        applyUpdate(threshold);
        toast.success(
          `${sensorType} monitoring ${isActive ? "enabled" : "disabled"}.`
        );
      } catch {
        applyUpdate(current);
        toast.error("Failed to update monitoring state.");
      } finally {
        setTogglingKey(null);
      }
    },
    [thresholds, applyUpdate, isAdmin]
  );

  const handleDeleteOverride = useCallback(
    async (sensorType: string, sensorId: string) => {
      if (!isAdmin || !sensorId) return;
      const key = `${sensorType}:${sensorId}`;
      setDeletingKey(key);
      try {
        await thresholdService.deleteDeviceThreshold(sensorType, sensorId);
        removeThreshold(sensorType, sensorId);
        toast.success("Device override removed.");
      } catch {
        toast.error("Failed to remove device override.");
      } finally {
        setDeletingKey(null);
      }
    },
    [isAdmin, removeThreshold]
  );

  const handleCreateOverride = useCallback(async () => {
    if (!isAdmin || !overrideDeviceId) return;

    const global = globalThresholds.find((item) => item.sensorType === overrideType);
    if (!global) {
      toast.error("Global threshold not found for selected type.");
      return;
    }

    const exists = deviceOverrides.some(
      (item) =>
        item.sensorType === overrideType && item.sensorId === overrideDeviceId
    );
    if (exists) {
      toast.error("Override already exists for this device and type.");
      return;
    }

    setCreatingOverride(true);
    try {
      const { threshold } = await thresholdService.updateThreshold(
        overrideType,
        {
          minValue: global.minValue,
          maxValue: global.maxValue,
          criticalMin: global.criticalMin,
          criticalMax: global.criticalMax,
          isActive: global.isActive,
        },
        overrideDeviceId
      );
      applyUpdate(threshold);
      toast.success("Device override created.");
    } catch {
      toast.error("Failed to create device override.");
    } finally {
      setCreatingOverride(false);
    }
  }, [
    applyUpdate,
    deviceOverrides,
    globalThresholds,
    isAdmin,
    overrideDeviceId,
    overrideType,
  ]);

  if (loading) return <SettingsSkeleton />;

  return (
    <PageTransition className="flex flex-col gap-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t("nav.settings")}</h1>
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

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t("settings.globalThresholds")}</h2>
        {globalThresholds.map((config) => (
          <ThresholdCard
            key={config.id}
            config={config}
            saving={savingKey === thresholdKey(config)}
            toggling={togglingKey === thresholdKey(config)}
            readOnly={!isAdmin}
            onSave={handleSave}
            onToggleActive={handleToggleActive}
          />
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t("settings.deviceOverrides")}</h2>

        {isAdmin && devices.length > 0 && (
          <div className="glass rounded-xl border border-glass-border p-4 flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-text-muted">Device</span>
              <select
                value={overrideDeviceId}
                onChange={(e) => setOverrideDeviceId(e.target.value)}
                className="h-10 min-w-[180px] rounded-lg bg-bg-elevated border border-glass-border px-3"
              >
                {devices.map((device) => (
                  <option key={device.id} value={device.sensorId}>
                    {device.name} ({device.sensorId})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-text-muted">Sensor type</span>
              <select
                value={overrideType}
                onChange={(e) =>
                  setOverrideType(e.target.value as (typeof SENSOR_TYPES)[number])
                }
                className="h-10 min-w-[160px] rounded-lg bg-bg-elevated border border-glass-border px-3"
              >
                {SENSOR_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => void handleCreateOverride()}
              disabled={creatingOverride}
              className={cn(
                "inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium",
                "bg-accent-blue text-white disabled:opacity-50"
              )}
            >
              <Plus size={16} />
              Add override
            </button>
          </div>
        )}

        {deviceOverrides.length === 0 ? (
          <p className="text-sm text-text-muted">No device-specific overrides yet.</p>
        ) : (
          deviceOverrides.map((config) => (
            <ThresholdCard
              key={config.id}
              config={config}
              saving={savingKey === thresholdKey(config)}
              toggling={togglingKey === thresholdKey(config)}
              deleting={deletingKey === thresholdKey(config)}
              readOnly={!isAdmin}
              onSave={handleSave}
              onToggleActive={handleToggleActive}
              onDelete={
                isAdmin && config.sensorId
                  ? () => void handleDeleteOverride(config.sensorType, config.sensorId!)
                  : undefined
              }
            />
          ))
        )}
      </section>

      <SystemStatus />
    </PageTransition>
  );
}
