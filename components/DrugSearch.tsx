"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AliasTeachModal } from "@/components/AliasTeachModal";
import {
  normalizeTerm,
  parseAliasInput,
  upsertUserAlias,
  type Alias,
  type AliasComponent,
  type NormalizedTerm,
} from "@/lib/aliases";
import { resolveToIngredient, type DrugCandidate, type ResolvedIngredient } from "@/lib/rxnorm";
import { useActiveCase, useStore } from "@/lib/store";

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

type CombinationPending = {
  brand: string;
  components: Array<{ rxcui: string; name: string }>;
  toAdd: Array<{ rxcui: string; name: string }>;
  alreadyPresent: Array<{ rxcui: string; name: string }>;
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

function buildCombinationPending(
  brand: string,
  components: Array<{ rxcui: string; name: string }>,
  drugs: Array<{ rxcui: string }>
): CombinationPending {
  const alreadyPresent = components.filter((c) => drugs.some((d) => d.rxcui === c.rxcui));
  const toAdd = components.filter((c) => !drugs.some((d) => d.rxcui === c.rxcui));
  return { brand, components, toAdd, alreadyPresent };
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
  const [combinationPending, setCombinationPending] = useState<CombinationPending | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    typed: string;
    existing: string;
  } | null>(null);

  const addDrug = useStore((s) => s.addDrug);
  const activeCase = useActiveCase();
  const drugs = useMemo(() => activeCase?.drugs ?? [], [activeCase?.drugs]);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const proposalRequestRef = useRef(0);

  const term = q.trim();
  const parsedAliasInput = useMemo(() => parseAliasInput(q), [q]);
  const localNorm = useMemo(() => normalizeTerm(term, aliases), [aliases, term]);
  const typedBatchTerms = useMemo(
    () => (parsedAliasInput || localNorm ? [] : extractTypedBatchDrugTerms(term)),
    [localNorm, parsedAliasInput, term]
  );

  // Derived: single-ingredient alias that maps to an already-added drug.
  const aliasDuplicate = useMemo(() => {
    if (!localNorm || localNorm.type !== "single") return null;
    if (!drugs.some((d) => d.rxcui === localNorm.rxcui)) return null;
    return { typed: localNorm.brand, existing: localNorm.name };
  }, [localNorm, drugs]);

  function clearSearch() {
    setQ("");
    setResults([]);
    setProposal(null);
    setProposalLoading(false);
    setOpen(false);
    setBulkMessage(null);
    setDuplicateWarning(null);
    setCombinationPending(null);
  }

  function addComponents(components: AliasComponent[], viaBrand: string) {
    for (const component of dedupeComponents(components)) {
      addDrug({ rxcui: component.rxcui, name: component.name, viaBrand });
    }
    clearSearch();
  }

  const resolveTokenToComponents = useCallback(
    async (token: string) => {
      const norm = normalizeTerm(token, aliases);
      if (norm) {
        return norm.type === "single"
          ? [{ rxcui: norm.rxcui, name: norm.name }]
          : norm.components;
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

  // RxNorm search — skipped when localNorm (alias) found, since normalizeTerm runs first.
  useEffect(() => {
    if (parsedAliasInput || localNorm || term.length < 2) {
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
  }, [parsedAliasInput, localNorm, term]);

  async function pick(candidate: DrugCandidate) {
    setOpen(false);
    setDuplicateWarning(null);

    let resolved: ResolvedIngredient | null = null;
    try {
      resolved = await resolveToIngredient(candidate.rxcui);
    } catch {
      // fall through to add as-is
    }

    if (!resolved) {
      addDrug({ rxcui: candidate.rxcui, name: candidate.name });
      clearSearch();
      return;
    }

    if (resolved.type === "combination") {
      const pending = buildCombinationPending(candidate.name, resolved.components, drugs);
      if (pending.toAdd.length === 0) {
        setDuplicateWarning({
          typed: candidate.name,
          existing: resolved.components.map((c) => c.name).join(" + "),
        });
        return;
      }
      setQ("");
      setResults([]);
      setCombinationPending(pending);
      return;
    }

    // Single ingredient — check duplicate at ingredient level.
    if (drugs.some((d) => d.rxcui === resolved.rxcui)) {
      setDuplicateWarning({ typed: candidate.name, existing: resolved.name });
      return;
    }

    addDrug({
      rxcui: resolved.rxcui,
      name: resolved.name,
      viaBrand: candidate.name !== resolved.name ? candidate.name : undefined,
    });
    clearSearch();
  }

  function handleAliasClick(norm: NormalizedTerm) {
    if (norm.type === "single") {
      // aliasDuplicate already shown as inline warning; nothing to add.
      if (drugs.some((d) => d.rxcui === norm.rxcui)) {
        setOpen(false);
        return;
      }
      addDrug({ rxcui: norm.rxcui, name: norm.name, viaBrand: norm.brand });
      clearSearch();
      return;
    }

    // Combination alias.
    const pending = buildCombinationPending(norm.brand, norm.components, drugs);
    setOpen(false);
    if (pending.toAdd.length === 0) {
      setDuplicateWarning({
        typed: norm.brand,
        existing: norm.components.map((c) => c.name).join(" + "),
      });
      return;
    }
    setCombinationPending(pending);
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
        const norm = normalizeTerm(candidateTerm, aliases);
        if (norm) {
          const components =
            norm.type === "single"
              ? [{ rxcui: norm.rxcui, name: norm.name }]
              : norm.components;
          for (const c of components) {
            addDrug({ rxcui: c.rxcui, name: c.name, viaBrand: norm.brand });
          }
          added += components.length;
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
    !localNorm &&
    !loading &&
    term.length >= 2 &&
    results.length === 0;

  const rows: Row[] = [];

  if (localNorm && !aliasDuplicate) {
    const norm = localNorm;
    if (norm.type === "single") {
      rows.push({
        id: `alias-expand-${norm.brand}`,
        kind: "alias",
        title: `Add ${norm.name}`,
        subtitle: `${norm.brand} → ${norm.name}`,
        onActivate: () => handleAliasClick(norm),
      });
    } else {
      const componentsLabel = norm.components.map((c) => c.name).join(" + ");
      rows.push({
        id: `alias-combination-${norm.brand}`,
        kind: "alias",
        title: `Combination drug — ${norm.brand}`,
        subtitle: componentsLabel,
        onActivate: () => handleAliasClick(norm),
      });
    }
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
      if (!open) return;
      const targetIndex = activeIndex >= 0 ? activeIndex : firstSelectable(1);
      const row = rows[targetIndex];
      if (canActivate(targetIndex)) {
        event.preventDefault();
        activateRow(row);
      }
    }
  }

  const effectiveActive = canActivate(activeIndex) ? activeIndex : -1;
  const showList = open && rows.length > 0;

  const inlineWarning = aliasDuplicate
    ? `${aliasDuplicate.typed} is the same drug as ${aliasDuplicate.existing}, already in your list.`
    : duplicateWarning
    ? `${duplicateWarning.typed} is the same drug as ${duplicateWarning.existing}, already in your list.`
    : null;

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
              setDuplicateWarning(null);
              setCombinationPending(null);
              setActiveIndex(-1);
              if (nextQ.trim().length < 2) {
                abortRef.current?.abort();
                setResults([]);
                setLoading(false);
              }
              if (normalizeTerm(nextQ.trim(), aliases)) {
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

        {inlineWarning ? (
          <p className="mt-2 text-[13px]" style={{ color: "var(--sev-major)" }}>
            {inlineWarning}
          </p>
        ) : null}

        {combinationPending ? (
          <div className="mt-3 border border-rule-strong bg-paper-raised px-4 py-3">
            <p className="text-[13.5px] font-medium text-ink">
              {combinationPending.brand} — combination drug
            </p>
            <ul className="mt-2 mb-3 space-y-1">
              {combinationPending.components.map((c) => {
                const present = combinationPending.alreadyPresent.some(
                  (a) => a.rxcui === c.rxcui
                );
                return (
                  <li key={c.rxcui} className="flex items-center gap-2 text-[13px]">
                    <span className={present ? "text-ink-mute line-through" : "text-ink"}>
                      {c.name}
                    </span>
                    {present ? (
                      <span className="stamp">already in list</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  for (const comp of combinationPending.toAdd) {
                    addDrug({
                      rxcui: comp.rxcui,
                      name: comp.name,
                      viaBrand: combinationPending.brand,
                    });
                  }
                  clearSearch();
                }}
                className="border border-rule-strong bg-ink px-3 py-1.5 text-[12.5px] font-medium text-paper-raised hover:opacity-80 transition-opacity"
              >
                {combinationPending.alreadyPresent.length > 0
                  ? combinationPending.toAdd.length === 1
                    ? `Add ${combinationPending.toAdd[0].name}`
                    : `Add ${combinationPending.toAdd.length} remaining`
                  : `Add all ${combinationPending.components.length}`}
              </button>
              <button
                type="button"
                onClick={() => setCombinationPending(null)}
                className="text-[12.5px] text-ink-mute hover:text-ink transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {bulkMessage && !combinationPending ? (
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
