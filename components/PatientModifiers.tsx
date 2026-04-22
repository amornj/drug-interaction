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
    <section>
      <div className="flex items-baseline justify-between border-b border-rule pb-2">
        <div>
          <p className="eyebrow">Patient Modifiers</p>
          <p className="mt-0.5 text-[11px] italic text-ink-mute">
            Local rules re-rank displayed urgency.
          </p>
        </div>
        <button
          type="button"
          onClick={resetPatientModifiers}
          className="text-[11px] uppercase tracking-[0.12em] text-ink-mute hover:text-accent"
        >
          Reset
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-1 gap-y-2">
        {flagModifiers.map((modifier) => {
          const enabled = modifiers[modifier.key];
          return (
            <button
              key={modifier.key}
              type="button"
              aria-pressed={enabled}
              onClick={() => setModifierFlag(modifier.key, !enabled)}
              className={[
                "min-h-11 border px-3 text-[13px] font-medium tracking-[0.02em] transition-colors",
                enabled
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-rule text-ink-soft hover:border-rule-strong hover:text-ink",
              ].join(" ")}
            >
              {enabled ? "▪ " : ""}
              {modifier.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={modifiers.renal.enabled}
          onClick={() => updateRenalInput("enabled", !modifiers.renal.enabled)}
          className={[
            "min-h-11 border px-3 text-[13px] font-medium tracking-[0.02em] transition-colors",
            modifiers.renal.enabled
              ? "border-accent bg-accent-soft text-accent"
              : "border-rule text-ink-soft hover:border-rule-strong hover:text-ink",
          ].join(" ")}
        >
          {modifiers.renal.enabled ? "▪ " : ""}eGFR · Cockcroft–Gault
        </button>
      </div>

      {modifiers.renal.enabled ? (
        <div className="mt-4 border border-rule border-l-2 border-l-accent bg-paper-raised p-3">
          <p className="eyebrow mb-3">Cockcroft–Gault Inputs</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="stamp block">
              Sex
              <select
                value={modifiers.renal.sex}
                onChange={(event) =>
                  updateRenalInput("sex", event.target.value as "male" | "female")
                }
                className="mt-1 h-11 w-full border border-rule bg-paper px-3 text-[14px] text-ink"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label className="stamp block">
              Age (years)
              <input
                inputMode="decimal"
                value={modifiers.renal.ageYears}
                onChange={(event) => updateRenalInput("ageYears", event.target.value)}
                className="mt-1 h-11 w-full border border-rule bg-paper px-3 font-mono text-[14px] tabular-nums text-ink"
              />
            </label>
            <label className="stamp block">
              Weight (kg)
              <input
                inputMode="decimal"
                value={modifiers.renal.weightKg}
                onChange={(event) => updateRenalInput("weightKg", event.target.value)}
                className="mt-1 h-11 w-full border border-rule bg-paper px-3 font-mono text-[14px] tabular-nums text-ink"
              />
            </label>
            <label className="stamp block">
              Creatinine (mg/dL)
              <input
                inputMode="decimal"
                value={modifiers.renal.serumCreatinineMgDl}
                onChange={(event) =>
                  updateRenalInput("serumCreatinineMgDl", event.target.value)
                }
                className="mt-1 h-11 w-full border border-rule bg-paper px-3 font-mono text-[14px] tabular-nums text-ink"
              />
            </label>
          </div>
          <div className="mt-3 border-t border-rule pt-3">
            {renalEstimate.value !== null ? (
              <>
                <p className="font-serif text-[20px] italic text-ink">
                  {renalEstimate.value.toFixed(0)}
                  <span className="ml-1 font-mono text-[11px] not-italic text-ink-mute">
                    mL/min
                  </span>
                </p>
                <p className="mt-1 text-[12px] italic text-ink-mute">
                  {renalEstimate.band === "lt30"
                    ? "Rules for < 30 mL/min are active."
                    : renalEstimate.band === "30to59"
                    ? "Rules for 30–59 mL/min are active."
                    : "No renal modifier rules active above 60 mL/min."}
                </p>
              </>
            ) : (
              <p className="text-[12px] italic text-ink-mute">
                Enter age, sex, weight, and creatinine to activate rules.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
