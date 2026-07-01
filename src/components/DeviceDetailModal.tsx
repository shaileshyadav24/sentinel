import { useDeviceConfigurations } from "../hooks/useDevices";
import { useDeviceEvents } from "../hooks/useEvents";
import type { Device } from "../types/ring";
import { Badge } from "./Badge";
import { BatteryIndicator } from "./BatteryIndicator";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { Skeleton } from "./Skeleton";
import { formatDateTime } from "../utils/dateFormatter";

const EVENT_LABELS: Record<string, string> = {
  motion_detected: "Motion detected",
  button_press: "Button pressed",
  device_online: "Device online",
  device_offline: "Device offline",
  device_added: "Device added",
  device_removed: "Device removed",
};

export function DeviceDetailModal({ device, onClose }: { device: Device; onClose: () => void }) {
  const configQuery = useDeviceConfigurations(device.id);
  const eventsQuery = useDeviceEvents(device.id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{device.name}</h2>
            <p className="text-xs capitalize text-gray-400">{device.device_type.replace(/_/g, " ")}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
            ✕
          </button>
        </div>

        <section className="mb-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</h3>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-raised p-3">
            <Badge variant={device.status?.online ? "success" : "error"}>
              {device.status?.online ? "Online" : "Offline"}
            </Badge>
            <BatteryIndicator level={device.status?.battery_level} />
            {device.status?.last_seen && (
              <span className="text-xs text-gray-400">Last seen {formatDateTime(device.status.last_seen)}</span>
            )}
          </div>
        </section>

        <section className="mb-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Capabilities</h3>
          {Object.keys(device.capabilities ?? {}).length === 0 ? (
            <p className="text-xs text-gray-500">No capability data available.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(device.capabilities ?? {}).map(([key, enabled]) => (
                <span
                  key={key}
                  className={`rounded px-2 py-1 text-[11px] ${
                    enabled ? "bg-accent/15 text-blue-300" : "bg-surface-raised text-gray-500 line-through"
                  }`}
                >
                  {key.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="mb-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Configuration</h3>
          {configQuery.isLoading && <Skeleton className="h-16 w-full" />}
          {configQuery.isError && (
            <ErrorState message="Couldn't load configuration." onRetry={() => configQuery.refetch()} />
          )}
          {configQuery.data && Object.keys(configQuery.data).length === 0 && (
            <p className="text-xs text-gray-500">No configuration data available.</p>
          )}
          {configQuery.data && Object.keys(configQuery.data).length > 0 && (
            <dl className="space-y-1 rounded-lg border border-border bg-surface-raised p-3 text-xs">
              {Object.entries(configQuery.data).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4">
                  <dt className="text-gray-500">{key.replace(/_/g, " ")}</dt>
                  <dd className="text-right text-gray-300">{String(value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Event history</h3>
          {eventsQuery.isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {eventsQuery.isError && (
            <ErrorState message="Couldn't load events." onRetry={() => eventsQuery.refetch()} />
          )}
          {eventsQuery.data && eventsQuery.data.length === 0 && (
            <EmptyState title="No events yet" description="Events for this device will show up here." />
          )}
          {eventsQuery.data && eventsQuery.data.length > 0 && (
            <div className="space-y-2">
              {eventsQuery.data.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface-raised px-3 py-2"
                >
                  <Badge variant="accent">{EVENT_LABELS[event.event_type] ?? event.event_type}</Badge>
                  <span className="text-xs text-gray-500">{formatDateTime(event.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
