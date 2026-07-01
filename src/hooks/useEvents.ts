import { useQuery } from "@tanstack/react-query";
import { fetchAllEvents, fetchDeviceEvents } from "../api/events";
import type { Device } from "../types/ring";

export function useAllEvents(devices: Device[] | undefined) {
  return useQuery({
    queryKey: ["events", "all", devices?.map((d) => d.id)],
    queryFn: () => fetchAllEvents(devices ?? []),
    enabled: !!devices && devices.length > 0,
    refetchInterval: 60 * 1000,
  });
}

export function useDeviceEvents(deviceId: string | undefined) {
  return useQuery({
    queryKey: ["events", "device", deviceId],
    queryFn: () => fetchDeviceEvents(deviceId as string),
    enabled: !!deviceId,
  });
}
