import { useState } from "react";
import { useDevices } from "../hooks/useDevices";
import { DeviceCard } from "../components/DeviceCard";
import { DeviceDetailModal } from "../components/DeviceDetailModal";
import { SkeletonCard } from "../components/Skeleton";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import type { Device } from "../types/ring";

export default function Devices() {
  const devicesQuery = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Devices</h1>

      {devicesQuery.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {devicesQuery.isError && <ErrorState message="Couldn't load devices." onRetry={() => devicesQuery.refetch()} />}

      {devicesQuery.data && devicesQuery.data.length === 0 && (
        <EmptyState title="No devices found" description="Devices linked to your Ring account will show up here." />
      )}

      {devicesQuery.data && devicesQuery.data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devicesQuery.data.map((device) => (
            <DeviceCard key={device.id} device={device} onClick={() => setSelectedDevice(device)} />
          ))}
        </div>
      )}

      {selectedDevice && <DeviceDetailModal device={selectedDevice} onClose={() => setSelectedDevice(null)} />}
    </div>
  );
}
