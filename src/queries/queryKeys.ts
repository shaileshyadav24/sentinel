export const queryKeys = {
  devices: ["devices"] as const,
  locations: ["locations"] as const,
  deviceHistory: (deviceId: number | string) => ["deviceHistory", deviceId] as const,
  snapshot: (deviceId: number | string) => ["snapshot", deviceId] as const,
  locationMode: (locationId: string) => ["locationMode", locationId] as const,
  sharedUsers: (locationId: string) => ["sharedUsers", locationId] as const,
};
