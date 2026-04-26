"use client";

import { getDrugMetabolismTags, getMetabolismReference } from "@/lib/cyp";
import type { Drug } from "@/lib/store";
import { useStore } from "@/lib/store";

export function DrugChip({
  drug,
  index,
  activeReferenceSystem,
  onToggleReferenceSystem,
}: {
  drug: Drug;
  index: number;
  activeReferenceSystem: string | null;
  onToggleReferenceSystem: (system: string) => void;
}) {
  const removeDrug = useStore((s) => s.removeDrug);
  const number = String(index + 1).padStart(2, "0");
  const tags = getDrugMetabolismTags(drug.name);
  const reference =
    activeReferenceSystem ? getMetabolismReference(activeReferenceSystem) : null;
  const showReference =
    reference &&
    (reference.inhibitors.length > 0 || reference.inducers.length > 0);

  return (
    <li className="group border-b border-rule py-3 last:border-b-0">
      <div className="flex items-baseline gap-3">
        <span
          className="shrink-0 font-mono text-[11px] tabular-nums text-ink-mute"
          aria-hidden
        >
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="truncate text-[15px] leading-snug text-ink">
            {drug.name}
          </p>
          {drug.viaBrand || tags.length > 0 ? (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tracking-[0.04em] text-ink-mute">
              {drug.viaBrand ? <span>via {drug.viaBrand}</span> : null}
              {tags.map((tag) =>
                tag.clickable ? (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onToggleReferenceSystem(tag.system)}
                    className={`border px-1.5 py-0.5 transition-colors ${
                      activeReferenceSystem === tag.system
                        ? "border-rule-strong bg-paper text-ink"
                        : "border-rule bg-surface text-ink-mute hover:border-rule-strong hover:text-ink"
                    }`}
                  >
                    {tag.label}
                  </button>
                ) : (
                  <span key={tag.id}>{tag.label}</span>
                )
              )}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={`Remove ${drug.name}`}
          onClick={() => removeDrug(drug.rxcui)}
          className="h-9 w-9 shrink-0 grid place-items-center rounded-full text-ink-mute transition-colors hover:bg-accent-soft hover:text-accent active:bg-accent-soft"
        >
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden>
            <path
              d="M5 5l10 10M15 5l-10 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>
      </div>
      {showReference ? (
        <div className="mt-3 ml-8 border border-rule bg-paper-raised p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">{reference.system} modifiers</p>
              <p className="mt-1 text-[13px] italic leading-snug text-ink-mute">
                Inhibitors and inducers relevant to this substrate.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleReferenceSystem(reference.system)}
              className="grid h-8 w-8 shrink-0 place-items-center border border-rule text-[14px] text-ink-soft transition-colors hover:border-rule-strong hover:text-ink"
              aria-label={`Close ${reference.system} modifier list`}
            >
              ×
            </button>
          </div>
          <div className="mt-3 max-h-[38vh] overflow-y-auto space-y-3">
            {reference.inhibitors.length > 0 ? (
              <div>
                <p className="eyebrow mb-1.5">Inhibitors</p>
                <div className="flex flex-wrap gap-1.5">
                  {reference.inhibitors.map((item) => (
                    <span
                      key={`${reference.system}-inh-${item}`}
                      className="border border-rule bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {reference.inducers.length > 0 ? (
              <div>
                <p className="eyebrow mb-1.5">Inducers</p>
                <div className="flex flex-wrap gap-1.5">
                  {reference.inducers.map((item) => (
                    <span
                      key={`${reference.system}-ind-${item}`}
                      className="border border-rule bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}
