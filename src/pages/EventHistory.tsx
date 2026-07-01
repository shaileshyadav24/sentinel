import { useMemo, useState } from "react";
import { useDevices } from "../hooks/useDevices";
import { useAllEvents } from "../hooks/useEvents";
import { EventRow } from "../components/EventRow";
import { SkeletonCard } from "../components/Skeleton";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import type { EventType } from "../types/ring";

const EVENT_TYPES: EventType[] = [
  "motion_detected",
  "button_press",
  "device_online",
  "device_offline",
  "device_added",
  "device_removed",
];

const PAGE_SIZE = 20;

export default function EventHistory() {
  const devicesQuery = useDevices();
  const eventsQuery = useAllEvents(devicesQuery.data);
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const devices = devicesQuery.data ?? [];
  const deviceById = new Map(devices.map((d) => [d.id, d]));

  const filteredEvents = useMemo(() => {
    return (eventsQuery.data ?? []).filter((event) => {
      if (deviceFilter !== "all" && event.device_id !== deviceFilter) return false;
      if (typeFilter !== "all" && event.event_type !== typeFilter) return false;
      return true;
    });
  }, [eventsQuery.data, deviceFilter, typeFilter]);

  const visibleEvents = filteredEvents.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Event History</h1>

      <div className="flex flex-wrap gap-3">
        <select
          value={deviceFilter}
          onChange={(e) => {
            setDeviceFilter(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-gray-200"
        >
          <option value="all">All devices</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-gray-200"
        >
          <option value="all">All event types</option>
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {(devicesQuery.isLoading || eventsQuery.isLoading) && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {eventsQuery.isError && (
        <ErrorState message="Couldn't load event history." onRetry={() => eventsQuery.refetch()} />
      )}

      {eventsQuery.data && filteredEvents.length === 0 && (
        <EmptyState title="No events found" description="Try a different filter, or check back later." />
      )}

      {visibleEvents.length > 0 && (
        <div className="space-y-2">
          {visibleEvents.map((event) => (
            <EventRow key={event.id} event={event} device={deviceById.get(event.device_id)} />
          ))}
        </div>
      )}

      {visibleCount < filteredEvents.length && (
        <div className="flex justify-center">
          <button
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="rounded-md border border-border px-4 py-2 text-sm text-gray-300 hover:bg-surface-raised"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
