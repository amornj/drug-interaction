"use client";

import { LlmPromptPanel } from "@/components/LlmPromptPanel";
import { SeverityBadge } from "@/components/SeverityBadge";
import { formatSources } from "@/lib/interactions";
import type { InteractionSeverity } from "@/lib/interactions";
import {
  detectPharmacogenomicAlerts,
  findRelevantPgxGenes,
  pgxGeneConfigs,
  type PgxProfile,
} from "@/lib/pgx";
import type { Drug } from "@/lib/store";
import { useStore } from "@/lib/store";

const severityToken: Record<InteractionSeverity, string> = {
  Contraindicated: "var(--sev-contra)",
  Major: "var(--sev-major)",
  Moderate: "var(--sev-moderate)",
  Minor: "var(--sev-minor)",
};

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
    <section>
      <div className="flex items-baseline justify-between border-b border-rule pb-2">
        <div>
          <p className="eyebrow">Pharmacogenomics</p>
          <p className="mt-0.5 text-[11px] italic text-ink-mute">
            CPIC-style local checks. Pairwise results unchanged.
          </p>
        </div>
        {relevantGenes.length > 0 ? (
          <button
            type="button"
            onClick={resetPgxProfile}
            className="text-[11px] uppercase tracking-[0.12em] text-ink-mute hover:text-accent"
          >
            Reset
          </button>
        ) : null}
      </div>

      {relevantGenes.length > 0 ? (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {relevantGenes.map((gene) => (
              <label key={gene} className="stamp block">
                {pgxGeneConfigs[gene].label}
                <select
                  value={profile[gene]}
                  onChange={(event) => setPgxPhenotype(gene, event.target.value)}
                  className="mt-1 h-11 w-full border border-rule bg-paper-raised px-3 text-[13.5px] text-ink"
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

          {alerts.length > 0 ? (
            <div className="mt-4">
              {alerts.map((alert) => {
                const token = severityToken[alert.severity];
                return (
                  <article
                    key={`${alert.gene}-${alert.title}`}
                    className="border-b border-rule border-l-2 py-4 pl-4 pr-2 last:border-b-0"
                    style={{ borderLeftColor: token }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="stamp uppercase" style={{ color: token }}>
                          {alert.geneLabel}
                        </p>
                        <p className="mt-1 font-serif text-[17px] italic text-ink">
                          {alert.title}
                        </p>
                        <p className="mt-1.5 text-[13.5px] leading-snug text-ink-soft">
                          {alert.summary}
                        </p>
                        <p className="stamp mt-2">
                          Phenotype · {alert.phenotypeLabel}
                        </p>
                      </div>
                      <SeverityBadge severity={alert.severity} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1.5">
                      {alert.matchedDrugs.map((drug) => (
                        <span
                          key={`${alert.gene}-${drug.rxcui}`}
                          className="border border-rule px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-soft"
                        >
                          {drug.name}
                        </span>
                      ))}
                    </div>
                    <LlmPromptPanel
                      blurb="Copy a pharmacogenomic testing prompt for another chat app."
                      prompts={[
                        {
                          id: `${alert.gene}-${alert.title}`,
                          label: `${alert.geneLabel} for ${alert.matchedDrugs
                            .map((drug) => drug.name)
                            .join(", ")}`,
                          prompt: `Why do we have to test ${alert.geneLabel} for ${alert.matchedDrugs
                            .map((drug) => drug.name)
                            .join(" and ")}? How to interpret the result.`,
                        },
                      ]}
                    />
                    <p className="stamp mt-3">Sources · {formatSources(alert.sources)}</p>
                  </article>
                );
              })}
            </div>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-[12px] italic text-ink-mute">
          No local pharmacogenomic rules match this medication list.
        </p>
      )}
    </section>
  );
}
