import { ringClient } from "./ringClient";
import type { RingUser } from "../types/ring";

export async function fetchCurrentUser(): Promise<RingUser> {
  const { data } = await ringClient.get<RingUser>("/v1/users/me");
  return data;
}
