import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  Eye,
  Plus,
  Pencil,
  Trash2,
  Cpu,
  Loader2,
} from "lucide-react";
import * as deviceService from "../api/deviceService";
import { useAuth } from "../contexts/AuthContext";
import type { Device, CreateDevicePayload, UpdateDevicePayload } from "../types";
import PageTransition from "../components/ui/PageTransition";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";
import Toggle from "../components/ui/Toggle";
import Spinner from "../components/ui/Spinner";
import ConfirmModal from "../components/ui/ConfirmModal";
import EmptyState from "../components/ui/EmptyState";
import { cn } from "../utils/cn";

const SENSOR_TYPES = ["TEMPERATURE", "HUMIDITY", "PRESSURE"] as const;
const TYPE_LABELS: Record<string, { label: string; variant: "info" | "success" | "warning" | "danger" | "violet" }> = {
  TEMPERATURE: { label: "Temp", variant: "danger" },
  HUMIDITY: { label: "Humidity", variant: "info" },
  PRESSURE: { label: "Pressure", variant: "violet" },
};

interface DeviceFormData {
  sensorId: string;
  name: string;
  floor: string;
  types: string[];
}

const EMPTY_FORM: DeviceFormData = {
  sensorId: "",
  name: "",
  floor: "",
  types: ["TEMPERATURE", "HUMIDITY", "PRESSURE"],
};

