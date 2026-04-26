"use client";

import { useEffect, useMemo, useState } from "react";
import { AliasManagerModal } from "@/components/AliasManagerModal";
import { loadUserAliases, type Alias } from "@/lib/aliases";
import { CaseSwitcher } from "@/components/CaseSwitcher";
import { DrugSearch } from "@/components/DrugSearch";
import { DrugChip } from "@/components/DrugChip";
import { InteractionList } from "@/components/InteractionList";
import { InteractionSummary } from "@/components/InteractionSummary";
import { PatientModifiers } from "@/components/PatientModifiers";
import { PharmacogenomicsPanel } from "@/components/PharmacogenomicsPanel";
import { StackWarnings } from "@/components/StackWarnings";
import type { InteractionCheckResponse } from "@/lib/interactions";
import { applyPatientModifiers } from "@/lib/modifiers";
import { detectCumulativeStacks } from "@/lib/stacks";
import { useActiveCase, useStore } from "@/lib/store";

export function AppShell() {
  const hydrate = useStore((s) => s.hydrate);
  const hydrated = useStore((s) => s.hydrated);
  const active = useActiveCase();
  const clearDrugs = useStore((s) => s.clearDrugs);
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [aliasManagerOpen, setAliasManagerOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<InteractionCheckResponse | null>(null);
  const [resultKey, setResultKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState("");
  const [retryNonce, setRetryNonce] = useState(0);
  const [openReference, setOpenReference] = useState<{
    rxcui: string;
    system: string;
  } | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [copyLabel, setCopyLabel] = useState("COPY");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    loadUserAliases().then(setAliases);
  }, []);

  const activeDrugKey =
    active?.drugs.map((drug) => drug.rxcui).sort().join("|") ?? "";

  useEffect(() => {
    if (!hydrated) return;
    if (!active || active.drugs.length < 2) return;

    const rxcuis = active.drugs.map((drug) => drug.rxcui);
    const expectedKey = activeDrugKey;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setChecking(true);
      try {
        const response = await fetch("/api/interactions/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rxcuis }),
        });
        if (!response.ok) throw new Error("Request failed");
        const json = (await response.json()) as InteractionCheckResponse;
        if (!cancelled) {
          setResult(json);
          setResultKey(expectedKey);
          setError(null);
          setErrorKey("");
        }
      } catch {
        if (!cancelled) {
          setError("Unable to check interactions right now.");
          setErrorKey(expectedKey);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDrugKey, hydrated, retryNonce]);

  const visibleResult = resultKey === activeDrugKey ? result : null;
  const visibleError = errorKey === activeDrugKey ? error : null;
  const modifiedResult = useMemo(
    () =>
      active && visibleResult
        ? applyPatientModifiers(visibleResult, active.patientModifiers)
        : null,
    [active, visibleResult]
  );
  const stackWarnings = useMemo(
    () => (active && visibleResult ? detectCumulativeStacks(active.drugs) : []),
    [active, visibleResult]
  );

  const now = new Date();
  const stamp = `${String(now.getFullYear()).slice(2)}.${String(
    now.getMonth() + 1
  ).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pt-[max(env(safe-area-inset-top),0.5rem)] pb-[max(env(safe-area-inset-bottom),2rem)]">
      <header className="rise rise-1 border-b border-rule-strong pb-5 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow mb-1.5">Bedside Decision Support</p>
            <h1 className="serif-display text-[34px] text-ink">
              Drug <span className="italic">Interaction</span> Checker
            </h1>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10.5px] tabular-nums text-ink-mute">
              v.M9 · {stamp}
            </p>
            <p className="stamp mt-0.5" style={{ color: "var(--accent)" }}>
              ▪ LIVE
            </p>
          </div>
        </div>
        <p className="mt-3 max-w-md text-[12px] italic leading-snug text-ink-mute">
          Decision-support only. Verify in primary references before prescribing.
        </p>
      </header>

      <div className="rise rise-2 sticky top-0 z-10 -mx-5 border-b border-rule bg-paper/95 px-5 py-3 backdrop-blur">
        <CaseSwitcher onManageAliases={() => setAliasManagerOpen(true)} />
      </div>

      <section className="rise rise-3 mt-5">
        <DrugSearch aliases={aliases} onAliasesChange={setAliases} />
      </section>

      {modifiedResult ? (
        <section className="mt-4">
          <InteractionSummary
            pairs={modifiedResult.pairs}
            stacks={stackWarnings}
            dataVersion={modifiedResult.dataVersion}
          />
        </section>
      ) : checking &&
        active &&
        active.drugs.length >= 2 &&
        resultKey !== activeDrugKey ? (
        <section className="mt-4">
          <div className="border border-rule border-l-2 border-l-ink-mute bg-paper-raised px-4 py-3">
            <p className="eyebrow">Checking</p>
            <p className="mt-1 text-[13.5px] italic text-ink-soft">
              Running deterministic check…
            </p>
          </div>
        </section>
      ) : null}

      {visibleError ? (
        <section className="mt-4">
          <div
            className="flex items-start justify-between gap-3 border border-rule border-l-2 bg-warn-soft px-4 py-3"
            style={{ borderLeftColor: "var(--sev-contra)" }}
          >
            <div>
              <p className="eyebrow" style={{ color: "var(--sev-contra)" }}>
                Error
              </p>
              <p className="mt-1 text-[13.5px] text-ink">{visibleError}</p>
            </div>
            <button
              type="button"
              onClick={() => setRetryNonce((n) => n + 1)}
              className="eyebrow shrink-0 self-center border border-rule-strong px-3 py-1.5 text-ink hover:bg-accent-soft"
            >
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <section className="rise rise-4 mt-8 flex-1">
        {!hydrated ? (
          <p className="stamp">Loading…</p>
        ) : active && active.drugs.length > 0 ? (
          <>
            <div className="flex items-baseline justify-between border-b border-rule pb-2">
              <div className="flex items-baseline gap-3">
                <p className="eyebrow">
                  Medications <span className="text-ink">· {active.drugs.length}</span>
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const list = active.drugs.map((d) => d.name).join(", ");
                    const prompt = `My patient takes these medicines; ${list}; What are the possible drug interactions and side effects. How to prevent it.`;
                    try {
                      await navigator.clipboard.writeText(prompt);
                      setCopyLabel("Copied ✓");
                      window.setTimeout(() => setCopyLabel("COPY"), 1600);
                    } catch {
                      setCopyLabel("Copy failed");
                      window.setTimeout(() => setCopyLabel("COPY"), 1600);
                    }
                  }}
                  className="text-[11px] uppercase tracking-[0.12em] text-ink-mute transition-colors hover:text-accent"
                  title="Copy LLM prompt"
                >
                  {copyLabel}
                </button>
                {active.drugs.length < 2 ? (
                  <span className="text-[11px] italic text-ink-mute">
                    add one more to check
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={clearDrugs}
                className="text-[11px] uppercase tracking-[0.12em] text-ink-mute hover:text-accent"
              >
                Clear
              </button>
            </div>
            <ul className="mt-1">
              {active.drugs.map((d, i) => (
                <DrugChip
                  key={d.rxcui}
                  drug={d}
                  index={i}
                  totalCount={active.drugs.length}
                  activeReferenceSystem={
                    openReference?.rxcui === d.rxcui ? openReference.system : null
                  }
                  onToggleReferenceSystem={(system) =>
                    setOpenReference((current) =>
                      current?.rxcui === d.rxcui && current.system === system
                        ? null
                        : { rxcui: d.rxcui, system }
                    )
                  }
                  isDragSource={draggingIndex === i}
                  isDropTarget={dropTargetIndex === i}
                  dropTargetIndex={dropTargetIndex}
                  onDragStart={(idx) => setDraggingIndex(idx)}
                  onDragEnd={() => {
                    setDraggingIndex(null);
                    setDropTargetIndex(null);
                  }}
                  onDragOverItem={(idx) => setDropTargetIndex(idx)}
                />
              ))}
            </ul>

            <div className="mt-6">
              <PatientModifiers modifiers={active.patientModifiers} />
            </div>
            <div className="mt-6">
              <PharmacogenomicsPanel
                drugs={active.drugs}
                profile={active.pgxProfile}
              />
            </div>

            {modifiedResult ? (
              <>
                {stackWarnings.length > 0 ? (
                  <div className="mt-8">
                    <p className="ornament mb-4">Cumulative Load</p>
                    <StackWarnings warnings={stackWarnings} />
                  </div>
                ) : null}

                <div className="mt-8">
                  <p className="ornament mb-4">Pairwise Interactions</p>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="eyebrow">Results</p>
                      {modifiedResult.modifierSummary.length > 0 ? (
                        <p className="mt-1 text-[11.5px] italic text-ink-mute">
                          with {modifiedResult.modifierSummary.join(", ")}
                        </p>
                      ) : null}
                    </div>
                    <span className="stamp">
                      Checked ·{" "}
                      {new Date(modifiedResult.checkedAt).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                  <div className="mt-3">
                    <InteractionList result={modifiedResult} />
                  </div>
                </div>
              </>
            ) : null}
          </>
        ) : (
          <div className="mt-16 text-center">
            <p className="ornament mx-auto mb-6 max-w-[14rem]">No Case Data</p>
            <p className="font-serif text-[22px] italic text-ink">
              An empty prescription pad.
            </p>
            <p className="mt-2 text-[13px] text-ink-mute">
              Search above to add medications to this case.
            </p>
          </div>
        )}
      </section>

      <footer className="mt-12 border-t border-rule pt-4">
        <p className="eyebrow">
          Footnote
        </p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-ink-mute">
          This tool assists clinical judgment; it does not replace it. Severity,
          mechanism, and management are derived from DDInter 2.0 and a
          hand-curated overlay. Patient data never leaves this device.
        </p>
      </footer>

      <AliasManagerModal
        open={aliasManagerOpen}
        aliases={aliases}
        onClose={() => setAliasManagerOpen(false)}
        onAliasesChange={setAliases}
      />
    </div>
  );
}
