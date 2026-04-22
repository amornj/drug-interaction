"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AliasManagerModal } from "@/components/AliasManagerModal";
import {
  loadAliasSyncConfig,
  syncAliasesWithRemote,
  type AliasSyncConfig,
} from "@/lib/alias-sync";
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
  const [syncConfig, setSyncConfig] = useState<AliasSyncConfig | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<InteractionCheckResponse | null>(null);
  const [resultKey, setResultKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState("");
  const [retryNonce, setRetryNonce] = useState(0);
  const syncConfigRef = useRef<AliasSyncConfig | null>(null);
  const syncInFlightRef = useRef(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    loadUserAliases().then(setAliases);
    loadAliasSyncConfig().then(setSyncConfig);
  }, []);

  useEffect(() => {
    syncConfigRef.current = syncConfig;
  }, [syncConfig]);

  const runAliasSync = useCallback(async () => {
    const config = syncConfigRef.current;

    if (
      syncInFlightRef.current ||
      !config?.syncId ||
      !config.passphrase
    ) {
      return;
    }

    syncInFlightRef.current = true;
    setSyncStatus("Syncing aliases…");
    try {
      const synced = await syncAliasesWithRemote(config);
      setAliases(synced.aliases);
      setSyncConfig(synced.config);
      setSyncStatus(
        `Synced at ${new Date(
          synced.config.lastSyncedAt ?? Date.now()
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}.`
      );
    } catch (error) {
      setSyncStatus(
        error instanceof Error ? error.message : "Alias sync failed."
      );
    } finally {
      syncInFlightRef.current = false;
    }
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

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-[max(env(safe-area-inset-top),0.5rem)] pb-[max(env(safe-area-inset-bottom),1rem)]">
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

      {modifiedResult ? (
        <section className="mt-3">
          <InteractionSummary
            pairs={modifiedResult.pairs}
            stackCount={stackWarnings.length}
            dataVersion={modifiedResult.dataVersion}
          />
        </section>
      ) : checking && active && active.drugs.length >= 2 && resultKey !== activeDrugKey ? (
        <section className="mt-3">
          <div className="rounded-2xl border border-zinc-200 bg-white/60 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60">
            Checking interactions…
          </div>
        </section>
      ) : null}

      {visibleError ? (
        <section className="mt-3">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-900 dark:text-red-100">
            <span>{visibleError}</span>
            <button
              type="button"
              onClick={() => setRetryNonce((n) => n + 1)}
              className="h-8 shrink-0 rounded-full bg-red-600/90 px-3 text-xs font-medium text-white hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <section className="mt-5 flex-1">
        {!hydrated ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : active && active.drugs.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Medications ({active.drugs.length})
                {active.drugs.length < 2 ? (
                  <span className="ml-2 text-xs font-normal text-zinc-500">
                    · add one more to check interactions
                  </span>
                ) : null}
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
            {modifiedResult ? (
              <section className="mt-5">
                <div className="mb-5">
                  <StackWarnings warnings={stackWarnings} />
                </div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Interaction results
                    </h2>
                    {modifiedResult.modifierSummary.length > 0 ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        Active modifiers: {modifiedResult.modifierSummary.join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(modifiedResult.checkedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <InteractionList result={modifiedResult} />
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

      {aliasManagerOpen ? (
        <AliasManagerModal
          key={`${syncConfig?.syncId ?? "new"}-${syncConfig?.lastSyncedAt ?? "none"}`}
          open={aliasManagerOpen}
          aliases={aliases}
          syncConfig={syncConfig}
          syncStatus={syncStatus}
          onClose={() => setAliasManagerOpen(false)}
          onAliasesChange={setAliases}
          onSyncConfigChange={setSyncConfig}
          onSyncStatusChange={setSyncStatus}
          onManualSync={() => runAliasSync()}
        />
      ) : null}
    </div>
  );
}
