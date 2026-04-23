"use client";

import type { PatientModifiers } from "@/lib/modifiers";
import { useStore } from "@/lib/store";

const flagModifiers = [
  { key: "hepaticImpairment", label: "Hepatic" },
  { key: "age65Plus", label: "Age ≥ 65" },
  { key: "g6pdDeficiency", label: "G6PD" },
  { key: "pregnancy", label: "Pregnancy" },
  { key: "lactation", label: "Lactation" },
] as const;

export function PatientModifiers({
  modifiers,
}: {
  modifiers: PatientModifiers;
}) {
  const setModifierFlag = useStore((s) => s.setModifierFlag);
  const updateRenalInput = useStore((s) => s.updateRenalInput);
  const resetPatientModifiers = useStore((s) => s.resetPatientModifiers);

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
          {modifiers.renal.enabled ? "▪ " : ""}Renal
        </button>
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
      </div>
    </section>
  );
}
