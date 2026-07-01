export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-error/30 bg-error/10 p-6 text-center">
      <p className="text-sm text-red-300">{message ?? "Something went wrong loading this data."}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md bg-error px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      )}
    </div>
  );
}
