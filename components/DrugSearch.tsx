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

type Row = {
  id: string;
  title: string;
  subtitle?: string;
  onActivate?: () => void | Promise<void>;
  disabled?: boolean;
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const addDrug = useStore((s) => s.addDrug);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
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
      }
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

  const rows: Row[] = [];
  if (localAlias) {
    const componentsLabel = localAlias.components
      .map((component) => component.name)
      .join(" + ");
    rows.push({
      id: `alias-expand-${localAlias.label}`,
      title: `Expand to ${localAlias.components.length} ingredient${localAlias.components.length === 1 ? "" : "s"}`,
      subtitle: `${localAlias.label} → ${componentsLabel}`,
      onActivate: () => addComponents(localAlias.components, localAlias.label),
    });
  }
  if (parsedAliasInput) {
    if (proposalLoading) {
      rows.push({
        id: "alias-loading",
        title: "Resolving alias components…",
        disabled: true,
      });
    } else if (proposal) {
      if (proposal.unresolvedTerms.length === 0 && proposal.components.length > 0) {
        const componentsLabel = proposal.components
          .map((component) => component.name)
          .join(" + ");
        rows.push({
          id: "alias-save",
          title: "Save alias and add",
          subtitle: `${proposal.term} → ${componentsLabel}`,
          onActivate: saveProposalAndAdd,
        });
      } else {
        rows.push({
          id: "alias-unresolved",
          title: `Resolve all RHS terms before saving. Unmatched: ${proposal.unresolvedTerms.join(", ")}`,
          disabled: true,
        });
      }
    }
  }
  if (loading && !parsedAliasInput) {
    rows.push({ id: "searching", title: "Searching…", disabled: true });
  }
  for (const result of results) {
    rows.push({
      id: `result-${result.rxcui}`,
      title: result.name,
      subtitle: `RxCUI ${result.rxcui}`,
      onActivate: () => pick(result),
    });
  }
  if (shouldShowTeachHint) {
    rows.push({
      id: "teach",
      title: `Teach: "${term}" = ?`,
      subtitle: "Save a local alias by choosing ingredient components through RxNorm.",
      onActivate: () => setTeachOpen(true),
    });
  }

  const canActivate = (i: number) => Boolean(rows[i]?.onActivate && !rows[i]?.disabled);

  function firstSelectable(direction: 1 | -1) {
    if (direction === 1) {
      for (let i = 0; i < rows.length; i += 1) if (canActivate(i)) return i;
    } else {
      for (let i = rows.length - 1; i >= 0; i -= 1) if (canActivate(i)) return i;
    }
    return -1;
  }

  function nextSelectable(from: number, direction: 1 | -1) {
    const n = rows.length;
    if (n === 0) return -1;
    for (let step = 1; step <= n; step += 1) {
      const i = ((from + direction * step) % n + n) % n;
      if (canActivate(i)) return i;
    }
    return from;
  }

  useEffect(() => {
    if (activeIndex < 0) return;
    const container = listRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>(
      `[data-row-index="${activeIndex}"]`
    );
    target?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      if (!open && rows.length > 0) {
        event.preventDefault();
        setOpen(true);
        setActiveIndex(firstSelectable(1));
        return;
      }
      if (!open) return;
      event.preventDefault();
      setActiveIndex((prev) =>
        prev < 0 ? firstSelectable(1) : nextSelectable(prev, 1)
      );
      return;
    }
    if (event.key === "ArrowUp") {
      if (!open) return;
      event.preventDefault();
      setActiveIndex((prev) =>
        prev < 0 ? firstSelectable(-1) : nextSelectable(prev, -1)
      );
      return;
    }
    if (event.key === "Enter") {
      if (!open || activeIndex < 0) return;
      const row = rows[activeIndex];
      if (row?.onActivate && !row.disabled) {
        event.preventDefault();
        void row.onActivate();
      }
    }
  }

  const effectiveActive = canActivate(activeIndex) ? activeIndex : -1;
  const showList = open && rows.length > 0;

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
            setActiveIndex(-1);
            if (nextQ.trim().length < 2) {
              abortRef.current?.abort();
              setResults([]);
              setLoading(false);
            }
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
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
          role="combobox"
          aria-expanded={showList}
          aria-controls="drug-search-list"
          aria-autocomplete="list"
          aria-activedescendant={
            effectiveActive >= 0 ? `drug-search-row-${effectiveActive}` : undefined
          }
          className="w-full h-12 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-base outline-none ring-0 focus:ring-2 focus:ring-sky-500 placeholder:text-zinc-500"
        />

        {bulkMessage ? (
          <p className="mt-2 text-xs text-zinc-500">{bulkMessage}</p>
        ) : null}

        {showList ? (
          <div
            id="drug-search-list"
            ref={listRef}
            role="listbox"
            className="absolute z-20 mt-2 max-h-80 w-full divide-y divide-zinc-200 overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900"
          >
            {rows.map((row, index) => {
              const isActive = index === effectiveActive;
              const baseClass =
                "block min-h-12 w-full px-4 py-3 text-left";
              if (!row.onActivate || row.disabled) {
                return (
                  <div
                    key={row.id}
                    id={`drug-search-row-${index}`}
                    data-row-index={index}
                    className="px-4 py-3 text-sm text-zinc-500"
                  >
                    {row.title}
                  </div>
                );
              }
              return (
                <button
                  key={row.id}
                  id={`drug-search-row-${index}`}
                  data-row-index={index}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => void row.onActivate?.()}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={[
                    baseClass,
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800",
                  ].join(" ")}
                >
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {row.title}
                  </p>
                  {row.subtitle ? (
                    <p className="mt-0.5 text-xs text-zinc-500">{row.subtitle}</p>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <AliasTeachModal
        key={`${teachOpen ? term : "closed"}-${aliases.length}`}
        open={teachOpen}
        initialTerm={term}
        onClose={() => setTeachOpen(false)}
        onAliasesChange={onAliasesChange}
        onAddComponents={(components, viaBrand) => addComponents(components, viaBrand)}
      />
    </>
  );
}
