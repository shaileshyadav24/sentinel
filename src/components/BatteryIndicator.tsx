export function BatteryIndicator({ level }: { level: number | null | undefined }) {
  if (level == null) {
    return <span className="text-xs text-gray-500">Battery unknown</span>;
  }

  const colorClass = level >= 50 ? "text-green-400" : level >= 20 ? "text-amber-400" : "text-red-400";
  const dotClass = level >= 50 ? "bg-success" : level >= 20 ? "bg-warning" : "bg-error";

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${colorClass}`}>
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {level}% battery
    </span>
  );
}
