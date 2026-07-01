import type { Device } from "../types/ring";
import { Badge } from "./Badge";
import { BatteryIndicator } from "./BatteryIndicator";
import { Card } from "./Card";
import { formatRelativeTime } from "../utils/dateFormatter";

const DEVICE_ICONS: Record<string, string> = {
  doorbell: "🔔",
  camera: "📷",
  chime: "🔊",
  base_station: "📡",
  alarm: "🚨",
};

export function DeviceCard({ device, onClick }: { device: Device; onClick: () => void }) {
  const capabilities = Object.entries(device.capabilities ?? {}).filter(([, enabled]) => enabled);
  const lastSeen = device.status?.last_seen ?? device.last_seen;

  return (
    <button onClick={onClick} className="text-left">
      <Card className="flex h-full flex-col gap-3 transition-colors hover:border-accent">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-lg">{DEVICE_ICONS[device.device_type] ?? "📶"}</div>
            <h3 className="font-semibold text-white">{device.name}</h3>
            <p className="text-xs capitalize text-gray-400">{device.device_type.replace(/_/g, " ")}</p>
          </div>
          <Badge variant={device.status?.online ? "success" : "error"}>
            {device.status?.online ? "Online" : "Offline"}
          </Badge>
        </div>

        <BatteryIndicator level={device.status?.battery_level} />

        {(device.location?.state || device.location?.country) && (
          <p className="text-xs text-gray-400">
            {[device.location?.state, device.location?.country].filter(Boolean).join(", ")}
          </p>
        )}

        {capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {capabilities.slice(0, 4).map(([key]) => (
              <span key={key} className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-gray-400">
                {key.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        {lastSeen && <p className="mt-auto text-[11px] text-gray-500">Last seen {formatRelativeTime(lastSeen)}</p>}
      </Card>
    </button>
  );
}
