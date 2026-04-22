"use client";

import type { InteractionSeverity } from "@/lib/interactions";
import type { ModifiedInteractionPair } from "@/lib/modifiers";

const severityOrder: InteractionSeverity[] = [
  "Contraindicated",
  "Major",
  "Moderate",
  "Minor",
];

const severityDot: Record<InteractionSeverity, string> = {
  Contraindicated: "bg-red-500",
  Major: "bg-orange-500",
  Moderate: "bg-amber-500",
  Minor: "bg-yellow-400",
};

export function InteractionSummary({
  pairs,
  stackCount = 0,
  dataVersion,
}: {
  pairs: ModifiedInteractionPair[];
  stackCount?: number;
  dataVersion: string;
}) {
  if (pairs.length === 0 && stackCount === 0) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
          No known pairwise interactions.
        </p>
        <p className="mt-0.5 text-[11px] text-emerald-900/70 dark:text-emerald-100/70">
          {dataVersion}
        </p>
      </div>
    );
  }

  const counts: Record<InteractionSeverity, number> = {
    Contraindicated: 0,
    Major: 0,
    Moderate: 0,
    Minor: 0,
  };
  for (const pair of pairs) {
    counts[pair.displaySeverity] += 1;
  }

  const hasContra = counts.Contraindicated > 0;
  const top = pairs[0];

  return (
    <div
      className={[
        "rounded-2xl border px-4 py-3",
        hasContra
          ? "border-red-500/40 bg-red-500/10"
          : "border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/60",
      ].join(" ")}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {severityOrder.map((severity) =>
          counts[severity] > 0 ? (
            <span
              key={severity}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              <span
                className={[
                  "h-2 w-2 rounded-full",
                  severityDot[severity],
                  severity === "Contraindicated" ? "animate-pulse" : "",
                ].join(" ")}
                aria-hidden
              />
              {counts[severity]} {severity}
            </span>
          ) : null
        )}
        {stackCount > 0 ? (
          <span className="inline-flex items-center text-xs font-medium text-zinc-600 dark:text-zinc-400">
            · {stackCount} stack warning{stackCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {top ? (
        <p className="mt-2 truncate text-sm text-zinc-900 dark:text-zinc-100">
          <span className="text-zinc-500">Top:</span>{" "}
          <span className="font-medium">
            {top.a.name} <span className="text-zinc-400">↔</span> {top.b.name}
          </span>{" "}
          — {top.displaySeverity}
        </p>
      ) : null}
    </div>
  );
}
