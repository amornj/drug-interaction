# Handoff — continuing the Drug Interaction Checker

You (next agent) are picking up this repo mid-build. Read this file in full before touching code.

Owner: `amornj`. Repo: https://github.com/amornj/drug-interaction. Deploy: Vercel. Primary user: physicians using a phone at the bedside.

---

## Current state (M8 — DONE, on `main`)

Owner intentionally skipped M6 and M7 for now and moved directly to M8.

- Next.js 15 App Router + React 19 + TS + Tailwind v4
- Mobile-first shell: `components/AppShell.tsx`, case switcher, thumb-zone bottom bar, safe-area insets
- RxNorm autocomplete: `lib/rxnorm.ts` + `app/api/drugs/search/route.ts` (edge runtime, 24h cache, dedup by rxcui)
- Local-only persistence: `lib/store.ts` (Zustand + idb-keyval, `STORAGE_KEY = "di.state.v1"`)
- PWA manifest + icon; real service worker deferred to M9
- Decision-support footer on every screen
- Deterministic pair-check route: `app/api/interactions/check/route.ts` (edge runtime, in-memory response cache)
- DDInter ingest artifacts:
  - `scripts/generate-ddinter.mjs`
  - `lib/data/ddinter/index.json`
  - `lib/data/ddinter/rxcui-map.json`
  - `lib/data/ddinter/build-report.json`
  - `lib/data/overlay/*.yaml` + generated `lib/data/overlay/index.json`
- Interaction UI:
  - `components/InteractionList.tsx`
  - `components/SeverityBadge.tsx`
  - wired bottom-bar CTA in `components/AppShell.tsx`
  - optional clipboard fallback prompt per interaction pair for use in external AI chat apps
- Streamed explainer route:
  - `app/api/interactions/explain/route.ts`
  - Anthropic via Vercel AI SDK
  - prompt constrained to deterministic pair payload only
  - returns clean `503` when `ANTHROPIC_API_KEY` is absent
- Search input enhancements:
  - `components/DrugSearch.tsx`
  - supports pasting medication-list text like `Med: Hydrochlorothiazine 1/2*1, atorvastatin 40 1*1, ezetimibe 10 1/2*1`
  - extracts candidate drug names locally and bulk-adds matched RxNorm results through the existing search route
- Pair-level explainer UI:
  - `components/InteractionExplanation.tsx`
  - optional “Explain” affordance per pair
  - added “Copy” button that copies `Check drug interaction between <Drug A> and <Drug B>` to the clipboard
  - streamed prose rendered below deterministic content, with deterministic citations shown per section
- Patient modifier layer:
  - `components/PatientModifiers.tsx`
  - `lib/modifiers.ts`
  - pregnancy, lactation, hepatic impairment, age ≥ 65, G6PD, and Cockcroft–Gault renal inputs
  - modifier state persisted locally with each case
  - deterministic client-side re-ranking and modifier citation blocks in the interaction list
- Cumulative stack layer:
  - `components/StackWarnings.tsx`
  - `lib/stacks.ts`
  - deterministic local stack warnings for QT, bleeding, serotonergic, anticholinergic, and nephrotoxic burden
  - rendered as a separate cited section above pairwise results
- Pharmacogenomics layer:
  - `components/PharmacogenomicsPanel.tsx`
  - `lib/pgx.ts`
  - deterministic local CPIC-style gene prompts for CYP2C19, CYP2D6, SLCO1B1, HLA-B*15:02, HLA-B*57:01, DPYD, TPMT, and NUDT15
  - phenotype selections are stored locally with each case and rendered as a cited section separate from pairwise interactions

Verified:
- `npm run lint` passes
- `npm run build` passes
- `/api/interactions/check` with `{"rxcuis":["11289","36567"]}` returns Warfarin ↔ Simvastatin with severity + citation
- `/api/interactions/explain` accepts deterministic pair payloads and returns `503` with a clear error when Anthropic is not configured locally
- Modifier state is stored inside each case record and used to re-rank displayed interaction urgency locally
- Cumulative stack warnings stay visually separate from DDInter pair results and show local rule citations
- Pharmacogenomics guidance stays local, cites the repo-managed rule layer, and does not rewrite the pairwise interaction results
- Pasted medication-list text can bulk-add matched drugs through the existing RxNorm flow
- Pair cards include a clipboard fallback prompt for external AI chat use when Anthropic is unavailable
- Tested searches: warfarin, lipitor, paracetamol, amoxi return hits

### File map