export default function DevicesPage() {
  const { isAdmin } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [form, setForm] = useState<DeviceFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const { devices: data } = await deviceService.getDevices();
      setDevices(data);
    } catch {
      toast.error("Failed to load devices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchDevices]);

  const openCreate = useCallback(() => {
    setEditingDevice(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((device: Device) => {
    setEditingDevice(device);
    setForm({
      sensorId: device.sensorId,
      name: device.name,
      floor: device.floor,
      types: [...device.types],
    });
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (saving) return;
    setModalOpen(false);
    setEditingDevice(null);
  }, [saving]);

  const handleToggleType = useCallback((type: string) => {
    setForm((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!isAdmin) return;
    if (!form.sensorId.trim() || !form.name.trim() || !form.floor.trim()) {
      toast.error("All fields are required.");
      return;
    }
    if (form.types.length === 0) {
      toast.error("Select at least one sensor type.");
      return;
    }

    setSaving(true);
    try {
      if (editingDevice) {
        const payload: UpdateDevicePayload = {
          name: form.name.trim(),
          floor: form.floor.trim(),
          types: form.types,
        };
        const { device } = await deviceService.updateDevice(editingDevice.id, payload);
        setDevices((prev) => prev.map((d) => (d.id === device.id ? device : d)));
        toast.success(`${device.name} updated.`);
      } else {
        const payload: CreateDevicePayload = {
          sensorId: form.sensorId.trim(),
          name: form.name.trim(),
          floor: form.floor.trim(),
          types: form.types,
        };
        const { device } = await deviceService.createDevice(payload);
        setDevices((prev) => [...prev, device]);
        toast.success(`${device.name} created.`);
      }
      setModalOpen(false);
      setEditingDevice(null);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Failed to save device.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [form, editingDevice, isAdmin]);

  const handleToggleActive = useCallback(
    async (device: Device) => {
      if (!isAdmin) return;
      setTogglingId(device.id);
      const newActive = !device.isActive;
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, isActive: newActive } : d))
      );

      try {
        const { device: updated } = await deviceService.updateDevice(device.id, {
          isActive: newActive,
        });
        setDevices((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        toast.success(`${device.name} ${newActive ? "enabled" : "disabled"}.`);
      } catch {
        setDevices((prev) =>
          prev.map((d) => (d.id === device.id ? { ...d, isActive: device.isActive } : d))
        );
        toast.error("Failed to toggle device.");
      } finally {
        setTogglingId(null);
      }
    },
    [isAdmin]
  );

  const handleDelete = useCallback(async () => {
    if (!isAdmin || !deleteTarget) return;
    setDeleting(true);
    try {
      await deviceService.deleteDevice(deleteTarget.id);
      setDevices((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      toast.success(`${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete device.");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <PageTransition className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Devices</h1>
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
              ? "Manage registered IoT sensors"
              : "Registered IoT sensors — view only"}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={openCreate}
            className={cn(
              "flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white",
              "bg-accent-blue hover:bg-accent-blue/90 transition-colors duration-150"
            )}
          >
            <Plus size={16} />
            Add Device
          </button>
        )}
      </div>

      {/* Device List */}
      {devices.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="No devices registered"
          description="Add your first IoT device to start collecting data."
        />
      ) : (
        <div className="grid gap-3">
          {devices.map((device) => (
            <GlassCard key={device.id} padding="md">
              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Left: info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-xl shrink-0",
                      device.isActive
                        ? "bg-accent-blue/15 text-accent-blue"
                        : "bg-bg-elevated text-text-muted"
                    )}
                  >
                    <Cpu size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold truncate">
                        {device.name}
                      </h3>
                      <span className="text-xs text-text-muted font-mono">
                        {device.sensorId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-text-secondary">
                        {device.floor.replace(/^floor/i, "Floor ")}
                      </span>
                      <span className="text-text-muted">·</span>
                      {device.types.map((type) => {
                        const cfg = TYPE_LABELS[type];
                        return (
                          <Badge key={type} variant={cfg?.variant ?? "info"}>
                            {cfg?.label ?? type}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right: actions (admin) or status (read-only) */}
                <div className="flex items-center gap-3">
                  {isAdmin ? (
                    <>
                      <Toggle
                        checked={device.isActive}
                        onChange={() => handleToggleActive(device)}
                        disabled={togglingId === device.id}
                        label={`Toggle ${device.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => openEdit(device)}
                        className="p-2 rounded-lg text-text-secondary hover:text-accent-blue hover:bg-accent-blue/10 transition-colors focus-ring"
                        aria-label={`Edit ${device.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(device)}
                        className="p-2 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors focus-ring"
                        aria-label={`Delete ${device.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <Badge variant={device.isActive ? "success" : "danger"}>
                      {device.isActive ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <DeviceFormModal
        open={modalOpen}
        editing={!!editingDevice}
        form={form}
        saving={saving}
        onFieldChange={(key, value) =>
          setForm((prev) => ({ ...prev, [key]: value }))
        }
        onToggleType={handleToggleType}
        onSave={handleSave}
        onCancel={closeModal}
      />

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Device"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageTransition>
  );
}

/* ── Device Form Modal ───────────────────────────────────────── */

interface DeviceFormModalProps {
  open: boolean;
  editing: boolean;
  form: DeviceFormData;
  saving: boolean;
  onFieldChange: (key: keyof DeviceFormData, value: string) => void;
  onToggleType: (type: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function DeviceFormModal({
  open,
  editing,
  form,
  saving,
  onFieldChange,
  onToggleType,
  onSave,
  onCancel,
}: DeviceFormModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onCancel();
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open, saving, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => !saving && onCancel()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl glass border border-glass-border p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-lg font-bold text-text-primary">
          {editing ? "Edit Device" : "Add Device"}
        </h2>

        <div className="mt-4 flex flex-col gap-4">
          {/* Sensor ID */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Sensor ID
            </label>
            <input
              type="text"
              value={form.sensorId}
              onChange={(e) => onFieldChange("sensorId", e.target.value)}
              disabled={editing}
              placeholder="e.g. sensor-07"
              className={cn(
                "w-full h-9 px-3 rounded-lg text-sm bg-bg-elevated border border-glass-border",
                "text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:ring-2 focus:ring-accent-blue/50",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onFieldChange("name", e.target.value)}
              placeholder="e.g. Warehouse Sensor 07"
              className={cn(
                "w-full h-9 px-3 rounded-lg text-sm bg-bg-elevated border border-glass-border",
                "text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
              )}
            />
          </div>

          {/* Floor */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Floor
            </label>
            <input
              type="text"
              value={form.floor}
              onChange={(e) => onFieldChange("floor", e.target.value)}
              placeholder="e.g. floor1"
              className={cn(
                "w-full h-9 px-3 rounded-lg text-sm bg-bg-elevated border border-glass-border",
                "text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
              )}
            />
          </div>

          {/* Sensor Types */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Sensor Types
            </label>
            <div className="flex gap-2 flex-wrap">
              {SENSOR_TYPES.map((type) => {
                const active = form.types.includes(type);
                const cfg = TYPE_LABELS[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onToggleType(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150",
                      active
                        ? "bg-accent-blue/15 border-accent-blue/30 text-accent-blue"
                        : "bg-bg-elevated border-glass-border text-text-muted hover:text-text-secondary"
                    )}
                  >
                    {cfg?.label ?? type}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className={cn(
              "h-9 px-4 rounded-lg text-sm font-medium",
              "text-text-secondary hover:bg-bg-card-hover",
              "transition-colors duration-150 disabled:opacity-50"
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={cn(
              "flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white",
              "bg-accent-blue hover:bg-accent-blue/90",
              "transition-colors duration-150 disabled:opacity-60 disabled:pointer-events-none"
            )}
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {editing ? "Save Changes" : "Create Device"}
          </button>
        </div>
      </div>
    </div>
  );
}
