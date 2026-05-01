"use client";

import { create } from "zustand";
import { get as idbGet, set as idbSet } from "idb-keyval";
import {
  createDefaultPgxProfile,
  type PgxGene,
  type PgxProfile,
} from "@/lib/pgx";

export type InteractionFilters = {
  showPkPlausible: boolean;
  showPdPlausible: boolean;
  showUnverified: boolean;
};

export const defaultInteractionFilters: InteractionFilters = {
  showPkPlausible: true,
  showPdPlausible: true,
  showUnverified: true,
};

export type Drug = {
  rxcui: string;
  name: string;
  addedAt: number;
  viaBrand?: string;
};

export type Case = {
  id: string;
  label: string;
  drugs: Drug[];
  pgxProfile: PgxProfile;
  interactionFilters: InteractionFilters;
  createdAt: number;
};

type PersistedState = {
  cases: Case[];
  activeCaseId: string;
};

type Store = PersistedState & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addCase: () => void;
  renameCase: (id: string, label: string) => void;
  removeCase: (id: string) => void;
  selectCase: (id: string) => void;
  addDrug: (drug: Omit<Drug, "addedAt">) => void;
  removeDrug: (rxcui: string) => void;
  moveDrug: (fromIndex: number, toIndex: number) => void;
  clearDrugs: () => void;
  setPgxPhenotype: (gene: PgxGene, value: string) => void;
  resetPgxProfile: () => void;
  setInteractionFilter: (
    filter: keyof InteractionFilters,
    value: boolean
  ) => void;
};

const STORAGE_KEY = "di.state.v1";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function defaultState(): PersistedState {
  const first: Case = {
    id: newId(),
    label: "Case 1",
    drugs: [],
    pgxProfile: createDefaultPgxProfile(),
    interactionFilters: defaultInteractionFilters,
    createdAt: Date.now(),
  };
  return { cases: [first], activeCaseId: first.id };
}

function normalizeCase(nextCase: Case): Case {
  return {
    ...nextCase,
    pgxProfile: {
      ...createDefaultPgxProfile(),
      ...nextCase.pgxProfile,
    },
    interactionFilters: {
      ...defaultInteractionFilters,
      ...nextCase.interactionFilters,
    },
  };
}

function normalizePersistedState(
  state: PersistedState | undefined
): PersistedState | undefined {
  if (!state?.cases?.length) {
    return undefined;
  }

  return {
    ...state,
    cases: state.cases.map(normalizeCase),
  };
}

async function persist(state: PersistedState) {
  try {
    await idbSet(STORAGE_KEY, state);
  } catch {
    // best-effort; private mode may deny
  }
}

export const useStore = create<Store>((set, get) => ({
  ...defaultState(),
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const loaded = normalizePersistedState(
        (await idbGet(STORAGE_KEY)) as PersistedState | undefined
      );
      if (loaded && loaded.cases?.length) {
        set({ ...loaded, hydrated: true });
        return;
      }
    } catch {
      // ignore
    }
    set({ hydrated: true });
  },

  addCase: () => {
    const c: Case = {
      id: newId(),
      label: `Case ${get().cases.length + 1}`,
      drugs: [],
      pgxProfile: createDefaultPgxProfile(),
      interactionFilters: defaultInteractionFilters,
      createdAt: Date.now(),
    };
    const next = { cases: [...get().cases, c], activeCaseId: c.id };
    set(next);
    persist({ cases: next.cases, activeCaseId: next.activeCaseId });
  },

  renameCase: (id, label) => {
    const cases = get().cases.map((c) => (c.id === id ? { ...c, label } : c));
    set({ cases });
    persist({ cases, activeCaseId: get().activeCaseId });
  },

  removeCase: (id) => {
    let cases = get().cases.filter((c) => c.id !== id);
    if (cases.length === 0) cases = [defaultState().cases[0]];
    const activeCaseId =
      get().activeCaseId === id ? cases[0].id : get().activeCaseId;
    set({ cases, activeCaseId });
    persist({ cases, activeCaseId });
  },

  selectCase: (id) => {
    set({ activeCaseId: id });
    persist({ cases: get().cases, activeCaseId: id });
  },

  addDrug: (drug) => {
    const { cases, activeCaseId } = get();
    const nextCases = cases.map((c) => {
      if (c.id !== activeCaseId) return c;
      // Duplicate guard: skip silently if RxCUI already present; callers display their own warning.
      if (c.drugs.some((d) => d.rxcui === drug.rxcui)) return c;
      return {
        ...c,
        drugs: [...c.drugs, { ...drug, addedAt: Date.now() }],
      };
    });
    set({ cases: nextCases });
    persist({ cases: nextCases, activeCaseId });
  },

  removeDrug: (rxcui) => {
    const { cases, activeCaseId } = get();
    const nextCases = cases.map((c) =>
      c.id !== activeCaseId
        ? c
        : { ...c, drugs: c.drugs.filter((d) => d.rxcui !== rxcui) }
    );
    set({ cases: nextCases });
    persist({ cases: nextCases, activeCaseId });
  },

  moveDrug: (fromIndex, toIndex) => {
    const { cases, activeCaseId } = get();
    if (fromIndex === toIndex) return;
    const nextCases = cases.map((c) => {
      if (c.id !== activeCaseId) return c;
      const drugs = [...c.drugs];
      const [moved] = drugs.splice(fromIndex, 1);
      drugs.splice(toIndex, 0, moved);
      return { ...c, drugs };
    });
    set({ cases: nextCases });
    persist({ cases: nextCases, activeCaseId });
  },

  clearDrugs: () => {
    const { cases, activeCaseId } = get();
    const nextCases = cases.map((c) =>
      c.id !== activeCaseId ? c : { ...c, drugs: [] }
    );
    set({ cases: nextCases });
    persist({ cases: nextCases, activeCaseId });
  },

  setPgxPhenotype: (gene, value) => {
    const { cases, activeCaseId } = get();
    const nextCases = cases.map((c) =>
      c.id !== activeCaseId
        ? c
        : {
            ...c,
            pgxProfile: {
              ...c.pgxProfile,
              [gene]: value,
            },
          }
    );
    set({ cases: nextCases });
    persist({ cases: nextCases, activeCaseId });
  },

  resetPgxProfile: () => {
    const { cases, activeCaseId } = get();
    const nextCases = cases.map((c) =>
      c.id !== activeCaseId
        ? c
        : {
            ...c,
            pgxProfile: createDefaultPgxProfile(),
          }
    );
    set({ cases: nextCases });
    persist({ cases: nextCases, activeCaseId });
  },

  setInteractionFilter: (filter, value) => {
    const { cases, activeCaseId } = get();
    const nextCases = cases.map((c) =>
      c.id !== activeCaseId
        ? c
        : {
            ...c,
            interactionFilters: {
              ...c.interactionFilters,
              [filter]: value,
            },
          }
    );
    set({ cases: nextCases });
    persist({ cases: nextCases, activeCaseId });
  },
}));

export function useActiveCase(): Case | undefined {
  return useStore((s) => s.cases.find((c) => c.id === s.activeCaseId));
}
