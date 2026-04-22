"use client";

import { useEffect, useMemo, useState } from "react";
import type { Alias } from "@/lib/aliases";
import { normalizeAliasTerm, upsertUserAlias } from "@/lib/aliases";
import type { DrugCandidate } from "@/lib/rxnorm";

type PickerRow = {
  id: string;
  query: string;
  selected: DrugCandidate | null;
};

function newRow(): PickerRow {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    query: "",
    selected: null,
  };
}

function RxNormPicker({
  row,
  onChange,
  onRemove,
  canRemove,
  index,
}: {
  row: PickerRow;
  onChange: (next: PickerRow) => void;
  onRemove: () => void;
  canRemove: boolean;
  index: number;
}) {
  const [results, setResults] = useState<DrugCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const query = row.query.trim();

  useEffect(() => {
    if (query.length < 2 || row.selected?.name === row.query) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/drugs/search?q=${encodeURIComponent(query)}`
        );
        const payload = (await response.json()) as { results?: DrugCandidate[] };
        setResults(payload.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [query, row.selected?.name, row.query]);

  return (
    <div className="border border-rule bg-paper-raised p-3">
      <div className="flex items-baseline gap-3">
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-mute">
          {String(index + 1).padStart(2, "0")}
        </span>
        <input
          value={row.query}
          onChange={(event) =>
            onChange({
              ...row,
              query: event.target.value,
              selected:
                row.selected?.name === event.target.value ? row.selected : null,
            })
          }
          placeholder="Search component"
          className="h-10 flex-1 border-b border-rule bg-transparent py-1 text-[14px] text-ink outline-none placeholder:italic placeholder:text-ink-mute focus:border-accent"
        />
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-[11px] uppercase tracking-[0.12em] text-ink-mute hover:text-accent"
          >
            Remove
          </button>
        ) : null}
      </div>
      {row.selected ? (
        <p className="stamp mt-2 pl-6">
          ✓ {row.selected.name} · RxCUI {row.selected.rxcui}
        </p>
      ) : null}
      {loading ? (
        <p className="stamp mt-2 pl-6 italic">Searching RxNorm…</p>
      ) : null}
      {results.length > 0 ? (
        <div className="mt-2 border border-rule">
          {results.map((result) => (
            <button
              key={result.rxcui}
              type="button"
              onClick={() =>
                onChange({
                  ...row,
                  query: result.name,
                  selected: result,
                })
              }
              className="block w-full border-b border-rule px-3 py-2 text-left last:border-b-0 hover:bg-surface"
            >
              <p className="text-[14px] text-ink">{result.name}</p>
              <p className="stamp mt-0.5">RxCUI {result.rxcui}</p>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AliasTeachModal({
  open,
  initialTerm,
  onClose,
  onAliasesChange,
  onAddComponents,
}: {
  open: boolean;
  initialTerm: string;
  onClose: () => void;
  onAliasesChange: (aliases: Alias[]) => void;
  onAddComponents: (
    components: Array<{ rxcui: string; name: string }>,
    viaBrand: string
  ) => void;
}) {
  const [term, setTerm] = useState(() => initialTerm);
  const [rows, setRows] = useState<PickerRow[]>(() => [newRow(), newRow()]);

  const canSave = useMemo(
    () =>
      normalizeAliasTerm(term).length >= 2 &&
      rows.length > 0 &&
      rows.every((row) => row.selected),
    [rows, term]
  );

  if (!open) {
    return null;
  }

  async function saveAlias() {
    if (!canSave) {
      return;
    }

    const components = rows
      .map((row) => row.selected)
      .filter((row): row is DrugCandidate => row !== null)
      .map((row) => ({ rxcui: row.rxcui, name: row.name }));

    const nextAliases = await upsertUserAlias({
      term,
      components,
    });

    onAliasesChange(nextAliases);
    onAddComponents(components, term.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 bg-ink/60 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto max-w-xl border border-rule-strong bg-paper p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-rule pb-3">
          <div>
            <p className="eyebrow" style={{ color: "var(--sev-major)" }}>
              Teach Alias
            </p>
            <h2 className="serif-display mt-1 text-[22px] text-ink">
              New <span className="italic">alias</span>
            </h2>
            <p className="mt-1 text-[12px] italic text-ink-mute">
              RxNorm-confirmed components only.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[11px] uppercase tracking-[0.12em] text-ink-mute hover:text-accent"
          >
            Close
          </button>
        </div>

        <label className="stamp mt-4 block">
          Alias term
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            className="mt-1 h-11 w-full border-b border-rule-strong bg-transparent py-1 font-serif text-[18px] italic text-ink outline-none focus:border-accent"
          />
        </label>

        <div className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <RxNormPicker
              key={row.id}
              row={row}
              index={index}
              onChange={(nextRow) =>
                setRows((current) =>
                  current.map((existing) =>
                    existing.id === nextRow.id ? nextRow : existing
                  )
                )
              }
              onRemove={() =>
                setRows((current) => current.filter((existing) => existing.id !== row.id))
              }
              canRemove={rows.length > 1 && index > 0}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setRows((current) => [...current, newRow()])}
          className="eyebrow mt-3 border border-rule px-3 py-2 text-ink-soft hover:border-rule-strong hover:text-ink"
        >
          + Add component
        </button>

        <div className="mt-5 flex items-center gap-3 border-t border-rule pt-4">
          <button
            type="button"
            onClick={saveAlias}
            disabled={!canSave}
            className={[
              "min-h-11 px-4 text-[12px] uppercase tracking-[0.12em] transition-colors",
              canSave
                ? "border border-accent bg-accent text-paper hover:bg-accent/90"
                : "border border-rule text-ink-mute",
            ].join(" ")}
          >
            Save alias & add
          </button>
          {!canSave ? (
            <p className="text-[11px] italic text-ink-mute">
              Resolve all components to enable save
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
