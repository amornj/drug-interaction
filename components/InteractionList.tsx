"use client";

import { InteractionExplanation } from "@/components/InteractionExplanation";
import { SeverityBadge } from "@/components/SeverityBadge";
import { formatSources } from "@/lib/interactions";
import type { ModifiedInteractionResult } from "@/lib/modifiers";

export function InteractionList({
  result,
}: {
  result: ModifiedInteractionResult;
}) {
  if (result.pairs.length === 0) {
    return (
      <div
        className="border border-rule border-l-2 bg-good-soft px-4 py-3"
        style={{ borderLeftColor: "var(--good)" }}
      >
        <p className="eyebrow" style={{ color: "var(--good)" }}>
          Clear
        </p>
        <p className="mt-1 text-[14px] text-ink">
          No known interactions found in current data sources.
        </p>
        <p className="stamp mt-2">{result.dataVersion}</p>
        {result.unknown.length > 0 ? (
          <p className="stamp mt-1">Unmapped RxCUIs: {result.unknown.join(", ")}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {result.pairs.map((pair, index) => {
        const isPinned = pair.displaySeverity === "Contraindicated";
        const severityToken =
          pair.displaySeverity === "Contraindicated"
            ? "var(--sev-contra)"
            : pair.displaySeverity === "Major"
            ? "var(--sev-major)"
            : pair.displaySeverity === "Moderate"
            ? "var(--sev-moderate)"
            : "var(--sev-minor)";
        return (
          <details
            key={`${pair.a.rxcui}|${pair.b.rxcui}`}
            className="group border-b border-rule last:border-b-0"
          >
            <summary
              className="list-none cursor-pointer border-l-2 py-4 pl-4 pr-2 transition-colors hover:bg-surface/60"
              style={{ borderLeftColor: isPinned ? severityToken : "transparent" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-3">
                    <span
                      className="shrink-0 font-mono text-[11px] tabular-nums text-ink-mute"
                      aria-hidden
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-[15px] leading-snug text-ink">
                      <span className="font-serif italic">{pair.a.name}</span>
                      <span className="mx-1.5 text-ink-mute">↔</span>
                      <span className="font-serif italic">{pair.b.name}</span>
                    </p>
                  </div>
                  <p className="mt-1.5 pl-8 text-[13.5px] leading-snug text-ink-soft">
                    {pair.verdict}
                  </p>
                  {pair.displaySeverity !== pair.baseSeverity ? (
                    <p
                      className="mt-1 pl-8 text-[11px] uppercase tracking-[0.1em]"
                      style={{ color: "var(--accent)" }}
                    >
                      Modifiers raised {pair.baseSeverity} → {pair.displaySeverity}
                    </p>
                  ) : null}
                  <p className="mt-2 pl-8 stamp">{formatSources(pair.sources)}</p>
                </div>
                <SeverityBadge severity={pair.displaySeverity} pulse={isPinned} />
              </div>
            </summary>
            <div className="border-l-2 border-rule pb-4 pl-8 pr-2 text-[13.5px] text-ink-soft">
              {pair.modifierEffects.length > 0 ? (
                <div
                  className="mb-3 border border-rule border-l-2 bg-accent-soft/40 px-3 py-2"
                  style={{ borderLeftColor: "var(--accent)" }}
                >
                  <p className="eyebrow" style={{ color: "var(--accent)" }}>
                    Patient modifier impact
                  </p>
                  {pair.modifierEffects.map((effect, i) => (
                    <div key={`${effect.modifier}-${i}`} className="mt-2">
                      <p className="text-[13.5px] text-ink">
                        <span className="font-serif italic">{effect.title}</span>
                        {effect.adjustedSeverity
                          ? `  →  ${effect.adjustedSeverity}`
                          : ""}
                      </p>
                      <p className="mt-1 text-[13px] leading-snug">{effect.summary}</p>
                      <p className="stamp mt-1">
                        Source: {formatSources([effect.source])}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
              {pair.mechanism_class ? (
                <p className="mt-2">
                  <span className="eyebrow mr-2">Mechanism</span>
                  {pair.mechanism_class}
                </p>
              ) : null}
              {pair.management ? (
                <p className="mt-2">
                  <span className="eyebrow mr-2">Management</span>
                  {pair.management}
                </p>
              ) : null}
              <p className="stamp mt-3">Sources · {formatSources(pair.sources)}</p>
              <InteractionExplanation
                pair={{
                  a: pair.a,
                  b: pair.b,
                  severity: pair.baseSeverity,
                  verdict: pair.verdict,
                  mechanism_class: pair.mechanism_class,
                  management: pair.management,
                  sources: pair.sources,
                }}
                dataVersion={result.dataVersion}
              />
            </div>
          </details>
        );
      })}
      {result.unknown.length > 0 ? (
        <p className="stamp mt-3">
          Unmapped RxCUIs: {result.unknown.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
