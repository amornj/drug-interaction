"use client";

import { SeverityBadge } from "@/components/SeverityBadge";
import { formatSources } from "@/lib/interactions";
import {
  detectPharmacogenomicAlerts,
  findRelevantPgxGenes,
  pgxGeneConfigs,
  type PgxProfile,
} from "@/lib/pgx";
import type { Drug } from "@/lib/store";
import { useStore } from "@/lib/store";

export function PharmacogenomicsPanel({
  drugs,
  profile,
}: {
  drugs: Drug[];
  profile: PgxProfile;
}) {
  const setPgxPhenotype = useStore((s) => s.setPgxPhenotype);
  const resetPgxProfile = useStore((s) => s.resetPgxProfile);
  const relevantGenes = findRelevantPgxGenes(drugs);
  const alerts = detectPharmacogenomicAlerts(drugs, profile);

  return (
    <section className="mt-5 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Pharmacogenomics panel
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Local deterministic CPIC-style checks suggest tests before prescribing
            and interpret entered phenotypes without changing the pairwise DDI layer.
          </p>
        </div>
        <button
          type="button"
          onClick={resetPgxProfile}
          className="min-h-11 rounded-xl px-3 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Reset
        </button>
      </div>

      {relevantGenes.length > 0 ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {relevantGenes.map((gene) => (
              <label key={gene} className="text-xs text-zinc-500">
                {pgxGeneConfigs[gene].label}
                <select
                  value={profile[gene]}
                  onChange={(event) => setPgxPhenotype(gene, event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  {pgxGeneConfigs[gene].options.map((option) => (
                    <option key={`${gene}-${option.value || "unknown"}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {alerts.map((alert) => (
              <article
                key={`${alert.gene}-${alert.title}`}
                className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-4 shadow-sm dark:border-violet-500/20 dark:bg-violet-500/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {alert.geneLabel} · {alert.title}
                    </p>
                    <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                      {alert.summary}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Phenotype: {alert.phenotypeLabel}
                    </p>
                  </div>
                  <SeverityBadge severity={alert.severity} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {alert.matchedDrugs.map((drug) => (
                    <span
                      key={`${alert.gene}-${drug.rxcui}`}
                      className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                    >
                      {drug.name}
                    </span>
                  ))}
                </div>

                <p className="mt-3 text-xs text-zinc-500">
                  Sources: {formatSources(alert.sources)}
                </p>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
            No local pharmacogenomic rule matches for the current medication list.
          </p>
          <p className="mt-1 text-xs text-emerald-900/70 dark:text-emerald-100/70">
            CPIC local rules · 2026-04
          </p>
        </div>
      )}
    </section>
  );
}
