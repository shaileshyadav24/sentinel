import { ringClient } from "./ringClient";
import type { Subscription } from "../types/ring";

export async function fetchSubscriptions(): Promise<Subscription[]> {
  const { data } = await ringClient.get<Subscription[]>("/v1/accounts/me/subscriptions");
  return data;
}
