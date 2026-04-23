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
const whitespaceSplitPattern = /\s+/;
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
  kind?: "alias" | "batch" | "result" | "teach" | "info";
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

function uniqueTerms(terms: string[]) {
  const seen = new Set<string>();
  return terms.filter((term) => {
    const key = term.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return term.length >= 2;
  });
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

  return uniqueTerms(segments);
}

function extractTypedBatchDrugTerms(text: string) {
  const explicitTerms = extractBulkDrugTerms(text);
  if (explicitTerms.length >= 2) {
    return explicitTerms;
  }

  const normalized = normalizeBulkSegment(text.replace(/\r/g, " "));
  if (!normalized.includes(" ")) {
    return [];
  }

  const terms = normalized
    .split(whitespaceSplitPattern)
    .map((segment) => segment.trim())
    .filter(Boolean);

  return uniqueTerms(terms);
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
  const proposalRequestRef = useRef(0);
  const term = q.trim();
  const parsedAliasInput = useMemo(() => parseAliasInput(q), [q]);
  const localAlias = useMemo(() => resolveAlias(term, aliases), [aliases, term]);
  const typedBatchTerms = useMemo(
    () => (parsedAliasInput || localAlias ? [] : extractTypedBatchDrugTerms(term)),
    [localAlias, parsedAliasInput, term]
  );

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
    setProposalLoading(false);
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
      proposalRequestRef.current += 1;
      return;
    }

    proposalRequestRef.current += 1;
    const requestId = proposalRequestRef.current;
    let cancelled = false;

    const timeout = window.setTimeout(async () => {
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

      if (!cancelled && requestId === proposalRequestRef.current) {
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
    setProposal(null);
    setProposalLoading(false);
    setOpen(false);
    setBulkMessage(null);
  }

  async function saveProposalAndAdd() {
    if (!proposal || proposal.unresolvedTerms.length > 0 || proposal.components.length === 0) {
      return;
    }

    const nextAliases = await upsertUserAlias({
      term: proposal.term,
      components: proposal.components,
    });
    onAliasesChange(nextAliases);
    addComponents(proposal.components, proposal.term.trim());
  }

  async function bulkAddDrugs(
    rawText: string,
    options: { sourceLabel?: string; splitWhitespace?: boolean } = {}
  ) {
    const terms = options.splitWhitespace
      ? extractTypedBatchDrugTerms(rawText)
      : extractBulkDrugTerms(rawText);
    const sourceLabel = options.sourceLabel ?? "pasted text";

    if (terms.length < 2) {
      return false;
    }

    abortRef.current?.abort();
    setLoading(true);
    setOpen(false);
    setResults([]);
    setProposal(null);
    setProposalLoading(false);
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
      setBulkMessage(`Added ${added} medication${added === 1 ? "" : "s"} from ${sourceLabel}.`);
      return true;
    }

    if (added > 0) {
      setBulkMessage(
        `Added ${added}. Could not match: ${unresolved.join(", ")}.`
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
      kind: "alias",
      title: `Expand to ${localAlias.components.length} ingredient${localAlias.components.length === 1 ? "" : "s"}`,
      subtitle: `${localAlias.label} → ${componentsLabel}`,
      onActivate: () => addComponents(localAlias.components, localAlias.label),
    });
  }
  if (parsedAliasInput) {
    if (proposalLoading) {
      rows.push({
        id: "alias-loading",
        kind: "info",
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
          kind: "alias",
          title: "Save alias and add",
          subtitle: `${proposal.term} → ${componentsLabel}`,
          onActivate: saveProposalAndAdd,
        });
      } else {
        rows.push({
          id: "alias-unresolved",
          kind: "info",
          title: `Resolve all RHS terms before saving. Unmatched: ${proposal.unresolvedTerms.join(", ")}`,
          disabled: true,
        });
      }
    }
  }
  if (loading && !parsedAliasInput) {
    rows.push({
      id: "searching",
      kind: "info",
      title: "Searching RxNorm…",
      disabled: true,
    });
  }
  if (!loading && typedBatchTerms.length >= 2) {
    rows.push({
      id: `batch-${typedBatchTerms.join("|")}`,
      kind: "batch",
      title: `Add all matched terms`,
      subtitle: typedBatchTerms.join(", "),
    });
  }
  for (const result of results) {
    rows.push({
      id: `result-${result.rxcui}`,
      kind: "result",
      title: result.name,
      subtitle: `RxCUI ${result.rxcui}`,
      onActivate: () => pick(result),
    });
  }
  if (shouldShowTeachHint) {
    rows.push({
      id: "teach",
      kind: "teach",
      title: `Teach: "${term}" = ?`,
      subtitle: "Save a local alias by choosing ingredient components.",
      onActivate: () => setTeachOpen(true),
    });
  }

  const canActivate = (i: number) =>
    Boolean((rows[i]?.onActivate || rows[i]?.kind === "batch") && !rows[i]?.disabled);

  function activateRow(row: Row | undefined) {
    if (!row || row.disabled) {
      return;
    }

    if (row.kind === "batch") {
      void bulkAddDrugs(term, {
        sourceLabel: "search terms",
        splitWhitespace: true,
      });
      return;
    }

    void row.onActivate?.();
  }

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
      if ((!open || activeIndex < 0) && typedBatchTerms.length >= 2) {
        event.preventDefault();
        void bulkAddDrugs(term, {
          sourceLabel: "search terms",
          splitWhitespace: true,
        });
        return;
      }
      if (!open || activeIndex < 0) return;
      const row = rows[activeIndex];
      if (canActivate(activeIndex)) {
        event.preventDefault();
        activateRow(row);
      }
    }
  }

  const effectiveActive = canActivate(activeIndex) ? activeIndex : -1;
  const showList = open && rows.length > 0;

  return (
    <>
      <div className="relative isolate">
        <div className="flex items-center gap-3 border-b border-rule-strong pb-2">
          <svg
            viewBox="0 0 20 20"
            width="15"
            height="15"
            aria-hidden
            className="shrink-0 text-ink-mute"
          >
            <circle
              cx="9"
              cy="9"
              r="5.25"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <path
              d="M13 13l4 4"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
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
            placeholder="Add a medication — generic or brand"
            role="combobox"
            aria-expanded={showList}
            aria-controls="drug-search-list"
            aria-autocomplete="list"
            aria-activedescendant={
              effectiveActive >= 0 ? `drug-search-row-${effectiveActive}` : undefined
            }
            className="h-11 w-full border-0 bg-transparent py-1 text-[15.5px] font-normal text-ink outline-none placeholder:text-ink-mute placeholder:italic focus:ring-0"
          />
        </div>

        {bulkMessage ? (
          <p className="mt-2 stamp">{bulkMessage}</p>
        ) : null}

        {showList ? (
          <div
            id="drug-search-list"
            ref={listRef}
            role="listbox"
            className="relative z-10 mt-3 max-h-80 w-full overflow-auto border border-rule-strong bg-paper-raised shadow-[0_18px_40px_rgba(26,22,17,0.12)]"
          >
            {rows.map((row, index) => {
              const isActive = index === effectiveActive;
              if ((!row.onActivate && row.kind !== "batch") || row.disabled) {
                return (
                  <div
                    key={row.id}
                    id={`drug-search-row-${index}`}
                    data-row-index={index}
                    className="border-b border-rule bg-paper-raised px-4 py-3 text-[13px] italic text-ink-mute last:border-b-0"
                  >
                    {row.title}
                  </div>
                );
              }
              const isAlias = row.kind === "alias";
              const isBatch = row.kind === "batch";
              const isTeach = row.kind === "teach";
              return (
                <button
                  key={row.id}
                  id={`drug-search-row-${index}`}
                  data-row-index={index}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => activateRow(row)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={[
                    "block w-full border-b border-rule bg-paper-raised px-4 py-3 text-left transition-colors last:border-b-0",
                    isActive ? "bg-accent-soft" : "hover:bg-surface",
                  ].join(" ")}
                >
                  <div className="flex items-baseline gap-3">
                    {isAlias ? (
                      <span className="eyebrow mt-0.5 shrink-0 text-accent">
                        Alias
                      </span>
                    ) : isBatch ? (
                      <span className="eyebrow mt-0.5 shrink-0" style={{ color: "var(--good)" }}>
                        Batch
                      </span>
                    ) : isTeach ? (
                      <span className="eyebrow mt-0.5 shrink-0" style={{ color: "var(--sev-major)" }}>
                        Teach
                      </span>
                    ) : (
                      <span className="stamp mt-0.5 shrink-0">Rx</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] text-ink">{row.title}</p>
                      {row.subtitle ? (
                        <p className="mt-0.5 stamp truncate">{row.subtitle}</p>
                      ) : null}
                    </div>
                    {isActive ? (
                      <span className="shrink-0 text-ink-mute font-mono text-[11px]">
                        ↵
                      </span>
                    ) : null}
                  </div>
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
