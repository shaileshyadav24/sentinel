import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthForm } from "../components/AuthForm";
import { claimRingLink } from "../api/auth";
import { ErrorState } from "../components/ErrorState";

export default function RingLink() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthenticatedEmail } = useAuth();
  const [status, setStatus] = useState<"form" | "linking" | "error">("form");
  const [error, setError] = useState<string | null>(null);

  const nonce = searchParams.get("nonce");
  const time = searchParams.get("time");

  async function handleAuthenticated(email: string) {
    setAuthenticatedEmail(email);

    if (!nonce || !time) {
      setError("This link is missing required parameters. Try linking again from the Ring App.");
      setStatus("error");
      return;
    }

    setStatus("linking");
    try {
      await claimRingLink(nonce, time);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link your Ring account.");
      setStatus("error");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-3xl">🔔</div>
      <h1 className="mb-2 text-2xl font-bold text-white">Link your Ring account</h1>
      <p className="mb-8 max-w-sm text-sm text-gray-400">
        Sign in or create a RingBoard account to finish connecting your Ring account.
      </p>

      {status === "form" && <AuthForm onAuthenticated={handleAuthenticated} />}
      {status === "linking" && <p className="text-sm text-gray-400">Linking your Ring account…</p>}
      {status === "error" && (
        <div className="w-full max-w-sm">
          <ErrorState message={error ?? "Something went wrong."} onRetry={() => setStatus("form")} />
        </div>
      )}
    </div>
  );
}
