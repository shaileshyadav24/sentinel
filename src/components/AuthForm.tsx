import { useState, type FormEvent } from "react";
import { AuthError, login, signup } from "../api/auth";

interface AuthFormProps {
  onAuthenticated: (email: string) => void;
  submitLabel?: { login: string; signup: string };
}

export function AuthForm({ onAuthenticated, submitLabel }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const signedInEmail = mode === "login" ? await login(email, password) : await signup(email, password);
      onAuthenticated(signedInEmail);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3 text-left">
      <input
        type="email"
        required
        autoComplete="username"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-accent focus:outline-none"
      />
      <input
        type="password"
        required
        minLength={mode === "signup" ? 8 : undefined}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-accent focus:outline-none"
      />

      {error && <p className="text-sm text-error">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {submitting
          ? "Please wait…"
          : mode === "login"
            ? (submitLabel?.login ?? "Sign in")
            : (submitLabel?.signup ?? "Create account")}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setError(null);
        }}
        className="w-full text-center text-xs text-gray-500 hover:text-gray-300"
      >
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
