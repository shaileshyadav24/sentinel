import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { requestSnapshotUpdate, fetchSnapshotUrl } from "../api/ring";
import { queryKeys } from "./queryKeys";

/**
 * Ring's private API has no browser-friendly live streaming endpoint (real
 * live view uses a SIP/WebRTC signaling flow the mobile apps implement
 * natively). This hook approximates "live view" the way several unofficial
 * Ring dashboards do: request a fresh snapshot, fetch it, repeat on an
 * interval. It's not real-time video, just a periodically refreshed still.
 */
export function useLiveSnapshot(deviceId: number | string | undefined, pollingMs: number) {
  const previousUrl = useRef<string | null>(null);

  const query = useQuery({
    queryKey: deviceId ? queryKeys.snapshot(deviceId) : ["snapshot", "none"],
    queryFn: async () => {
      await requestSnapshotUpdate([deviceId!]);
      return fetchSnapshotUrl(deviceId!);
    },
    enabled: deviceId != null,
    refetchInterval: pollingMs,
    gcTime: 0,
  });

  useEffect(() => {
    if (query.data && query.data !== previousUrl.current) {
      if (previousUrl.current) URL.revokeObjectURL(previousUrl.current);
      previousUrl.current = query.data;
    }
  }, [query.data]);

  useEffect(() => {
    return () => {
      if (previousUrl.current) URL.revokeObjectURL(previousUrl.current);
    };
  }, []);

  return query;
}
