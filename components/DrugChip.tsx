"use client";

import type { Drug } from "@/lib/store";
import { useStore } from "@/lib/store";

export function DrugChip({ drug }: { drug: Drug }) {
  const removeDrug = useStore((s) => s.removeDrug);
  return (
    <li className="flex items-center gap-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 pl-4 pr-2 py-2 min-h-12">
      <span className="flex-1 text-base leading-tight truncate">
        {drug.name}
      </span>
      <button
        type="button"
        aria-label={`Remove ${drug.name}`}
        onClick={() => removeDrug(drug.rxcui)}
        className="h-9 w-9 grid place-items-center rounded-full text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 active:bg-zinc-300 dark:active:bg-zinc-700"
      >
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden>
          <path
            d="M6 6l8 8M14 6l-8 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </button>
    </li>
  );
}
