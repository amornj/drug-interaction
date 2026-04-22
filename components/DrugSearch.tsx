"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AliasTeachModal } from "@/components/AliasTeachModal";
import {
  parseAliasInput,
  resolveAlias,
  upsertUserAlias,
  type Alias,
  type AliasComponent,
} from "@/lib/aliases";
import type { DrugCandidate } from "@/lib/rxnorm";
import { useStore } from "@/lib/store";

const bulkSplitPattern = /[\n,;]+/;
const bulkPrefixPattern = /^(meds?|medications?)\s*:\s*/i;
const dosageTailPattern =
  /\s+(?:\d+(?:[./]\d+)?(?:\s*(?:mg|mcg|g|ml|units?|iu|meq|%)\b)?(?:\s*[x*]\s*\d+(?:\/\d+)?)?.*)$/i;

type InlineAliasProposal = {
  term: string;
  components: AliasComponent[];
  unresolvedTerms: string[];
};

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

function dedupeComponents(components: AliasComponent[]) {
  const seen = new Set<string>();
  return components.filter((component) => {
    if (seen.has(component.rxcui)) {
      return false;
    }
    seen.add(component.rxcui);
    return true;
  });
}

export function DrugSearch({
  aliases,
  onAliasesChange,
}: {
  aliases: Alias[];
  onAliasesChange: (aliases: Alias[]) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<DrugCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [proposal, setProposal] = useState<InlineAliasProposal | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [teachOpen, setTeachOpen] = useState(false);
  const addDrug = useStore((s) => s.addDrug);
  const abortRef = useRef<AbortController | null>(null);
  const term = q.trim();
  const parsedAliasInput = useMemo(() => parseAliasInput(q), [q]);
  const localAlias = useMemo(() => resolveAlias(term, aliases), [aliases, term]);

  function addComponents(components: AliasComponent[], viaBrand: string) {
    for (const component of dedupeComponents(components)) {
      addDrug({
        rxcui: component.rxcui,
        name: component.name,
        viaBrand,
      });
    }
    setQ("");
    setResults([]);
    setProposal(null);
    setOpen(false);
    setBulkMessage(null);
  }

  const resolveTokenToComponents = useCallback(
    async (token: string) => {
      const alias = resolveAlias(token, aliases);
      if (alias) {
        return alias.components;
      }

      const response = await fetch(`/api/drugs/search?q=${encodeURIComponent(token)}`);
      const payload = (await response.json()) as { results?: DrugCandidate[] };
      const match = payload.results?.[0];

      return match ? [{ rxcui: match.rxcui, name: match.name }] : null;
    },
    [aliases]
  );

  useEffect(() => {
    if (!parsedAliasInput) {
      return;
    }

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      setProposalLoading(true);
      const resolvedComponents: AliasComponent[] = [];
      const unresolvedTerms: string[] = [];

      for (const token of parsedAliasInput.componentTerms) {
        try {
          const resolved = await resolveTokenToComponents(token);
          if (!resolved || resolved.length === 0) {
            unresolvedTerms.push(token);
            continue;
          }
          resolvedComponents.push(...resolved);
        } catch {
          unresolvedTerms.push(token);
        }
      }

      if (!cancelled) {
        setProposal({
          term: parsedAliasInput.term,
          components: dedupeComponents(resolvedComponents),
          unresolvedTerms,
        });
        setProposalLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [parsedAliasInput, resolveTokenToComponents]);

  useEffect(() => {
    if (parsedAliasInput || term.length < 2) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const response = await fetch(
          `/api/drugs/search?q=${encodeURIComponent(term)}`,
          { signal: ctrl.signal }
        );
        const payload = (await response.json()) as { results?: DrugCandidate[] };
        setResults(payload.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [parsedAliasInput, term]);

  function pick(candidate: DrugCandidate) {
    addDrug({ rxcui: candidate.rxcui, name: candidate.name });
    setQ("");
    setResults([]);
    setOpen(false);
    setBulkMessage(null);
  }

  async function saveProposalAndAdd() {
    if (!proposal || proposal.unresolvedTerms.length > 0 || proposal.components.length === 0) {
      return;
    }

    const nextAliases = await upsertUserAlias(
      {
        term: proposal.term,
        components: proposal.components,
      },
      aliases
    );
    onAliasesChange(nextAliases);
    addComponents(proposal.components, proposal.term.trim());
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
        const alias = resolveAlias(candidateTerm, aliases);
        if (alias) {
          addComponents(alias.components, alias.label);
          added += alias.components.length;
          continue;
        }

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

  const shouldShowTeachHint =
    !parsedAliasInput &&
    !localAlias &&
    !loading &&
    term.length >= 2 &&
    results.length === 0;

  return (
    <>
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
          onChange={(event) => {
            const nextQ = event.target.value;
            setQ(nextQ);
            setBulkMessage(null);
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

        {open &&
        (Boolean(localAlias) ||
          Boolean(parsedAliasInput) ||
          results.length > 0 ||
          loading ||
          (Boolean(parsedAliasInput) && proposalLoading) ||
          shouldShowTeachHint) ? (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl bg-white shadow-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
            {localAlias ? (
              <button
                type="button"
                onClick={() => addComponents(localAlias.components, localAlias.label)}
                className="block min-h-12 w-full border-b border-zinc-200 px-4 py-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Expand to {localAlias.components.length} ingredient
                  {localAlias.components.length === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {localAlias.label} →{" "}
                  {localAlias.components.map((component) => component.name).join(" + ")}
                </p>
              </button>
            ) : null}

            {parsedAliasInput ? (
              proposalLoading ? (
                <div className="px-4 py-3 text-sm text-zinc-500">
                  Resolving alias components…
                </div>
              ) : proposal ? (
                proposal.unresolvedTerms.length === 0 && proposal.components.length > 0 ? (
                  <button
                    type="button"
                    onClick={saveProposalAndAdd}
                    className="block min-h-12 w-full border-b border-zinc-200 px-4 py-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  >
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Save alias and add
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {proposal.term} →{" "}
                      {proposal.components.map((component) => component.name).join(" + ")}
                    </p>
                  </button>
                ) : (
                  <div className="border-b border-zinc-200 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800">
                    Resolve all RHS terms before saving. Unmatched:{" "}
                    {proposal.unresolvedTerms.join(", ")}
                  </div>
                )
              ) : null
            ) : null}

            {loading && !parsedAliasInput ? (
              <div className="px-4 py-3 text-sm text-zinc-500">Searching…</div>
            ) : null}

            {results.map((result) => (
              <button
                key={result.rxcui}
                type="button"
                onClick={() => pick(result)}
                className="block min-h-12 w-full border-t border-zinc-200 px-4 py-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                <p className="text-base leading-tight text-zinc-900 dark:text-zinc-100">
                  {result.name}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">RxCUI {result.rxcui}</p>
              </button>
            ))}

            {shouldShowTeachHint ? (
              <button
                type="button"
                onClick={() => setTeachOpen(true)}
                className="block min-h-12 w-full border-t border-zinc-200 px-4 py-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Teach: &quot;{term}&quot; = ?
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Save a local alias by choosing ingredient components through RxNorm.
                </p>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <AliasTeachModal
        key={`${teachOpen ? term : "closed"}-${aliases.length}`}
        open={teachOpen}
        initialTerm={term}
        aliases={aliases}
        onClose={() => setTeachOpen(false)}
        onAliasesChange={onAliasesChange}
        onAddComponents={(components, viaBrand) => addComponents(components, viaBrand)}
      />
    </>
  );
}
