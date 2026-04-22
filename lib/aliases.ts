"use client";

import { get as idbGet, set as idbSet } from "idb-keyval";
import { z } from "zod";
import { brandIndex } from "@/lib/data/brands";

export type AliasComponent = { rxcui: string; name: string };

export type Alias = {
  term: string;
  components: AliasComponent[];
  source: "user" | "overlay";
  createdAt?: number;
  updatedAt?: number;
  deletedAt?: number | null;
  note?: string;
};

export type ResolvedAlias = Alias & {
  label: string;
};

export const ALIAS_STORAGE_KEY = "di.aliases.v1";

const aliasSchema = z.object({
  term: z.string().trim().min(1),
  components: z
    .array(
      z.object({
        rxcui: z.string().trim().min(1),
        name: z.string().trim().min(1),
      })
    )
    .min(1),
  source: z.enum(["user", "overlay"]),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  deletedAt: z.number().nullable().optional(),
  note: z.string().trim().optional(),
});

const aliasArraySchema = z.array(aliasSchema);

export function normalizeAliasTerm(term: string) {
  return term.toLowerCase().replace(/\s+/g, " ").trim();
}

export function dedupeAliasComponents(components: AliasComponent[]) {
  const seen = new Set<string>();
  return components.filter((component) => {
    if (seen.has(component.rxcui)) {
      return false;
    }
    seen.add(component.rxcui);
    return true;
  });
}

function normalizeAliasRecord(alias: Alias): Alias {
  const normalizedCreatedAt = alias.createdAt ?? alias.updatedAt ?? Date.now();
  const normalizedUpdatedAt = alias.updatedAt ?? normalizedCreatedAt;

  return {
    ...alias,
    term: normalizeAliasTerm(alias.term),
    components: dedupeAliasComponents(alias.components),
    source: "user",
    createdAt: normalizedCreatedAt,
    updatedAt: normalizedUpdatedAt,
    deletedAt: alias.deletedAt ?? null,
  };
}

function sortAliases(aliases: Alias[]) {
  return [...aliases].sort((left, right) => left.term.localeCompare(right.term));
}

export function isAliasDeleted(alias: Alias) {
  return alias.deletedAt !== null && alias.deletedAt !== undefined;
}

export function activeAliases(aliases: Alias[]) {
  return aliases.filter((alias) => !isAliasDeleted(alias));
}

export function aliasUpdatedAt(alias: Alias) {
  return alias.updatedAt ?? alias.createdAt ?? 0;
}

export function mergeAliasRecords(localAliases: Alias[], remoteAliases: Alias[]) {
  const merged = new Map<string, Alias>();

  for (const alias of [...localAliases, ...remoteAliases]) {
    const normalized = normalizeAliasRecord(alias);
    const existing = merged.get(normalized.term);
    if (!existing || aliasUpdatedAt(normalized) >= aliasUpdatedAt(existing)) {
      merged.set(normalized.term, normalized);
    }
  }

  return sortAliases([...merged.values()]);
}

export async function loadStoredAliases(): Promise<Alias[]> {
  try {
    const loaded = (await idbGet(ALIAS_STORAGE_KEY)) as unknown;
    const parsed = aliasArraySchema.parse(loaded ?? []);
    return sortAliases(parsed.map(normalizeAliasRecord));
  } catch {
    return [];
  }
}

export async function loadUserAliases(): Promise<Alias[]> {
  return activeAliases(await loadStoredAliases());
}

async function saveStoredAliases(aliases: Alias[]) {
  const normalized = aliasArraySchema.parse(
    sortAliases(aliases.map(normalizeAliasRecord))
  );
  await idbSet(ALIAS_STORAGE_KEY, normalized);
  return normalized;
}

export async function saveUserAliases(aliases: Alias[]) {
  return activeAliases(
    await saveStoredAliases(
      aliases.map((alias) => ({
        ...alias,
        source: "user",
        deletedAt: null,
        updatedAt: alias.updatedAt ?? Date.now(),
      }))
    )
  );
}

export async function upsertUserAlias(
  alias: Omit<Alias, "source" | "createdAt" | "updatedAt" | "deletedAt"> & {
    createdAt?: number;
    updatedAt?: number;
  }
) {
  const storedAliases = await loadStoredAliases();
  const normalizedTerm = normalizeAliasTerm(alias.term);
  const existing = storedAliases.find((record) => record.term === normalizedTerm);
  const now = Date.now();
  const nextAlias: Alias = {
    term: normalizedTerm,
    components: dedupeAliasComponents(alias.components),
    source: "user",
    createdAt: existing?.createdAt ?? alias.createdAt ?? now,
    updatedAt: alias.updatedAt ?? now,
    deletedAt: null,
    note: alias.note,
  };
  const remaining = storedAliases.filter(
    (record) => normalizeAliasTerm(record.term) !== nextAlias.term
  );
  return activeAliases(await saveStoredAliases([...remaining, nextAlias]));
}

export async function removeUserAlias(term: string) {
  const storedAliases = await loadStoredAliases();
  const normalized = normalizeAliasTerm(term);
  const now = Date.now();
  const existing = storedAliases.find((alias) => alias.term === normalized);
  const tombstone: Alias = {
    term: normalized,
    components: existing?.components ?? [],
    source: "user",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deletedAt: now,
    note: existing?.note,
  };
  const remaining = storedAliases.filter(
    (alias) => normalizeAliasTerm(alias.term) !== normalized
  );
  return activeAliases(await saveStoredAliases([...remaining, tombstone]));
}

export async function replaceStoredAliases(aliases: Alias[]) {
  return activeAliases(await saveStoredAliases(aliases));
}

export function resolveAlias(term: string, userAliases: Alias[]): ResolvedAlias | null {
  const normalized = normalizeAliasTerm(term);
  if (!normalized) {
    return null;
  }

  const userAlias = userAliases.find(
    (alias) => normalizeAliasTerm(alias.term) === normalized
  );
  if (userAlias) {
    // User aliases intentionally override shipped curated defaults.
    return {
      ...userAlias,
      label: userAlias.term,
    };
  }

  const overlayAlias = brandIndex.get(normalized);
  if (!overlayAlias) {
    return null;
  }

  return {
    term: overlayAlias.normalizedTerm,
    components: overlayAlias.components,
    source: "overlay",
    label: overlayAlias.term,
  };
}

export function parseAliasInput(text: string) {
  const separatorIndex = text.indexOf("=");
  if (separatorIndex === -1) {
    return null;
  }

  const term = text.slice(0, separatorIndex).trim();
  const rightHandSide = text.slice(separatorIndex + 1).trim();
  if (!term || !rightHandSide) {
    return null;
  }

  const componentTerms = rightHandSide
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  if (componentTerms.length === 0) {
    return null;
  }

  return {
    term,
    normalizedTerm: normalizeAliasTerm(term),
    componentTerms,
  };
}
