import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useDevices } from "../hooks/useDevices";
import { useAuth } from "../hooks/useAuth";
import { Card } from "../components/Card";
import { SkeletonCard } from "../components/Skeleton";
import { ErrorState } from "../components/ErrorState";

const APP_VERSION = "0.1.0";

export default function Settings() {
  const userQuery = useCurrentUser();
  const devicesQuery = useDevices();
  const { disconnect } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold text-white">Settings</h1>

      <Card>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Ring account</h2>
        {userQuery.isLoading && <SkeletonCard />}
        {userQuery.isError && (
          <ErrorState message="Couldn't load account info." onRetry={() => userQuery.refetch()} />
        )}
        {userQuery.data && (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Name</dt>
              <dd className="text-gray-200">{userQuery.data.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-200">{userQuery.data.email}</dd>
            </div>
          </dl>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Connected devices</h2>
        <p className="text-2xl font-bold text-white">{devicesQuery.data?.length ?? "—"}</p>
      </Card>

      <Card>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Account link</h2>
        <p className="mb-3 text-sm text-gray-400">
          Disconnecting removes your Ring tokens from this browser. You can reconnect at any time.
        </p>
        <button
          onClick={() => {
            disconnect();
            navigate("/", { replace: true });
          }}
          className="rounded-md bg-error px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Disconnect Ring Account
        </button>
      </Card>

      <p className="text-xs text-gray-600">RingBoard v{APP_VERSION}</p>
    </div>
  );
}
