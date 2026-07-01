import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthForm } from "../components/AuthForm";

export default function Landing() {
  const { isAuthenticated, isLoading, setAuthenticatedEmail } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-3xl">🔔</div>
      <h1 className="mb-2 text-2xl font-bold text-white">RingBoard</h1>
      <p className="mb-8 max-w-sm text-sm text-gray-400">
        Monitor your Ring devices, subscription, and activity in one dashboard.
      </p>

      <AuthForm onAuthenticated={setAuthenticatedEmail} />

      <p className="mt-6 max-w-sm text-xs text-gray-600">
        Haven't linked your Ring account yet? Find RingBoard in the Ring App to get started.
      </p>
    </div>
  );
}
