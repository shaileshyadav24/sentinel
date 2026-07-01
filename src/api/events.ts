import { ringClient } from "./ringClient";
import type { Device, DeviceEvent } from "../types/ring";

export async function fetchDeviceEvents(deviceId: string, limit = 50): Promise<DeviceEvent[]> {
  const { data } = await ringClient.get<DeviceEvent[]>(`/v1/history/devices/${deviceId}/events`, {
    params: { limit },
  });
  return data;
}

/** Fetches events for every device and merges them into one timestamp-sorted feed. */
export async function fetchAllEvents(devices: Device[], limitPerDevice = 50): Promise<DeviceEvent[]> {
  const results = await Promise.all(
    devices.map((device) => fetchDeviceEvents(device.id, limitPerDevice).catch(() => [] as DeviceEvent[])),
  );
  return results.flat().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
