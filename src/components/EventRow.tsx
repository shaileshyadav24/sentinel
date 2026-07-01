import type { Device, DeviceEvent } from "../types/ring";
import { Badge, type BadgeVariant } from "./Badge";
import { formatDateTime } from "../utils/dateFormatter";

const EVENT_META: Record<string, { label: string; variant: BadgeVariant }> = {
  motion_detected: { label: "Motion detected", variant: "warning" },
  button_press: { label: "Button pressed", variant: "accent" },
  device_online: { label: "Device online", variant: "success" },
  device_offline: { label: "Device offline", variant: "error" },
  device_added: { label: "Device added", variant: "accent" },
  device_removed: { label: "Device removed", variant: "neutral" },
};

const DEVICE_ICONS: Record<string, string> = {
  doorbell: "🔔",
  camera: "📷",
  chime: "🔊",
  base_station: "📡",
  alarm: "🚨",
};

export function EventRow({ event, device }: { event: DeviceEvent; device: Device | undefined }) {
  const meta = EVENT_META[event.event_type] ?? { label: event.event_type, variant: "neutral" as const };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <span className="text-lg">{DEVICE_ICONS[device?.device_type ?? ""] ?? "📶"}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{device?.name ?? "Unknown device"}</p>
        <p className="text-xs text-gray-500">{formatDateTime(event.timestamp)}</p>
      </div>
      <Badge variant={meta.variant}>{meta.label}</Badge>
    </div>
  );
}
