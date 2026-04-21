"use client";

import { useStore } from "@/lib/store";

export function CaseSwitcher() {
  const cases = useStore((s) => s.cases);
  const activeCaseId = useStore((s) => s.activeCaseId);
  const selectCase = useStore((s) => s.selectCase);
  const addCase = useStore((s) => s.addCase);
  const renameCase = useStore((s) => s.renameCase);

  const active = cases.find((c) => c.id === activeCaseId);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-2">
          {cases.map((c) => {
            const isActive = c.id === activeCaseId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => selectCase(c.id)}
                className={
                  "shrink-0 px-3 h-9 rounded-full text-sm font-medium " +
                  (isActive
                    ? "bg-sky-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300")
                }
              >
                {c.label}
                {isActive ? ` · ${c.drugs.length}` : ""}
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          if (!active) return addCase();
          const next = prompt("Rename case", active.label);
          if (next && next.trim()) renameCase(active.id, next.trim());
        }}
        className="h-9 px-3 rounded-full text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
      >
        Rename
      </button>
      <button
        type="button"
        onClick={addCase}
        aria-label="New case"
        className="h-9 w-9 grid place-items-center rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
      >
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden>
          <path
            d="M10 4v12M4 10h12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
