"use client";

import type { InteractionSeverity } from "@/lib/interactions";
import type { ModifiedInteractionPair } from "@/lib/modifiers";

const severityOrder: InteractionSeverity[] = [
  "Contraindicated",
  "Major",
  "Moderate",
  "Minor",
];

const severityMark: Record<InteractionSeverity, string> = {
  Contraindicated: "var(--sev-contra)",
  Major: "var(--sev-major)",
  Moderate: "var(--sev-moderate)",
  Minor: "var(--sev-minor)",
};

const severityShort: Record<InteractionSeverity, string> = {
  Contraindicated: "Contra",
  Major: "Major",
  Moderate: "Mod",
  Minor: "Minor",
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
      <div
        className="border border-rule border-l-2 border-l-[var(--good)] bg-good-soft px-4 py-3"
        style={{ borderLeftColor: "var(--good)" }}
      >
        <p className="eyebrow mb-1" style={{ color: "var(--good)" }}>
          Clear
        </p>
        <p className="text-[14px] leading-snug text-ink">
          No known pairwise interactions.
        </p>
        <p className="stamp mt-2">{dataVersion}</p>
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
  const leftBorder = hasContra
    ? "var(--sev-contra)"
    : counts.Major > 0
    ? "var(--sev-major)"
    : "var(--rule-strong)";

  return (
    <div
      className="border border-rule border-l-2 bg-paper-raised px-4 py-3"
      style={{ borderLeftColor: leftBorder }}
      aria-live="polite"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow">Summary</p>
        {stackCount > 0 ? (
          <p className="stamp">
            + {stackCount} stack{stackCount === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
        {severityOrder.map((severity) =>
          counts[severity] > 0 ? (
            <span
              key={severity}
              className="inline-flex items-baseline gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft"
            >
              <span
                className={`sev-mark ${severity === "Contraindicated" ? "breath" : ""}`}
                style={{ background: severityMark[severity] }}
                aria-hidden
              />
              <span className="tabular-nums text-ink">{counts[severity]}</span>{" "}
              {severityShort[severity]}
            </span>
          ) : null
        )}
      </div>

      {top ? (
        <p className="mt-3 border-t border-rule pt-2 text-[14px] leading-snug text-ink">
          <span className="eyebrow mr-2">Top</span>
          <span className="font-serif italic">
            {top.a.name}
          </span>
          <span className="mx-1.5 text-ink-mute">↔</span>
          <span className="font-serif italic">{top.b.name}</span>
          <span className="mx-2 text-ink-mute">—</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
            {top.displaySeverity}
          </span>
        </p>
      ) : null}
    </div>
  );
}
