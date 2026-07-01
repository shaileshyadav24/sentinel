import { useCurrentUser } from "../hooks/useCurrentUser";
import { useDevices } from "../hooks/useDevices";
import { useSubscription } from "../hooks/useSubscription";
import { useAllEvents } from "../hooks/useEvents";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { SkeletonCard } from "../components/Skeleton";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { EventRow } from "../components/EventRow";

export default function Dashboard() {
  const userQuery = useCurrentUser();
  const devicesQuery = useDevices();
  const subscriptionQuery = useSubscription();
  const eventsQuery = useAllEvents(devicesQuery.data);

  const devices = devicesQuery.data ?? [];
  const onlineCount = devices.filter((d) => d.status?.online).length;
  const offlineCount = devices.length - onlineCount;

  const countsByType = devices.reduce<Record<string, number>>((acc, device) => {
    acc[device.device_type] = (acc[device.device_type] ?? 0) + 1;
    return acc;
  }, {});

  const subscription = subscriptionQuery.data?.[0];
  const recentEvents = (eventsQuery.data ?? []).slice(0, 10);
  const deviceById = new Map(devices.map((d) => [d.id, d]));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Account</h2>
          {userQuery.isLoading && <SkeletonCard />}
          {userQuery.isError && <ErrorState message="Couldn't load profile." onRetry={() => userQuery.refetch()} />}
          {userQuery.data && (
            <div>
              <p className="font-medium text-white">{userQuery.data.name}</p>
              <p className="text-sm text-gray-400">{userQuery.data.email}</p>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Devices</h2>
          {devicesQuery.isLoading && <SkeletonCard />}
          {devicesQuery.isError && (
            <ErrorState message="Couldn't load devices." onRetry={() => devicesQuery.refetch()} />
          )}
          {devicesQuery.data && (
            <div>
              <p className="text-2xl font-bold text-white">{devices.length}</p>
              <div className="mt-2 flex gap-2 text-xs">
                <Badge variant="success">{onlineCount} online</Badge>
                <Badge variant="error">{offlineCount} offline</Badge>
              </div>
              <div className="mt-3 space-y-1 text-xs text-gray-400">
                {Object.entries(countsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between capitalize">
                    <span>{type.replace(/_/g, " ")}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Subscription</h2>
          {subscriptionQuery.isLoading && <SkeletonCard />}
          {subscriptionQuery.isError && (
            <ErrorState message="Couldn't load subscription." onRetry={() => subscriptionQuery.refetch()} />
          )}
          {subscriptionQuery.data && !subscription && <p className="text-sm text-gray-500">No active subscription.</p>}
          {subscription && (
            <div>
              <Badge variant={subscription.status === "active" ? "success" : "warning"}>
                {subscription.plan_name}
              </Badge>
              <p className="mt-2 text-xs capitalize text-gray-400">Status: {subscription.status}</p>
              {subscription.expires_at && (
                <p className="text-xs text-gray-400">
                  Expires {new Date(subscription.expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-white">Recent activity</h2>
        {eventsQuery.isLoading && <SkeletonCard />}
        {eventsQuery.isError && (
          <ErrorState message="Couldn't load recent events." onRetry={() => eventsQuery.refetch()} />
        )}
        {eventsQuery.data && recentEvents.length === 0 && (
          <EmptyState title="No recent activity" description="Events from your devices will appear here." />
        )}
        {recentEvents.length > 0 && (
          <div className="space-y-2">
            {recentEvents.map((event) => (
              <EventRow key={event.id} event={event} device={deviceById.get(event.device_id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
