"use client";

import { useEffect, useRef } from "react";
import type { InteractionFilters } from "@/lib/store";

export function InteractionFilterModal({
  open,
  filters,
  onClose,
  onChange,
}: {
  open: boolean;
  filters: InteractionFilters;
  onClose: () => void;
  onChange: (filter: keyof InteractionFilters, value: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open, onClose]);

  if (!open) return null;

  const summaryItems: {
    key: keyof InteractionFilters;
    label: string;
    description: string;
  }[] = [
    {
      key: "showDrugList",
      label: "Show drug list",
      description:
        "Display the current medication list inside the summary box.",
    },
  ];

  const interactionItems: {
    key: keyof InteractionFilters;
    label: string;
    description: string;
  }[] = [
    {
      key: "showPkPlausible",
      label: "Show co-substrate pairs",
      description:
        "Pairs where both drugs share a metabolic pathway but neither inhibits the other (e.g., two CYP3A4 substrates).",
    },
    {
      key: "showPdPlausible",
      label: "Show cumulative-stack pairs",
      description:
        "Pairs that share a pharmacodynamic burden domain such as QT prolongation or bleeding risk.",
    },
    {
      key: "showUnverified",
      label: "Show unverified pairs",
      description:
        "Pairs with no confirmed local PK or PD mechanism traceable in the current annotation data.",
    },
  ];

  function ToggleRow({
    item,
  }: {
    item: (typeof summaryItems)[number];
  }) {
    return (
      <label className="flex cursor-pointer items-start gap-3 py-3">
        <div className="relative mt-0.5 shrink-0">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={filters[item.key]}
            onChange={(e) => onChange(item.key, e.target.checked)}
          />
          <div className="h-5 w-9 rounded-full border border-rule bg-surface transition-colors peer-checked:border-accent peer-checked:bg-accent" />
          <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-paper shadow-sm transition-transform peer-checked:translate-x-4" />
        </div>
        <div>
          <p className="text-[13.5px] text-ink">{item.label}</p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-ink-mute">
            {item.description}
          </p>
        </div>
      </label>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div
        ref={ref}
        className="w-full max-w-sm overflow-hidden rounded-lg border border-rule-strong bg-paper-raised shadow-xl"
      >
        <div className="border-b border-rule px-5 py-4">
          <h2 className="font-serif text-[18px] italic text-ink">
            Manage display
          </h2>
          <p className="mt-1 text-[12px] leading-snug text-ink-mute">
            Toggle which elements appear in the summary and interaction results.
          </p>
        </div>

        <div className="border-b border-rule px-5 py-3">
          <p className="eyebrow mb-1">Manage Summary box</p>
          {summaryItems.map((item) => (
            <ToggleRow key={item.key} item={item} />
          ))}
        </div>

        <div className="px-5 py-3">
          <p className="eyebrow mb-1">Manage interactions</p>
          {interactionItems.map((item) => (
            <ToggleRow key={item.key} item={item} />
          ))}
        </div>

        <div className="flex justify-end border-t border-rule px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="eyebrow border border-rule-strong px-4 py-2 text-ink hover:bg-accent-soft"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
