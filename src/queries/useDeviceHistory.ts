import { useQuery } from "@tanstack/react-query";
import { fetchDeviceHistory } from "../api/ring";
import { queryKeys } from "./queryKeys";

export function useDeviceHistory(deviceId: number | string | undefined, limit = 25) {
  return useQuery({
    queryKey: deviceId ? queryKeys.deviceHistory(deviceId) : ["deviceHistory", "none"],
    queryFn: () => fetchDeviceHistory(deviceId!, limit),
    enabled: deviceId != null,
    refetchInterval: 60_000,
  });
}
