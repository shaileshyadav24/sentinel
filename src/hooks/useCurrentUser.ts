import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "../api/users";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: fetchCurrentUser,
  });
}
