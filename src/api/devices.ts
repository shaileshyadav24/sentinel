import { ringClient } from "./ringClient";
import type {
  Device,
  DeviceCapabilities,
  DeviceConfigurations,
  DeviceLocation,
  DeviceStatus,
} from "../types/ring";

export async function fetchDevices(): Promise<Device[]> {
  const { data } = await ringClient.get<Device[]>("/v1/devices", {
    params: { include: "status,capabilities,location,configurations" },
  });
  return data;
}

export async function fetchDevice(deviceId: string): Promise<Device> {
  const { data } = await ringClient.get<Device>(`/v1/devices/${deviceId}`);
  return data;
}

export async function fetchDeviceStatus(deviceId: string): Promise<DeviceStatus> {
  const { data } = await ringClient.get<DeviceStatus>(`/v1/devices/${deviceId}/status`);
  return data;
}

export async function fetchDeviceCapabilities(deviceId: string): Promise<DeviceCapabilities> {
  const { data } = await ringClient.get<DeviceCapabilities>(`/v1/devices/${deviceId}/capabilities`);
  return data;
}

export async function fetchDeviceLocation(deviceId: string): Promise<DeviceLocation> {
  const { data } = await ringClient.get<DeviceLocation>(`/v1/devices/${deviceId}/location`);
  return data;
}

export async function fetchDeviceConfigurations(deviceId: string): Promise<DeviceConfigurations> {
  const { data } = await ringClient.get<DeviceConfigurations>(
    `/v1/devices/${deviceId}/configurations`,
  );
  return data;
}
