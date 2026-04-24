"use client";

import { useState } from "react";
import type { InteractionSeverity } from "@/lib/interactions";
import type { ModifiedInteractionPair } from "@/lib/modifiers";
import { getStackHighYieldDrugs, type StackWarning } from "@/lib/stacks";

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

function stackLabel(domain: StackWarning["domain"]) {
  switch (domain) {
    case "qt":
      return "QT";
    case "bleeding":
      return "Bleeding";
    case "serotonergic":
      return "Serotonergic";
    case "anticholinergic":
      return "Anticholinergic";
    case "eps":
      return "EPS";
    case "ergotism":
      return "Ergotism";
    case "myocardialdepression":
      return "Myocardial depression";
    case "fluidretention":
      return "Fluid retention";
    case "lacticacidosis":
      return "Lactic acidosis";
    case "nephrotoxic":
      return "Nephrotoxic";
    case "hyperkalemia":
      return "HyperK";
    case "hypokalemia":
      return "HypoK";
    case "hypercalcemia":
      return "HyperCa";
    case "hypocalcemia":
      return "HypoCa";
    case "hyponatremia":
      return "HypoNa";
    case "hypernatremia":
      return "HyperNa";
    case "hyperuricemia":
      return "Hyperuricemia";
    case "hypoglycemia":
      return "Hypoglycemia";
    case "hyperglycemia":
      return "Hyperglycemia";
    case "hagma":
      return "HAGMA";
    case "normalgapacidosis":
      return "NAGMA";
    case "bradycardia":
      return "Bradycardia";
    case "druginducedseizure":
      return "Seizure risk";
  }
}

export function InteractionSummary({
  pairs,
  stacks = [],
  dataVersion,
}: {
  pairs: ModifiedInteractionPair[];
  stacks?: StackWarning[];
  dataVersion: string;
}) {
  const [openStackDomain, setOpenStackDomain] = useState<StackWarning["domain"] | null>(null);
  const stackCount = stacks.length;

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
  const openStack = stacks.find((stack) => stack.domain === openStackDomain) ?? null;
  const openStackDrugs = openStack ? getStackHighYieldDrugs(openStack.domain) : [];

  return (
    <div
      className="border border-rule border-l-2 bg-paper-raised px-4 py-3"
      style={{ borderLeftColor: leftBorder }}
      aria-live="polite"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow">Summary</p>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
        {pairs.length > 0 ? (
          severityOrder.map((severity) =>
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
          )
        ) : (
          <span className="text-[14px] leading-snug text-ink">
            No known pairwise interactions.
          </span>
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

      {stacks.length > 0 ? (
        <div className="mt-3 border-t border-rule pt-2">
          <p className="eyebrow mb-1.5">Stacks hit</p>
          <div className="flex flex-wrap gap-1.5">
            {stacks.map((stack) => (
              <button
                type="button"
                key={stack.domain}
                onClick={() =>
                  setOpenStackDomain((current) =>
                    current === stack.domain ? null : stack.domain
                  )
                }
                aria-expanded={openStackDomain === stack.domain}
                aria-controls={`stack-reference-${stack.domain}`}
                className={`inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors ${
                  openStackDomain === stack.domain
                    ? "border-rule-strong bg-paper text-ink"
                    : "border-rule bg-surface text-ink-soft hover:border-rule-strong hover:text-ink"
                }`}
              >
                <span
                  className="sev-mark"
                  style={{ background: severityMark[stack.severity] }}
                  aria-hidden
                />
                {stackLabel(stack.domain)}
              </button>
            ))}
          </div>
          {openStack ? (
            <div
              id={`stack-reference-${openStack.domain}`}
              className="mt-2 border border-rule bg-paper-raised p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">High-yield drugs</p>
                  <p className="mt-1 text-[13px] italic leading-snug text-ink-mute">
                    Key contributors to the {stackLabel(openStack.domain)} stack.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenStackDomain(null)}
                  className="grid h-8 w-8 shrink-0 place-items-center border border-rule text-[14px] text-ink-soft transition-colors hover:border-rule-strong hover:text-ink"
                  aria-label={`Close ${stackLabel(openStack.domain)} drug list`}
                >
                  ×
                </button>
              </div>
              <div className="mt-3 max-h-[38vh] overflow-y-auto">
                <div className="flex flex-wrap gap-1.5">
                  {openStackDrugs.map((drug) => (
                    <span
                      key={drug}
                      className="border border-rule bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft"
                    >
                      {drug}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
