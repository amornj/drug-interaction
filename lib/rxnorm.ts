export type DrugCandidate = {
  rxcui: string;
  name: string;
  score: number;
};

const RXNAV = "https://rxnav.nlm.nih.gov/REST";

export async function searchRxNorm(term: string, max = 10): Promise<DrugCandidate[]> {
  const q = term.trim();
  if (q.length < 2) return [];

  // RxNorm returns one candidate per (rxcui, source) pair, so we over-fetch
  // and dedupe by rxcui to end up with enough distinct drugs.
  const fetchN = Math.max(max * 4, 20);
  const url = `${RXNAV}/approximateTerm.json?term=${encodeURIComponent(q)}&maxEntries=${fetchN}`;
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) return [];

  const json = (await res.json()) as {
    approximateGroup?: {
      candidate?: Array<{ rxcui?: string; score?: string; name?: string }>;
    };
  };

  const raw = json.approximateGroup?.candidate ?? [];
  const seen = new Set<string>();
  const out: DrugCandidate[] = [];
  for (const c of raw) {
    if (!c.rxcui || !c.name) continue;
    if (seen.has(c.rxcui)) continue;
    seen.add(c.rxcui);
    out.push({
      rxcui: c.rxcui,
      name: c.name,
      score: c.score ? Number(c.score) : 0,
    });
    if (out.length >= max) break;
  }
  return out;
}

export type ResolvedIngredient =
  | { type: "single"; rxcui: string; name: string }
  | { type: "combination"; components: Array<{ rxcui: string; name: string }> };

export async function resolveToIngredient(rxcui: string): Promise<ResolvedIngredient | null> {
  try {
    const url = `${RXNAV}/rxcui/${encodeURIComponent(rxcui)}/related.json?tty=IN`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = (await res.json()) as {
      relatedGroup?: {
        conceptGroup?: Array<{
          tty?: string;
          conceptProperties?: Array<{ rxcui?: string; name?: string }>;
        }>;
      };
    };

    const group = json.relatedGroup?.conceptGroup?.find((g) => g.tty === "IN");
    const components = (group?.conceptProperties ?? [])
      .filter((p): p is { rxcui: string; name: string } => Boolean(p.rxcui && p.name))
      .map((p) => ({ rxcui: p.rxcui, name: p.name }));

    if (components.length === 0) return null;
    if (components.length === 1) return { type: "single", ...components[0] };
    return { type: "combination", components };
  } catch {
    return null;
  }
}
