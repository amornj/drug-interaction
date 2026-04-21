"use client";

import { SeverityBadge } from "@/components/SeverityBadge";
import { formatSources } from "@/lib/interactions";
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
    case "nephrotoxic":
      return "Nephrotoxic";
  }
}

export function StackWarnings({
  warnings,
}: {
  warnings: StackWarning[];
}) {
  if (warnings.length === 0) {
    return (
      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
          No cumulative stack warnings from current local rules.
        </p>
        <p className="mt-1 text-xs text-emerald-900/70 dark:text-emerald-100/70">
          Cumulative stack rules · 2026-04
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Cumulative stack warnings
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            These are local deterministic stack rules, separate from pairwise DDInter results.
          </p>
        </div>
      </div>
      {warnings.map((warning) => (
        <div
          key={warning.domain}
          className="rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/5 p-4 shadow-sm dark:border-fuchsia-500/20 dark:bg-fuchsia-500/10"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {warning.title}
              </p>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                {warning.summary}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Domain: {domainLabel(warning.domain)}
              </p>
            </div>
            <SeverityBadge severity={warning.severity} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {warning.matchedDrugs.map((drug) => (
              <span
                key={`${warning.domain}-${drug.rxcui}`}
                className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              >
                {drug.name}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Sources: {formatSources(warning.sources)}
          </p>
        </div>
      ))}
    </section>
  );
}
