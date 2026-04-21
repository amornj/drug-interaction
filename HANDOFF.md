# Handoff — continuing the Drug Interaction Checker

You (next agent) are picking up this repo mid-build. Read this file in full before touching code.

Owner: `amornj`. Repo: https://github.com/amornj/drug-interaction. Deploy: Vercel. Primary user: physicians using a phone at the bedside.

---

## Current state (M1 — DONE, on `main`)

- Next.js 15 App Router + React 19 + TS + Tailwind v4
- Mobile-first shell: `components/AppShell.tsx`, case switcher, thumb-zone bottom bar, safe-area insets
- RxNorm autocomplete: `lib/rxnorm.ts` + `app/api/drugs/search/route.ts` (edge runtime, 24h cache, dedup by rxcui)
- Local-only persistence: `lib/store.ts` (Zustand + idb-keyval, `STORAGE_KEY = "di.state.v1"`)
- PWA manifest + icon; real service worker deferred to M9
- Decision-support footer on every screen

Verified: `npm run build` passes. Tested searches: warfarin, lipitor, paracetamol, amoxi return hits.

### File map

```
app/
  layout.tsx          # metadata, viewport, manifest link
  page.tsx            # renders <AppShell />
  globals.css         # Tailwind v4 + theme tokens
  api/drugs/search/route.ts   # RxNorm proxy (edge)
components/
  AppShell.tsx        # composes the mobile UI
  CaseSwitcher.tsx    # horizontal chip row + new/rename
  DrugSearch.tsx      # debounced autocomplete input + dropdown
  DrugChip.tsx        # med list row with remove button
lib/
  rxnorm.ts           # searchRxNorm(term, max) -> DrugCandidate[]
  store.ts            # Zustand store: cases, activeCaseId, drugs; IndexedDB persist
public/
  manifest.webmanifest
  icon.svg
```

---

## Hard rules (do not violate)

1. **Deterministic first, LLM-only-for-prose.** LLMs never invent severity, contraindication, or dosing. They only summarize/rephrase data returned by the deterministic layer. Temperature 0.
2. **Cite everything.** Every interaction claim shown to the user carries a source name + version/date from the deterministic layer.
3. **No patient data leaves the device.** Persistence is IndexedDB on the client. Server routes are stateless. No DB of patient lists. No auth in v1.
4. **Safety footer.** "Decision-support only. Verify in primary references." must stay visible on every result screen.
5. **Mobile-first.** Design at 360px width first. Thumb-zone action bar. Min 44 pt touch targets. Dark mode required.
6. **Thai brand names via curated overlay only** — never LLM-invented.

---

## Next task — M2: Deterministic pair check

Goal: when the user has ≥2 drugs in the active case and taps the **Check interactions** button, render a severity-sorted list of interacting pairs with one-line verdicts and visible citations.

### Build

