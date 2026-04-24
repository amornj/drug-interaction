"use client";

import { getDrugMetabolismAnnotations } from "@/lib/cyp";
import type { Drug } from "@/lib/store";
import { useStore } from "@/lib/store";

export function DrugChip({ drug, index }: { drug: Drug; index: number }) {
  const removeDrug = useStore((s) => s.removeDrug);
  const number = String(index + 1).padStart(2, "0");
  const annotations = getDrugMetabolismAnnotations(drug.name);
  const metaLine = [
    drug.viaBrand ? `via ${drug.viaBrand}` : null,
    annotations.length > 0 ? annotations.join("  •  ") : null,
  ]
    .filter(Boolean)
    .join("  ");

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
        {metaLine ? (
          <p className="mt-0.5 text-[11px] tracking-[0.04em] text-ink-mute">
            {metaLine}
          </p>
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
