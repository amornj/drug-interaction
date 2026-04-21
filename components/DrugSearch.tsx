"use client";

import { useEffect, useRef, useState } from "react";
import type { DrugCandidate } from "@/lib/rxnorm";
import { useStore } from "@/lib/store";

export function DrugSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<DrugCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const addDrug = useStore((s) => s.addDrug);
  const abortRef = useRef<AbortController | null>(null);
  const term = q.trim();

  useEffect(() => {
    if (term.length < 2) {
      return;
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/drugs/search?q=${encodeURIComponent(term)}`,
          { signal: ctrl.signal }
        );
        const json = (await res.json()) as { results: DrugCandidate[] };
        setResults(json.results ?? []);
      } catch {
        // ignore abort/network
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [term]);

  function pick(c: DrugCandidate) {
    addDrug({ rxcui: c.rxcui, name: c.name });
    setQ("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={q}
        onChange={(e) => {
          const nextQ = e.target.value;
          setQ(nextQ);
          if (nextQ.trim().length < 2) {
            abortRef.current?.abort();
            setResults([]);
            setLoading(false);
          }
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search drug (generic or brand)…"
        className="w-full h-12 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-base outline-none ring-0 focus:ring-2 focus:ring-sky-500 placeholder:text-zinc-500"
      />
      {open && (results.length > 0 || loading) && (
        <ul className="absolute z-20 mt-2 w-full rounded-xl bg-white dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {loading && (
            <li className="px-4 py-3 text-sm text-zinc-500">Searching…</li>
          )}
          {results.map((r) => (
            <li key={r.rxcui}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-700 min-h-12"
              >
                <div className="text-base leading-tight">{r.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  RxCUI {r.rxcui}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
