import { useQuery } from "@tanstack/react-query";
import { fetchDevice, fetchDeviceConfigurations, fetchDevices } from "../api/devices";

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: fetchDevices,
    refetchInterval: 30 * 1000,
  });
}

export function useDevice(deviceId: string | undefined) {
  return useQuery({
    queryKey: ["devices", deviceId],
    queryFn: () => fetchDevice(deviceId as string),
    enabled: !!deviceId,
    refetchInterval: 30 * 1000,
  });
}

export function useDeviceConfigurations(deviceId: string | undefined) {
  return useQuery({
    queryKey: ["devices", deviceId, "configurations"],
    queryFn: () => fetchDeviceConfigurations(deviceId as string),
    enabled: !!deviceId,
  });
}
