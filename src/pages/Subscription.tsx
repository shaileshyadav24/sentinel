import { useSubscription } from "../hooks/useSubscription";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { SkeletonCard } from "../components/Skeleton";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";

export default function Subscription() {
  const subscriptionQuery = useSubscription();
  const subscriptions = subscriptionQuery.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Subscription</h1>

      {subscriptionQuery.isLoading && <SkeletonCard />}
      {subscriptionQuery.isError && (
        <ErrorState message="Couldn't load subscription details." onRetry={() => subscriptionQuery.refetch()} />
      )}
      {subscriptionQuery.data && subscriptions.length === 0 && (
        <EmptyState title="No subscription found" description="You don't have an active Ring plan." />
      )}

      {subscriptions.map((sub) => (
        <Card key={sub.id}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{sub.plan_name}</h2>
            <Badge variant={sub.status === "active" ? "success" : "warning"}>{sub.status}</Badge>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {sub.activated_at && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500">Activated</dt>
                <dd className="text-gray-300">{new Date(sub.activated_at).toLocaleDateString()}</dd>
              </div>
            )}
            {sub.expires_at && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500">Expires</dt>
                <dd className="text-gray-300">{new Date(sub.expires_at).toLocaleDateString()}</dd>
              </div>
            )}
          </dl>
        </Card>
      ))}
    </div>
  );
}
