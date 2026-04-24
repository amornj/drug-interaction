"use client";

import { getDrugMetabolismTags } from "@/lib/cyp";
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

  return (
    <li className="group flex items-baseline gap-3 border-b border-rule py-3 last:border-b-0">
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
    </li>
  );
}
