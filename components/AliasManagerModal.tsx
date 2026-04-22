"use client";

import { useRef, useState } from "react";
import type { Alias } from "@/lib/aliases";
import { removeUserAlias, saveUserAliases } from "@/lib/aliases";

export function AliasManagerModal({
  open,
  aliases,
  onClose,
  onAliasesChange,
}: {
  open: boolean;
  aliases: Alias[];
  onClose: () => void;
  onAliasesChange: (aliases: Alias[]) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) {
    return null;
  }

  async function removeAlias(term: string) {
    const nextAliases = await removeUserAlias(term, aliases);
    onAliasesChange(nextAliases);
    setMessage(`Removed alias "${term}".`);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(aliases, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "drug-interaction-aliases.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Exported aliases JSON.");
  }

  async function importJson(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Alias[];
      const nextAliases = await saveUserAliases(
        parsed.map((alias) => ({
          ...alias,
          source: "user",
        }))
      );
      onAliasesChange(nextAliases);
      setMessage(`Imported ${nextAliases.length} aliases.`);
    } catch {
      setMessage("Could not import aliases JSON.");
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 px-4 py-6">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-4 shadow-xl dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Alias database
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Local only. User aliases override the curated brand overlay on this device.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl px-3 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Close
          </button>
        </div>

        <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto">
          {aliases.length > 0 ? (
            aliases.map((alias) => (
              <div
                key={alias.term}
                className="rounded-2xl border border-zinc-200/80 px-3 py-3 dark:border-zinc-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {alias.term}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {alias.components.map((component) => component.name).join(" + ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAlias(alias.term)}
                    className="min-h-11 rounded-xl px-3 text-xs font-medium text-red-600 hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-zinc-200/80 px-3 py-4 text-sm text-zinc-500 dark:border-zinc-800">
              No saved aliases yet.
            </div>
          )}
        </div>

        {message ? (
          <p className="mt-3 text-xs text-zinc-500">{message}</p>
        ) : null}

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={exportJson}
            className="min-h-11 rounded-xl border border-zinc-300 px-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-11 rounded-xl border border-zinc-300 px-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          >
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                importJson(file);
              }
              event.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}
