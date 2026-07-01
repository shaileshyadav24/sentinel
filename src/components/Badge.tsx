import type { ReactNode } from "react";

export type BadgeVariant = "success" | "warning" | "error" | "accent" | "neutral";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: "bg-success/15 text-green-400 ring-1 ring-inset ring-success/30",
  warning: "bg-warning/15 text-amber-400 ring-1 ring-inset ring-warning/30",
  error: "bg-error/15 text-red-400 ring-1 ring-inset ring-error/30",
  accent: "bg-accent/15 text-blue-400 ring-1 ring-inset ring-accent/30",
  neutral: "bg-gray-500/15 text-gray-400 ring-1 ring-inset ring-gray-500/30",
};

export function Badge({ children, variant = "neutral" }: { children: ReactNode; variant?: BadgeVariant }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </span>
  );
}
