import { ringClient } from "./ringClient";
import * as endpoints from "./ringEndpoints";
import type {
  RingDevice,
  RingDeviceKind,
  RingDevicesResponse,
  RingHistoryEvent,
  RingLocation,
  RingLocationMode,
  RingAlarmMode,
  RingSharedUser,
} from "../types/ring";

const DEVICE_CATEGORIES: RingDeviceKind[] = [
  "authorized_doorbots",
  "doorbots",
  "stickup_cams",
  "chimes",
  "base_stations",
  "other",
];

export async function fetchDevices(): Promise<RingDevice[]> {
  const { data } = await ringClient.get<RingDevicesResponse>(endpoints.RING_DEVICES);
  const flattened: RingDevice[] = [];
  for (const category of DEVICE_CATEGORIES) {
    for (const device of data[category] ?? []) {
      flattened.push({ ...device, category });
    }
  }
  // authorized_doorbots duplicates doorbots you don't own but can access; dedupe by id
  const seen = new Set<number>();
  return flattened.filter((d) => (seen.has(d.id) ? false : (seen.add(d.id), true)));
}

export async function fetchLocations(): Promise<RingLocation[]> {
  const { data } = await ringClient.get(endpoints.LOCATIONS);
  return data.user_locations ?? data.locations ?? [];
}

export async function fetchDeviceHistory(
  deviceId: number | string,
  limit = 25,
): Promise<RingHistoryEvent[]> {
  const { data } = await ringClient.get<RingHistoryEvent[]>(endpoints.deviceHistory(deviceId), {
    params: { limit },
  });
  return data;
}

export async function requestSnapshotUpdate(deviceIds: (number | string)[]): Promise<void> {
  await ringClient.post(endpoints.snapshotUpdateAll, { doorbot_ids: deviceIds });
}

export async function fetchSnapshotUrl(deviceId: number | string): Promise<string> {
  const { data } = await ringClient.get(endpoints.snapshotImage(deviceId), {
    responseType: "blob",
  });
  return URL.createObjectURL(data as Blob);
}

export async function setFloodlight(deviceId: number | string, on: boolean): Promise<void> {
  await ringClient.put(on ? endpoints.floodlightOn(deviceId) : endpoints.floodlightOff(deviceId));
}

export async function setSiren(deviceId: number | string, on: boolean): Promise<void> {
  await ringClient.post(on ? endpoints.sirenOn(deviceId) : endpoints.sirenOff(deviceId));
}

export async function updateDeviceSettings(
  deviceId: number | string,
  settings: Record<string, unknown>,
): Promise<void> {
  await ringClient.put(endpoints.deviceSettings(deviceId), { doorbot: { settings } });
}

export async function playChimeSound(
  chimeId: number | string,
  kind: "ding" | "motion" = "ding",
): Promise<void> {
  await ringClient.post(endpoints.chimePlaySound(chimeId), { kind });
}

export async function updateChimeVolume(chimeId: number | string, volume: number): Promise<void> {
  await ringClient.put(endpoints.chimeUpdate(chimeId), { chime: { settings: { volume } } });
}

export async function fetchLocationMode(locationId: string): Promise<RingLocationMode> {
  const { data } = await ringClient.get<RingLocationMode>(endpoints.locationMode(locationId));
  return data;
}

export async function setLocationMode(locationId: string, mode: RingAlarmMode): Promise<void> {
  await ringClient.post(endpoints.locationMode(locationId), { mode });
}

export async function fetchSharedUsers(locationId: string): Promise<RingSharedUser[]> {
  const { data } = await ringClient.get(endpoints.sharedUsers(locationId));
  return data.users ?? data;
}

export async function inviteSharedUser(locationId: string, email: string): Promise<void> {
  await ringClient.post(endpoints.sharedUserInvite(locationId), { invitation: { invited_email: email } });
}

export async function removeSharedUser(locationId: string, userId: number | string): Promise<void> {
  await ringClient.delete(endpoints.sharedUserRemove(locationId, userId));
}
