export interface RingOAuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  /** epoch ms this access_token was issued, used to know when to refresh */
  obtainedAt: number;
}

export interface RingTwoFactorChallenge {
  /** the phone/email prompt info Ring returns alongside the 412 */
  phone?: string;
  message?: string;
}

export interface RingProfile {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
}

export type RingDeviceKind =
  | "doorbots"
  | "authorized_doorbots"
  | "stickup_cams"
  | "chimes"
  | "base_stations"
  | "other";

export interface RingHealth {
  battery_percentage?: number | null;
  battery_percentage_category?: string | null;
  wifi_name?: string | null;
  wifi_signal_strength?: number | null;
  wifi_signal_category?: string | null;
  firmware?: string | null;
}

export interface RingSettings {
  motion_zones?: unknown;
  motion_snooze_preset_profile?: string;
  doorbell_volume?: number;
  chime_settings?: { volume?: number };
  [key: string]: unknown;
}

export interface RingDevice {
  id: number;
  description: string;
  device_id: string;
  kind: string;
  location_id: string;
  time_zone?: string;
  subscribed?: boolean;
  battery_life?: string | null;
  external_connection?: boolean;
  firmware_version?: string;
  led_status?: string;
  siren_status?: { seconds_remaining: number } | null;
  settings?: RingSettings;
  health?: RingHealth;
  /** which array this device came from in /ring_devices, used for routing UI */
  category: RingDeviceKind;
  features?: {
    motion_zones_enabled?: boolean;
    show_recordings?: boolean;
    floodlight_light_on_supported?: boolean;
    siren_supported?: boolean;
  };
}

export interface RingDevicesResponse {
  doorbots: RingDevice[];
  authorized_doorbots: RingDevice[];
  stickup_cams: RingDevice[];
  chimes: RingDevice[];
  base_stations: RingDevice[];
  other: RingDevice[];
}

export interface RingHistoryEvent {
  id: number;
  created_at: string;
  kind: "motion" | "ding" | "on_demand" | string;
  favorite: boolean;
  answered: boolean;
  duration?: number;
  doorbot: { id: number; description: string };
  recording?: { status: string };
  recording_url?: string;
}

export interface RingLocation {
  location_id: string;
  name: string;
  geo_coordinates?: { latitude: number; longitude: number };
}

export type RingAlarmMode = "disarmed" | "home" | "away";

export interface RingLocationMode {
  mode: RingAlarmMode;
  readOnly?: boolean;
}

export interface RingSharedUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  status: "accepted" | "pending" | "invited";
  role?: string;
}
