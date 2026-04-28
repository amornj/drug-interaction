"use client";

import { useState } from "react";
import { InteractionExplanation } from "@/components/InteractionExplanation";
import { SeverityBadge } from "@/components/SeverityBadge";
import { formatSources } from "@/lib/interaction-types";
import { confidenceLabel, pkMechanismLabel } from "@/lib/interaction-types";
import type { ModifiedInteractionResult } from "@/lib/modifiers";

export function InteractionList({
  result,
}: {
  result: ModifiedInteractionResult;
}) {
  const [hideLowConfidence, setHideLowConfidence] = useState(false);

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

  const visiblePairs = result.pairs.filter(
    (pair) =>
      !hideLowConfidence ||
      pair.displaySeverity === "Contraindicated" ||
      !pair.lowConfidence
  );
  const hiddenCount = result.pairs.length - visiblePairs.length;

  return (
    <div>
      <div className="border-b border-rule px-4 py-3">
        <label className="flex min-h-11 items-center justify-between gap-3 text-[13px] text-ink-soft">
          <span>
            Hide missing PK data
            {hiddenCount > 0 ? (
              <span className="ml-1 text-ink-mute">({hiddenCount} hidden)</span>
            ) : null}
          </span>
          <input
            type="checkbox"
            className="size-5 accent-[var(--accent)]"
            checked={hideLowConfidence}
            onChange={(event) => setHideLowConfidence(event.target.checked)}
          />
        </label>
      </div>
      {visiblePairs.map((pair, index) => {
        const isPinned = pair.displaySeverity === "Contraindicated";
        const isClinicalOverlay = pair.sources.some(
          (source) => source.name === "Clinical overlay"
        );
        const showConfidenceBadge =
          pair.confidence !== "unverified" ||
          pair.pkMechanisms.length > 0;
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
                  <div className="mt-2 flex flex-wrap items-center gap-2 pl-8">
                    {showConfidenceBadge ? (
                      <span
                        className={`border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${
                          pair.lowConfidence
                            ? "border-rule bg-surface/50 text-ink-mute"
                            : "border-rule-strong text-ink-soft"
                        }`}
                        title={
                          pair.confidence === "pk_confirmed"
                            ? "Direct local inhibitor-substrate mechanism"
                            : pair.confidence === "pk_plausible"
                            ? "Shared high-risk substrate pathway"
                            : pair.confidence === "pd_plausible"
                            ? "Shared pharmacodynamic stack domain"
                            : "Mechanism not confirmed locally"
                        }
                      >
                        {confidenceLabel(pair.confidence)}
                      </span>
                    ) : null}
                    {pair.pkMechanisms.map((mechanism) => (
                      <span
                        key={`${mechanism.kind}-${mechanism.system}`}
                        className="border border-rule bg-paper-raised px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-ink-soft"
                      >
                        {pkMechanismLabel(mechanism.kind)}
                      </span>
                    ))}
                    {[
                      ...new Set(
                        pair.pkMechanisms.map((mechanism) => mechanism.system)
                      ),
                    ].map((system) => (
                      <span
                        key={system}
                        className="border border-rule bg-accent-soft px-2 py-1 font-mono text-[10px] tracking-[0.04em] text-ink"
                      >
                        {system}
                      </span>
                    ))}
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
              {pair.lowConfidence && isClinicalOverlay ? (
                <p className="mt-2 italic">
                  Mechanism not confirmed in local CYP/transporter or
                  pharmacodynamic data.
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
                  confidence: pair.confidence,
                  lowConfidence: pair.lowConfidence,
                  pkMechanisms: pair.pkMechanisms,
                  mechanism_class: pair.mechanism_class,
                  management: pair.management,
                  sources: pair.sources,
                }}
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