1. **Data files**
   - `lib/data/ddinter/` — download DDInter 2.0 interaction CSV (https://ddinter2.scbdd.com/), commit as JSON/SQLite, or parse at build into `lib/data/ddinter/index.ts` exporting `Map<string, Interaction>` keyed by sorted `"rxcuiA|rxcuiB"`.
   - `lib/data/overlay/*.yaml` — hand-curated schema-validated (zod) overlay that *augments or overrides* DDInter. Shape:
     ```yaml
     - pair: [rxcuiA, rxcuiB]
       severity: Contraindicated | Major | Moderate | Minor
       verdict: "Avoid — risk of serotonin syndrome"
       mechanism_class: "Pharmacodynamic — serotonergic additive"
       management: "Use alternative; if unavoidable, monitor for hyperthermia/clonus"
       sources:
         - name: "Curated overlay"
           version: "2026-04"
     ```
   - DDInter identifiers are NOT RxCUIs. You must map DDInter drug names → RxCUIs at build time (use RxNorm `/rxcui.json?name=...`). Store the mapping in `lib/data/ddinter/rxcui-map.json`. Skip pairs that don't resolve; log them in a build report.

2. **API route** `app/api/interactions/check/route.ts` (edge)
   - Input: `{ rxcuis: string[] }`
   - Output:
     ```ts
     {
       pairs: Array<{
         a: { rxcui: string; name: string };
         b: { rxcui: string; name: string };
         severity: "Contraindicated" | "Major" | "Moderate" | "Minor";
         verdict: string;
         mechanism_class?: string;
         management?: string;
         sources: Array<{ name: string; version: string }>;
       }>;
       unknown: string[];   // rxcuis with no resolved name
       checkedAt: string;   // ISO
       dataVersion: string; // DDInter version + overlay version
     }
     ```
   - Deterministic only. No LLM here. Cache results in Vercel KV (key: sorted-rxcui-pair) once available; for now, in-memory cache is fine.
   - Overlay overrides DDInter when both match the same pair.

3. **UI**
   - New component `components/InteractionList.tsx`
   - New component `components/SeverityBadge.tsx` (4 variants: red/orange/amber/yellow)
   - Wire the bottom-bar "Check interactions" button (currently disabled) to POST to the route and render the list below the med chips.
   - Sort: Contraindicated → Major → Moderate → Minor. Red pairs pinned at top with a subtle pulse.
   - Each row: `A ↔ B`, severity badge, one-line verdict. Tap-to-expand reveals mechanism_class, management, and source citations (name + version).
   - Empty state when no interactions: a green "No known interactions found in current data sources" banner with the same citation line (e.g. "DDInter 2.0 · 2024-XX").

### Acceptance criteria (M2)

- [ ] `npm run build` passes
- [ ] Hitting `/api/interactions/check` with `{rxcuis: ["11289", "36567"]}` (warfarin + simvastatin) returns a populated `pairs` array with severity and at least one source
- [ ] No LLM call anywhere in this milestone
- [ ] Every rendered pair shows a citation (source name + version)
- [ ] Empty state also shows the data-source name and version
- [ ] Lighthouse mobile performance ≥ 90 on the deployed Vercel preview
- [ ] README updated: data source table gets DDInter version + overlay version columns
- [ ] `docs/data-sources.md` created, listing every source + refresh cadence + license

### Do NOT in this milestone

- Do not add an LLM explainer — that is M3.
- Do not add patient modifiers (pregnancy, eGFR, etc.) — that is M4.
- Do not add user accounts, analytics, or server-side patient storage.
- Do not invent Thai brand mappings — overlay stays hand-curated.
- Do not relax the severity rule: DDInter + overlay are authoritative. If a pair isn't in either source, omit it (don't guess).

---

## After M2

Milestones in order (from the agreed plan):

- **M3** — LLM explainer endpoint (streaming, Anthropic via Vercel AI SDK). Prose only. Every claim cites the deterministic source that fed the prompt.
- **M4** — Patient modifiers as chips: pregnancy, lactation, eGFR (Cockcroft–Gault), hepatic, age ≥ 65, G6PD. Re-rank interactions on toggle.
- **M5** — Cumulative risk stacks: QT, bleeding, serotonergic, anticholinergic, nephrotoxic.
- **M6** — Voice input (Web Speech API), OCR (tesseract.js + Claude vision fallback), paste-block EMR parser.
- **M7** — Shareable report: copy-to-EMR text, structured JSON, PDF.
- **M8** — Pharmacogenomics (CPIC) panel.
- **M9** — Offline PWA service worker (serwist), haptics, dark mode polish, install prompt.

Full feature brief with rationale lives in `/Users/home/projects/obsidian/Journal/Drug-interaction-checker.md` (owner's machine). The condensed version is this file plus the README.

---

## Working agreements

- Conventional commits to `main`. One feature per commit when practical.
- Open a Vercel preview per PR (or per push to `main` if the owner wires up auto-deploy).
- Update this HANDOFF.md at the end of each milestone: move the milestone into "Current state", and rewrite the "Next task" section for the following milestone so the next agent picks up cold.
