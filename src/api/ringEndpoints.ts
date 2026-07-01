// Centralized paths for Ring's private API, reached through /api/ring/* (see
// api/_ringProxyHandler.js). These are reverse-engineered by the community
// (ring-client-api, python-ring-doorbell) rather than officially documented,
// since Ring does not publish a public developer API. The auth/devices/
// history/snapshot endpoints are well-established and used by thousands of
// installs of those libraries. The settings/shared-users/alarm-mode paths
// are lower-traffic and more likely to drift across Ring app/API versions -
// if any of them 404 for your account, this is the one file to fix.

export const OAUTH_TOKEN = "/api/ring/oauth/token";

export const SESSION = "/api/ring/api/clients_api/session";
export const RING_DEVICES = "/api/ring/api/clients_api/ring_devices";
export const LOCATIONS = "/api/ring/api/clients_api/locations";

export const deviceHistory = (deviceId: number | string) =>
  `/api/ring/api/clients_api/doorbots/${deviceId}/history`;

export const snapshotImage = (deviceId: number | string) =>
  `/api/ring/api/clients_api/snapshots/image/${deviceId}`;
export const snapshotUpdateAll = "/api/ring/api/clients_api/snapshots/update_all";
export const snapshotTimestamps = "/api/ring/api/clients_api/snapshots/timestamps";

export const recordingDownload = (dingId: number | string) =>
  `/api/ring/api/clients_api/dings/${dingId}/share/download`;

export const floodlightOn = (deviceId: number | string) =>
  `/api/ring/api/clients_api/doorbots/${deviceId}/floodlight_light_on`;
export const floodlightOff = (deviceId: number | string) =>
  `/api/ring/api/clients_api/doorbots/${deviceId}/floodlight_light_off`;
export const sirenOn = (deviceId: number | string) =>
  `/api/ring/api/clients_api/doorbots/${deviceId}/siren_on`;
export const sirenOff = (deviceId: number | string) =>
  `/api/ring/api/clients_api/doorbots/${deviceId}/siren_off`;

export const deviceSettings = (deviceId: number | string) =>
  `/api/ring/api/clients_api/doorbots/${deviceId}`;

export const chimePlaySound = (chimeId: number | string) =>
  `/api/ring/api/clients_api/chimes/${chimeId}/play_sound`;
export const chimeUpdate = (chimeId: number | string) =>
  `/api/ring/api/clients_api/chimes/${chimeId}`;

export const locationMode = (locationId: string) => `/api/ring/app/v1/mode/location/${locationId}`;

export const sharedUsers = (locationId: string) =>
  `/api/ring/api/clients_api/locations/${locationId}/users`;
export const sharedUserInvite = (locationId: string) =>
  `/api/ring/api/clients_api/locations/${locationId}/users/invitations`;
export const sharedUserRemove = (locationId: string, userId: number | string) =>
  `/api/ring/api/clients_api/locations/${locationId}/users/${userId}`;
