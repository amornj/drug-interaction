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
    const nextAliases = await removeUserAlias(term);
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

  const smallButton =
    "min-h-11 border border-rule px-3 text-[11.5px] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-rule-strong hover:text-ink disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-ink/60 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto max-w-xl border border-rule-strong bg-paper p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-rule pb-3">
          <div>
            <p className="eyebrow text-accent">Alias Database</p>
            <h2 className="serif-display mt-1 text-[24px] text-ink">
              Personal <span className="italic">dictionary</span>
            </h2>
            <p className="mt-1 text-[12px] italic text-ink-mute">
              Local first. Overrides the curated brand overlay on this device.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] uppercase tracking-[0.12em] text-ink-mute hover:text-accent"
          >
            Close
          </button>
        </div>

        <div className="mt-4 max-h-[42vh] overflow-y-auto border border-rule">
          {aliases.length > 0 ? (
            aliases.map((alias, index) => (
              <div
                key={alias.term}
                className="flex items-baseline gap-3 border-b border-rule px-3 py-3 last:border-b-0"
              >
                <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-ink-mute">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[16px] italic text-ink">
                    {alias.term}
                  </p>
                  <p className="stamp mt-0.5">
                    {alias.components.map((c) => c.name).join(" + ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAlias(alias.term)}
                  className="text-[11px] uppercase tracking-[0.12em] text-ink-mute hover:text-accent"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="px-3 py-6 text-center text-[12px] italic text-ink-mute">
              No saved aliases yet.
            </p>
          )}
        </div>

        {message ? <p className="stamp mt-3">{message}</p> : null}

        <div className="mt-5 flex items-center gap-2 border-t border-rule pt-4">
          <button
            type="button"
            onClick={exportJson}
            className={smallButton}
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={smallButton}
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
