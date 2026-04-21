"use client";

import { useEffect } from "react";
import { CaseSwitcher } from "@/components/CaseSwitcher";
import { DrugSearch } from "@/components/DrugSearch";
import { DrugChip } from "@/components/DrugChip";
import { useActiveCase, useStore } from "@/lib/store";

export function AppShell() {
  const hydrate = useStore((s) => s.hydrate);
  const hydrated = useStore((s) => s.hydrated);
  const active = useActiveCase();
  const clearDrugs = useStore((s) => s.clearDrugs);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-[max(env(safe-area-inset-top),0.5rem)] pb-[calc(env(safe-area-inset-bottom)+6rem)]">
      <header className="pt-2 pb-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold tracking-tight">
            Drug Interaction Checker
          </h1>
          <span className="text-[11px] uppercase tracking-wide text-zinc-500">
            M1
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-0.5">
          Decision-support only. Verify in primary references.
        </p>
      </header>

      <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-[var(--background)]/90 backdrop-blur">
        <CaseSwitcher />
      </div>

      <section className="mt-4">
        <DrugSearch />
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
            disabled
            className="flex-1 h-12 rounded-xl bg-sky-600/50 text-white font-medium cursor-not-allowed"
            title="Interaction check arrives in M2"
          >
            Check interactions (M2)
          </button>
        </div>
      </nav>
    </div>
  );
}
