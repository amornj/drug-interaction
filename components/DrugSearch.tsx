"use client";

import { useEffect, useRef, useState } from "react";
import type { DrugCandidate } from "@/lib/rxnorm";
import { useStore } from "@/lib/store";

const bulkSplitPattern = /[\n,;]+/;
const bulkPrefixPattern = /^(meds?|medications?)\s*:\s*/i;
const dosageTailPattern =
  /\s+(?:\d+(?:[./]\d+)?(?:\s*(?:mg|mcg|g|ml|units?|iu|meq|%)\b)?(?:\s*[x*]\s*\d+(?:\/\d+)?)?.*)$/i;

function normalizeBulkSegment(segment: string) {
  const stripped = segment
    .replace(bulkPrefixPattern, "")
    .replace(/^[\s\-•*]+/, "")
    .trim();

  if (!stripped) {
    return "";
  }

  const withoutDose = stripped.replace(dosageTailPattern, "").trim();
  return withoutDose || stripped;
}

function extractBulkDrugTerms(text: string) {
  const normalized = text.replace(/\r/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const segments = normalized
    .split(bulkSplitPattern)
    .map(normalizeBulkSegment)
    .filter(Boolean);

  return segments.filter(
    (segment, index) => segments.indexOf(segment) === index && segment.length >= 2
  );
}

export function DrugSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<DrugCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
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
    setBulkMessage(null);
  }

  async function bulkAddDrugs(rawText: string) {
    const terms = extractBulkDrugTerms(rawText);
    if (terms.length < 2) {
      return false;
    }

    abortRef.current?.abort();
    setLoading(true);
    setOpen(false);
    setResults([]);
    setQ("");
    setBulkMessage(null);

    let added = 0;
    const unresolved: string[] = [];

    for (const candidateTerm of terms) {
      try {
        const response = await fetch(
          `/api/drugs/search?q=${encodeURIComponent(candidateTerm)}`
        );
        const payload = (await response.json()) as { results?: DrugCandidate[] };
        const match = payload.results?.[0];

        if (!match) {
          unresolved.push(candidateTerm);
          continue;
        }

        addDrug({ rxcui: match.rxcui, name: match.name });
        added += 1;
      } catch {
        unresolved.push(candidateTerm);
      }
    }

    setLoading(false);

    if (added > 0 && unresolved.length === 0) {
      setBulkMessage(`Added ${added} medication${added === 1 ? "" : "s"} from pasted text.`);
      return true;
    }

    if (added > 0) {
      setBulkMessage(
        `Added ${added} medication${added === 1 ? "" : "s"}. Could not match: ${unresolved.join(", ")}.`
      );
      return true;
    }

    setBulkMessage(`Could not match pasted medications: ${unresolved.join(", ")}.`);
    return true;
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
        onPaste={async (event) => {
          const pastedText = event.clipboardData.getData("text");
          if (extractBulkDrugTerms(pastedText).length < 2) {
            return;
          }

          event.preventDefault();
          await bulkAddDrugs(pastedText);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search drug (generic or brand)…"
        className="w-full h-12 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-base outline-none ring-0 focus:ring-2 focus:ring-sky-500 placeholder:text-zinc-500"
      />
      {bulkMessage ? (
        <p className="mt-2 text-xs text-zinc-500">{bulkMessage}</p>
      ) : null}
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
