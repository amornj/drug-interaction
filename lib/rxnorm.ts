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
