"use client";

import {
  calculateCockcroftGault,
  type PatientModifiers,
} from "@/lib/modifiers";
import { useStore } from "@/lib/store";

const flagModifiers = [
  { key: "pregnancy", label: "Pregnancy" },
  { key: "lactation", label: "Lactation" },
  { key: "hepaticImpairment", label: "Hepatic" },
  { key: "age65Plus", label: "Age ≥ 65" },
  { key: "g6pdDeficiency", label: "G6PD" },
] as const;

export function PatientModifiers({
  modifiers,
}: {
  modifiers: PatientModifiers;
}) {
  const setModifierFlag = useStore((s) => s.setModifierFlag);
  const updateRenalInput = useStore((s) => s.updateRenalInput);
  const resetPatientModifiers = useStore((s) => s.resetPatientModifiers);
  const renalEstimate = calculateCockcroftGault(modifiers.renal);

  return (
    <section className="mt-5 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Patient modifiers
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Local-only deterministic modifiers can re-rank displayed pair urgency.
          </p>
        </div>
        <button
          type="button"
          onClick={resetPatientModifiers}
          className="min-h-11 rounded-xl px-3 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Reset
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {flagModifiers.map((modifier) => {
          const enabled = modifiers[modifier.key];
          return (
            <button
              key={modifier.key}
              type="button"
              aria-pressed={enabled}
              onClick={() => setModifierFlag(modifier.key, !enabled)}
              className={[
                "min-h-11 rounded-full border px-3 text-sm font-medium transition-colors",
                enabled
                  ? "border-sky-500 bg-sky-500/10 text-sky-800 dark:text-sky-100"
                  : "border-zinc-300 bg-transparent text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
              ].join(" ")}
            >
              {modifier.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={modifiers.renal.enabled}
          onClick={() => updateRenalInput("enabled", !modifiers.renal.enabled)}
          className={[
            "min-h-11 rounded-full border px-3 text-sm font-medium transition-colors",
            modifiers.renal.enabled
              ? "border-sky-500 bg-sky-500/10 text-sky-800 dark:text-sky-100"
              : "border-zinc-300 bg-transparent text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
          ].join(" ")}
        >
          eGFR / Cockcroft–Gault
        </button>
      </div>

      {modifiers.renal.enabled ? (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-zinc-500">
              Sex
              <select
                value={modifiers.renal.sex}
                onChange={(event) =>
                  updateRenalInput("sex", event.target.value as "male" | "female")
                }
                className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label className="text-xs text-zinc-500">
              Age (years)
              <input
                inputMode="decimal"
                value={modifiers.renal.ageYears}
                onChange={(event) => updateRenalInput("ageYears", event.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
            <label className="text-xs text-zinc-500">
              Weight (kg)
              <input
                inputMode="decimal"
                value={modifiers.renal.weightKg}
                onChange={(event) => updateRenalInput("weightKg", event.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
            <label className="text-xs text-zinc-500">
              Serum creatinine (mg/dL)
              <input
                inputMode="decimal"
                value={modifiers.renal.serumCreatinineMgDl}
                onChange={(event) =>
                  updateRenalInput("serumCreatinineMgDl", event.target.value)
                }
                className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
          </div>
          <div className="mt-3 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950/70">
            {renalEstimate.value !== null ? (
              <>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Cockcroft–Gault: {renalEstimate.value.toFixed(0)} mL/min
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {renalEstimate.band === "lt30"
                    ? "Modifier rules for reduced renal function below 30 mL/min are active."
                    : renalEstimate.band === "30to59"
                      ? "Modifier rules for reduced renal function 30–59 mL/min are active."
                      : "No renal modifier rules are active above 60 mL/min."}
                </p>
              </>
            ) : (
              <p className="text-xs text-zinc-500">
                Enter age, sex, weight, and serum creatinine to activate renal
                modifier rules.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
