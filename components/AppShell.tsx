"use client";

import { useEffect, useMemo, useState } from "react";
import { AliasManagerModal } from "@/components/AliasManagerModal";
import { loadUserAliases, type Alias } from "@/lib/aliases";
import { CaseSwitcher } from "@/components/CaseSwitcher";
import { DrugSearch } from "@/components/DrugSearch";
import { DrugChip } from "@/components/DrugChip";
import { InteractionList } from "@/components/InteractionList";
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

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    loadUserAliases().then(setAliases);
  }, []);

  const activeDrugKey =
    active?.drugs.map((drug) => drug.rxcui).sort().join("|") ?? "";

  async function checkInteractions() {
    if (!active || active.drugs.length < 2) {
      return;
    }

    setChecking(true);
    setError(null);
    setErrorKey("");

    try {
      const response = await fetch("/api/interactions/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rxcuis: active.drugs.map((drug) => drug.rxcui),
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const json = (await response.json()) as InteractionCheckResponse;
      setResult(json);
      setResultKey(activeDrugKey);
    } catch {
      setError("Unable to check interactions right now.");
      setErrorKey(activeDrugKey);
    } finally {
      setChecking(false);
    }
  }

  const canCheck = Boolean(active && active.drugs.length >= 2);
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

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-[max(env(safe-area-inset-top),0.5rem)] pb-[calc(env(safe-area-inset-bottom)+6rem)]">
      <header className="pt-2 pb-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold tracking-tight">
            Drug Interaction Checker
          </h1>
          <span className="text-[11px] uppercase tracking-wide text-zinc-500">
            M9
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-0.5">
          Decision-support only. Verify in primary references.
        </p>
      </header>

      <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-[var(--background)]/90 backdrop-blur">
        <CaseSwitcher onManageAliases={() => setAliasManagerOpen(true)} />
      </div>

      <section className="mt-4">
        <DrugSearch aliases={aliases} onAliasesChange={setAliases} />
      </section>

      <section className="mt-5 flex-1">
        {!hydrated ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : active && active.drugs.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Medications ({active.drugs.length})
              </h2>
              <button
                type="button"
                onClick={clearDrugs}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Clear all
              </button>
            </div>
            <ul className="space-y-2">
              {active.drugs.map((d) => (
                <DrugChip key={d.rxcui} drug={d} />
              ))}
            </ul>
            <PatientModifiers modifiers={active.patientModifiers} />
            <PharmacogenomicsPanel
              drugs={active.drugs}
              profile={active.pgxProfile}
            />
            {visibleError ? (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-900 dark:text-red-100">
                {visibleError}
              </div>
            ) : null}
            {visibleResult ? (
              <section className="mt-5">
                <div className="mb-5">
                  <StackWarnings warnings={stackWarnings} />
                </div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Interaction results
                    </h2>
                    {modifiedResult && modifiedResult.modifierSummary.length > 0 ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        Active modifiers: {modifiedResult.modifierSummary.join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(visibleResult.checkedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {modifiedResult ? <InteractionList result={modifiedResult} /> : null}
              </section>
            ) : null}
          </>
        ) : (
          <div className="mt-8 text-center text-sm text-zinc-500">
            <p>No medications yet.</p>
            <p className="mt-1">Search above to add this case&rsquo;s meds.</p>
          </div>
        )}
      </section>

      <nav
        aria-label="Primary actions"
        className="fixed bottom-0 inset-x-0 border-t border-zinc-200 dark:border-zinc-800 bg-[var(--background)]/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto max-w-xl px-4 py-3 flex gap-2">
          <button
            type="button"
            onClick={checkInteractions}
            disabled={!canCheck || checking}
            className={[
              "flex-1 h-12 rounded-xl text-white font-medium transition-colors",
              canCheck && !checking
                ? "bg-sky-600 active:bg-sky-700"
                : "bg-sky-600/50 cursor-not-allowed",
            ].join(" ")}
            title={
              canCheck
                ? "Check deterministic DDInter pairs"
                : "Add at least 2 medications"
            }
          >
            {checking ? "Checking…" : "Check interactions"}
          </button>
        </div>
      </nav>

      <AliasManagerModal
        open={aliasManagerOpen}
        aliases={aliases}
        onClose={() => setAliasManagerOpen(false)}
        onAliasesChange={setAliases}
      />
    </div>
  );
}
