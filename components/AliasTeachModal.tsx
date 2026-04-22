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
}: {
  row: PickerRow;
  onChange: (next: PickerRow) => void;
  onRemove: () => void;
  canRemove: boolean;
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
    <div className="rounded-2xl border border-zinc-200/80 p-3 dark:border-zinc-800">
      <div className="flex items-center gap-2">
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
          className="h-11 flex-1 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="min-h-11 rounded-xl px-3 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Remove
          </button>
        ) : null}
      </div>
      {row.selected ? (
        <p className="mt-2 text-xs text-zinc-500">
          Selected: {row.selected.name} · RxCUI {row.selected.rxcui}
        </p>
      ) : null}
      {loading ? (
        <p className="mt-2 text-xs text-zinc-500">Searching…</p>
      ) : null}
      {results.length > 0 ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
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
              className="block min-h-11 w-full border-t border-zinc-200 px-3 py-2 text-left first:border-t-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <p className="text-sm text-zinc-900 dark:text-zinc-100">
                {result.name}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">RxCUI {result.rxcui}</p>
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

    const nextAliases = await upsertUserAlias(
      {
        term,
        components,
      }
    );

    onAliasesChange(nextAliases);
    onAddComponents(components, term.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 px-4 py-6">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-4 shadow-xl dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Teach alias
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Save a local brand-to-ingredient alias using RxNorm-confirmed components only.
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

        <label className="mt-4 block text-xs text-zinc-500">
          Alias term
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>

        <div className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <RxNormPicker
              key={row.id}
              row={row}
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
          className="mt-3 min-h-11 rounded-xl border border-zinc-300 px-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
        >
          Add component
        </button>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={saveAlias}
            disabled={!canSave}
            className={[
              "min-h-11 rounded-xl px-3 text-sm font-medium transition-colors",
              canSave
                ? "bg-sky-600 text-white active:bg-sky-700"
                : "bg-sky-600/50 text-white/80",
            ].join(" ")}
          >
            Save alias and add
          </button>
        </div>
      </div>
    </div>
  );
}
