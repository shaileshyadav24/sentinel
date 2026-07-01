import { Card } from "./Card";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-raised ${className}`} />;
}

export function SkeletonCard() {
  return (
    <Card>
      <Skeleton className="mb-3 h-5 w-2/3" />
      <Skeleton className="mb-2 h-3 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
    </Card>
  );
}
