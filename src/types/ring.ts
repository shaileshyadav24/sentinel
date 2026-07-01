export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  /** epoch ms this access_token was issued, used to know when to refresh */
  obtainedAt: number;
}

export interface JsonApiResource<TAttrs = Record<string, unknown>> {
  id: string;
  type: string;
  attributes: TAttrs;
}

export interface JsonApiDocument<TAttrs = Record<string, unknown>> {
  data: JsonApiResource<TAttrs> | JsonApiResource<TAttrs>[];
  included?: JsonApiResource[];
}

export interface RingUser {
  name: string;
  email: string;
}

export type DeviceType = "doorbell" | "camera" | "chime" | "base_station" | "alarm" | string;

export interface DeviceStatus {
  online: boolean;
  battery_level?: number | null;
  last_seen?: string;
}

export type DeviceCapabilities = Record<string, boolean>;

export interface DeviceLocation {
  country?: string;
  state?: string;
}

export type DeviceConfigurations = Record<string, unknown>;

export interface Device {
  id: string;
  name: string;
  device_type: DeviceType;
  status?: DeviceStatus;
  capabilities?: DeviceCapabilities;
  location?: DeviceLocation;
  configurations?: DeviceConfigurations;
  last_seen?: string;
}

export type EventType =
  | "motion_detected"
  | "button_press"
  | "device_online"
  | "device_offline"
  | "device_added"
  | "device_removed";

export interface DeviceEvent {
  id: string;
  device_id: string;
  event_type: EventType | string;
  timestamp: string;
}

export interface Subscription {
  id: string;
  plan_name: string;
  status: "active" | "expired" | "canceled" | string;
  activated_at?: string;
  expires_at?: string;
}
