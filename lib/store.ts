"use client";

import { create } from "zustand";
import { get as idbGet, set as idbSet } from "idb-keyval";

export type Drug = {
  rxcui: string;
  name: string;
  addedAt: number;
};

export type Case = {
  id: string;
  label: string;
  drugs: Drug[];
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
  clearDrugs: () => void;
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
    createdAt: Date.now(),
  };
  return { cases: [first], activeCaseId: first.id };
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
      const loaded = (await idbGet(STORAGE_KEY)) as PersistedState | undefined;
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

  clearDrugs: () => {
    const { cases, activeCaseId } = get();
    const nextCases = cases.map((c) =>
      c.id !== activeCaseId ? c : { ...c, drugs: [] }
    );
    set({ cases: nextCases });
    persist({ cases: nextCases, activeCaseId });
  },
}));

export function useActiveCase(): Case | undefined {
  return useStore((s) => s.cases.find((c) => c.id === s.activeCaseId));
}
