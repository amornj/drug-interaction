"use client";

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
    case "nephrotoxic":
      return "Nephrotoxic";
    case "hyperkalemia":
      return "HyperK";
    case "hypokalemia":
      return "HypoK";
    case "hypoglycemia":
      return "Hypoglycemia";
    case "hyperglycemia":
      return "Hyperglycemia";
  }
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
  if (warnings.length === 0) {
    return null;
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
            <article
              key={warning.domain}
              className="border-b border-rule border-l-2 py-4 pl-4 pr-2 last:border-b-0"
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
              <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1.5">
                {warning.matchedDrugs.map((drug) => (
                  <span
                    key={`${warning.domain}-${drug.rxcui}`}
                    className="border border-rule px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-soft"
                  >
                    {drug.name}
                  </span>
                ))}
              </div>
              <p className="stamp mt-3">Sources · {formatSources(warning.sources)}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
