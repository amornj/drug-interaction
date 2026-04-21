import type { InteractionSeverity } from "@/lib/interactions";

const styles: Record<InteractionSeverity, string> = {
  Contraindicated:
    "bg-red-600/15 text-red-200 border-red-500/40 dark:bg-red-500/20 dark:text-red-100 dark:border-red-400/30",
  Major:
    "bg-orange-500/15 text-orange-800 border-orange-500/40 dark:bg-orange-500/20 dark:text-orange-100 dark:border-orange-400/30",
  Moderate:
    "bg-amber-500/15 text-amber-800 border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-400/30",
  Minor:
    "bg-yellow-400/20 text-yellow-900 border-yellow-500/30 dark:bg-yellow-400/15 dark:text-yellow-100 dark:border-yellow-400/25",
};

export function SeverityBadge({
  severity,
  pulse = false,
}: {
  severity: InteractionSeverity;
  pulse?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex min-h-7 items-center rounded-full border px-2.5 text-[11px] font-semibold uppercase tracking-wide",
        styles[severity],
        pulse ? "animate-pulse" : "",
      ].join(" ")}
    >
      {severity}
    </span>
  );
}
