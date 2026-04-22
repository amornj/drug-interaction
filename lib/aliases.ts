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

export async function loadUserAliases(): Promise<Alias[]> {
  try {
    const loaded = (await idbGet(ALIAS_STORAGE_KEY)) as unknown;
    const parsed = aliasArraySchema.parse(loaded ?? []);
    return parsed.map((alias) => ({
      ...alias,
      term: normalizeAliasTerm(alias.term),
      components: dedupeAliasComponents(alias.components),
      source: "user",
    }));
  } catch {
    return [];
  }
}

export async function saveUserAliases(aliases: Alias[]) {
  const normalized = aliasArraySchema.parse(
    aliases.map((alias) => ({
      ...alias,
      term: normalizeAliasTerm(alias.term),
      components: dedupeAliasComponents(alias.components),
      source: "user",
    }))
  );
  await idbSet(ALIAS_STORAGE_KEY, normalized);
  return normalized;
}

export async function upsertUserAlias(
  alias: Omit<Alias, "source" | "createdAt"> & { createdAt?: number },
  currentAliases: Alias[]
) {
  const nextAlias: Alias = {
    term: normalizeAliasTerm(alias.term),
    components: dedupeAliasComponents(alias.components),
    source: "user",
    createdAt: alias.createdAt ?? Date.now(),
    note: alias.note,
  };
  const remaining = currentAliases.filter(
    (existing) => normalizeAliasTerm(existing.term) !== nextAlias.term
  );
  const nextAliases = [...remaining, nextAlias].sort((left, right) =>
    left.term.localeCompare(right.term)
  );
  await saveUserAliases(nextAliases);
  return nextAliases;
}

export async function removeUserAlias(term: string, currentAliases: Alias[]) {
  const normalized = normalizeAliasTerm(term);
  const nextAliases = currentAliases.filter(
    (alias) => normalizeAliasTerm(alias.term) !== normalized
  );
  await saveUserAliases(nextAliases);
  return nextAliases;
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