```
app/
  layout.tsx          # metadata, viewport, manifest link
  page.tsx            # renders <AppShell />
  globals.css         # Tailwind v4 + theme tokens
  api/drugs/search/route.ts   # RxNorm proxy (edge)
  api/interactions/check/route.ts   # deterministic pair check (edge)
  api/interactions/explain/route.ts # streamed Anthropic explainer
components/
  AppShell.tsx        # composes the mobile UI
  CaseSwitcher.tsx    # horizontal chip row + new/rename
  DrugSearch.tsx      # debounced autocomplete input + dropdown + pasted med-list bulk import
  DrugChip.tsx        # med list row with remove button
  InteractionList.tsx # severity-sorted list with citations + expanders
  InteractionExplanation.tsx # optional streamed explainer + copy prompt per pair
  PatientModifiers.tsx # local modifier chips + Cockcroft–Gault input panel
  PharmacogenomicsPanel.tsx # local PGx test prompts and phenotype-aware guidance
  StackWarnings.tsx   # cumulative stack warning cards with citations
  SeverityBadge.tsx   # red/orange/amber/yellow severity variants
lib/
  interactions.ts     # shared pair types, prompt builder, explanation parsing
  modifiers.ts        # deterministic patient modifier rules and re-ranking
  pgx.ts              # deterministic pharmacogenomics rules and phenotype-aware alerts
  stacks.ts           # deterministic cumulative stack detection rules
  rxnorm.ts           # searchRxNorm(term, max) -> DrugCandidate[]
  store.ts            # Zustand store: cases, activeCaseId, drugs; IndexedDB persist
  data/
    ddinter/
      index.json      # committed RxCUI-pair severity index
      rxcui-map.json  # DDInter name -> RxCUI mapping
      build-report.json  # unresolved-name log + ingest stats
      index.ts        # exports runtime DDInter map/helpers
    overlay/
      *.yaml          # hand-curated deterministic overrides
      index.json      # generated runtime overlay payload
public/
  manifest.webmanifest
  icon.svg
scripts/
  generate-ddinter.mjs  # refresh DDInter + RxNorm generated artifacts
docs/
  data-sources.md    # source list, cadence, and terms
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

## Next task — M9: Brand & alias resolution

Goal: resolve commercial/brand names (especially Thai combos like "Galvusmet") into their ingredient-level drugs so the deterministic interaction check, M5 stacks, M4 modifiers, and M8 PGx panel all see every active component. Three layers, checked in priority order: **user aliases → curated brand overlay → RxNorm**.

### Why this is load-bearing (read before starting)

Brands that expand to multiple ingredients **must** become multiple drug chips, not a single brand-named chip. Example:

```
"Galvusmet" → [vildagliptin, metformin]
```

If a multi-ingredient brand reached `/api/interactions/check` as a single chip, the DDInter layer would miss every pair involving either ingredient, M5 stack detection would miss both contributions, and M4 modifier re-ranking would operate on the wrong drug list. Ingredient-level expansion happens at input time, not at check time.

### Build

1. **Resolution order (highest priority first)**
   1. **User aliases** — device-local IndexedDB store at key `di.aliases.v1` (separate from `di.state.v1`).
   2. **Curated brand overlay** — new directory `lib/data/brands/*.yaml`, same zod-validated pattern as `lib/data/overlay/*.yaml`. Generated into `lib/data/brands/index.json` via `npm run build:data`.
   3. **RxNorm** — existing `/api/drugs/search` route, unchanged.

2. **Types**

   ```ts
   // lib/aliases.ts
   export type AliasComponent = { rxcui: string; name: string };
   export type Alias = {
     term: string;                    // normalized lowercase
     components: AliasComponent[];    // 1..N
     source: "user" | "overlay";
     createdAt?: number;
     note?: string;
   };
   ```

   YAML file (`lib/data/brands/thai.yaml`) example:

   ```yaml
   - term: "Galvusmet"
     components:
       - rxcui: "857331"
         name: "metformin"
       - rxcui: "1036133"
         name: "vildagliptin"
     sources:
       - name: "Curated brand overlay"
         version: "2026-04"
   ```

3. **Chip model change**

   Extend `Drug` in `lib/store.ts` with an optional `viaBrand?: string`:

   ```ts
   export type Drug = {
     rxcui: string;
     name: string;
     addedAt: number;
     viaBrand?: string;   // e.g. "Galvusmet"
   };
   ```

   Render the tag as muted secondary text in `DrugChip`: `Metformin · via Galvusmet`. Keep touch target ≥ 44 pt.

4. **Search behavior**

   `DrugSearch` checks layers 1 and 2 synchronously on each keystroke (no network). If the normalized term matches:
   - Pin an "Expand to N ingredients" row at the top of the dropdown, listing the components.
   - Tapping it bulk-adds every component to the active case, all sharing the same `viaBrand` tag, and closes the dropdown.

5. **Teach flow** (the clinician-speed feature — invest time here)

   Two entry points:

   a. **Empty-result hint.** When the debounced RxNorm call and both local layers return nothing, render a single dropdown row: `Teach: "galvusmet" = ?`. Tap opens a modal where the user picks each component via the existing RxNorm autocomplete. Save → alias persisted → ingredients added to the active case.

   b. **Inline equals syntax.** If the user types `galvusmet = vildagliptin + metformin` (case-insensitive; `=` separates the term from components; `+` separates components), resolve each RHS token through RxNorm live. Show the proposed expansion in the dropdown with a one-tap "Save alias and add". Every RHS token must resolve to an RxCUI (or an existing alias) before the alias can be saved — no typo-based aliases.

6. **Alias management**

   Add a modal accessed from a top-bar overflow menu. Rows: term, components, `Remove`. Footer buttons: **Export JSON**, **Import JSON**. Local only — no network. Exported schema matches `Alias[]` so users can share with colleagues or seed the curated overlay later.

7. **Precedence edge case**

   If both a user alias and a curated brand entry define the same term, the **user alias wins** (the clinician's device-local choice overrides ship-defaults). Document this in an inline comment where the resolution chain is implemented.

### Acceptance criteria (M9)

- [ ] `npm run build` and `npm run lint` pass
- [ ] `npm run build:data` regenerates `lib/data/brands/index.json` from YAML
- [ ] Typing a seeded curated term (e.g. "Janumet") offers expansion and adds both ingredient chips with `via Janumet` tags
- [ ] Typing `galvusmet = vildagliptin + metformin` saves an alias and adds both ingredient chips
- [ ] Typing `galvusmet` in a later session (after a full reload) resolves silently via the saved alias
- [ ] `/api/interactions/check` receives ingredient RxCUIs, not brand terms (verify in DevTools Network)
- [ ] Removing an alias via the management modal makes that term fall back to the overlay or RxNorm
- [ ] Export JSON → clear IndexedDB → Import JSON restores aliases identically
- [ ] "Teach this" hint is keyboard-accessible and ≥ 44 pt tall
- [ ] Brand tags render in `DrugChip` and survive case switching / rename
- [ ] Decision-support footer remains visible on every screen
- [ ] No alias, brand, or patient data is sent to any server (grep the API routes to confirm)

### Do NOT in this milestone

- Do not add an LLM-based brand resolver — aliases are deterministic name → RxCUI mapping only.
- Do not let aliases carry severity, mechanism, or management text. Clinical facts stay in DDInter + interaction overlay.
- Do not auto-accept typos. RHS tokens in the equals syntax must resolve through RxNorm (or an existing alias) before save.
- Do not sync aliases to any server in v1. No accounts.
- Do not regenerate or touch DDInter / interaction overlay artifacts.
- Do not reopen M6 / M7. Offline polish has moved to M10.

---

## Milestone order

- **M3** — LLM explainer endpoint (streaming, Anthropic via Vercel AI SDK) — **done**.
- **M4** — Patient modifiers as chips — **done**.
- **M5** — Cumulative risk stacks — **done**.
- **M6** — Voice input (Web Speech API), OCR (tesseract.js), paste-block EMR parser — *paste-block done as part of M8 session; voice and OCR still deferred.*
- **M7** — Shareable report: copy-to-EMR text, structured JSON, PDF — *deferred.*
- **M8** — Pharmacogenomics (CPIC-style local panel) — **done**.
- **M9** — Brand & alias resolution — *next (see above).*
- **M10** — Offline PWA service worker (serwist), haptics, dark-mode polish, install prompt.

Full feature brief with rationale lives in `/Users/home/projects/obsidian/Journal/Drug-interaction-checker.md` (owner's machine). The condensed version is this file plus the README.

---

## Working agreements

- Conventional commits to `main`. One feature per commit when practical.
- Open a Vercel preview per PR (or per push to `main` if the owner wires up auto-deploy).
- Update this HANDOFF.md at the end of each milestone: move the milestone into "Current state", and rewrite the "Next task" section for the following milestone so the next agent picks up cold.
