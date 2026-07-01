import { useQuery } from "@tanstack/react-query";
import { fetchDevices, fetchLocations } from "../api/ring";
import { queryKeys } from "./queryKeys";

export function useDevices() {
  return useQuery({
    queryKey: queryKeys.devices,
    queryFn: fetchDevices,
    refetchInterval: 30_000,
  });
}

export function useLocations() {
  return useQuery({
    queryKey: queryKeys.locations,
    queryFn: fetchLocations,
    staleTime: 5 * 60_000,
  });
}
