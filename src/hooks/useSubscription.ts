import { useQuery } from "@tanstack/react-query";
import { fetchSubscriptions } from "../api/subscriptions";

export function useSubscription() {
  return useQuery({
    queryKey: ["subscriptions"],
    queryFn: fetchSubscriptions,
  });
}
