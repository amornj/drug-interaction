"use client";

import { useState } from "react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { formatSources } from "@/lib/interactions";
import type { InteractionSeverity } from "@/lib/interactions";
import type { StackWarning } from "@/lib/stacks";

function domainLabel(domain: StackWarning["domain"]) {
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
  }
}

function promptRiskLabel(domain: StackWarning["domain"]) {
  return domainLabel(domain).toLowerCase();
}

const severityToken: Record<InteractionSeverity, string> = {
  Contraindicated: "var(--sev-contra)",
  Major: "var(--sev-major)",
  Moderate: "var(--sev-moderate)",
  Minor: "var(--sev-minor)",
};

export function StackWarnings({
  warnings,
}: {
  warnings: StackWarning[];
}) {
  const [copyLabels, setCopyLabels] = useState<Record<string, string>>({});

  if (warnings.length === 0) {
    return null;
  }

  async function copyStackPrompt(warning: StackWarning) {
    const drugList = warning.matchedDrugs.map((drug) => drug.name).join(", ");
    const prompt = `Explain why when we use ${drugList} together, they increase cumulative risk of ${promptRiskLabel(warning.domain)}.`;

    try {
      await navigator.clipboard.writeText(prompt);
      setCopyLabels((labels) => ({ ...labels, [warning.domain]: "Copied ✓" }));
      window.setTimeout(
        () =>
          setCopyLabels((labels) => ({
            ...labels,
            [warning.domain]: "Copy prompt",
          })),
        1600
      );
    } catch {
      setCopyLabels((labels) => ({ ...labels, [warning.domain]: "Copy failed" }));
      window.setTimeout(
        () =>
          setCopyLabels((labels) => ({
            ...labels,
            [warning.domain]: "Copy prompt",
          })),
        1600
      );
    }
  }

  return (
    <section>
      <div className="border-b border-rule pb-2">
        <p className="eyebrow">Cumulative Stacks</p>
        <p className="mt-0.5 text-[11px] italic text-ink-mute">
          Local deterministic rules, separate from pairwise results.
        </p>
      </div>
      <div>
        {warnings.map((warning) => {
          const token = severityToken[warning.severity];
          return (
            <details
              key={warning.domain}
              className="group border-b border-rule last:border-b-0"
            >
              <summary
                className="list-none cursor-pointer border-l-2 py-4 pl-4 pr-2 transition-colors hover:bg-surface/60"
                style={{ borderLeftColor: token }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="stamp uppercase" style={{ color: token }}>
                      {domainLabel(warning.domain)}
                    </p>
                    <p className="mt-1 font-serif text-[17px] italic text-ink">
                      {warning.title}
                    </p>
                    <p className="mt-1.5 text-[13.5px] leading-snug text-ink-soft">
                      {warning.summary}
                    </p>
                  </div>
                  <SeverityBadge severity={warning.severity} />
                </div>
              </summary>
              <div className="border-l-2 border-rule pb-4 pl-4 pr-2">
                <div className="flex flex-wrap gap-x-2 gap-y-1.5">
                  {warning.matchedDrugs.map((drug) => (
                    <span
                      key={`${warning.domain}-${drug.rxcui}`}
                      className="border border-rule px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-soft"
                    >
                      {drug.name}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-start justify-between gap-3 border border-rule bg-paper-raised p-3">
                  <div>
                    <p className="eyebrow">Ask LLM Chat</p>
                    <p className="mt-0.5 text-[11px] italic text-ink-mute">
                      Copy a mechanism prompt for this cumulative stack.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyStackPrompt(warning)}
                    className="min-h-9 shrink-0 border border-rule px-3 text-[11.5px] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-rule-strong hover:text-ink"
                  >
                    {copyLabels[warning.domain] ?? "Copy prompt"}
                  </button>
                </div>
                <p className="stamp mt-3">Sources · {formatSources(warning.sources)}</p>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
