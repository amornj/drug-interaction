# Handoff — continuing the Drug Interaction Checker

You (next agent) are picking up this repo mid-build. Read this file in full before touching code.

Owner: `amornj`. Repo: https://github.com/amornj/drug-interaction. Deploy: Vercel. Primary user: physicians using a phone at the bedside.

---

## Current state (M9 + stack / prompt / input / alias-storage / CYP polish — DONE, on `main`)

Owner intentionally skipped M6 and M7 for now and moved directly to M8.

- Next.js 16 App Router + React 19 + TS + Tailwind v4
- Mobile-first shell: `components/AppShell.tsx`, case switcher, thumb-zone bottom bar, safe-area insets
- RxNorm autocomplete: `lib/rxnorm.ts` + `app/api/drugs/search/route.ts` (edge runtime, 24h cache, dedup by rxcui)
- Local-only persistence: `lib/store.ts` (Zustand + idb-keyval, `STORAGE_KEY = "di.state.v1"`)
- Local-only alias storage: `lib/aliases.ts` + JSON import/export in `components/AliasManagerModal.tsx`
- PWA manifest + icon; real service worker deferred to M10
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
  - shared dropdown clipboard prompt UI for pairwise interactions, cumulative stacks, and pharmacogenomic warnings
- External LLM prompt helpers:
  - `components/InteractionExplanation.tsx`
  - `components/LlmPromptPanel.tsx`
  - pairwise interaction cards, cumulative stack cards, and pharmacogenomic warnings all use the same dropdown prompt-copy UI
  - pharmacogenomic alerts now expose prompts like `Why do we have to test <gene> for <drug>? How to interpret the result.`
- Search input enhancements:
  - `components/DrugSearch.tsx`
  - supports pasting medication-list text like `Med: Hydrochlorothiazine 1/2*1, atorvastatin 40 1*1, ezetimibe 10 1/2*1`
  - extracts candidate drug names locally and bulk-adds matched RxNorm results through the existing search route
  - now checks user aliases, curated brand overlay, and then RxNorm in that precedence order
  - supports inline alias syntax such as `galvusmet = vildagliptin + metformin`
  - batch / paste flows now resolve matched results down to ingredient-level generic names before adding chips
  - batch / paste flows queue combination-pill confirmations instead of silently flattening them, and show `already in list` notices when all components are present
  - medication chips now show curated local CYP substrate / inhibitor / inducer annotations under the matched generic name when available
- Pair-level prompt UI:
  - `components/InteractionExplanation.tsx`
  - shared dropdown prompt affordance per pair
  - no in-app AI explanation prose; deterministic content stays authoritative
- Alias and brand-resolution layer:
  - `lib/aliases.ts`
  - `lib/data/brands/*.yaml` + generated `lib/data/brands/index.json`
  - user aliases persist locally in IndexedDB key `di.aliases.v1`
  - curated brand overlay currently seeds `Galvusmet`, `Janumet`, `Glucophage`, `Exforge`, `Jardiance Duo`, and `Co-Diovan`
  - multi-ingredient brands expand at input time into ingredient chips tagged with `viaBrand`
- Alias management UI:
  - `components/AliasManagerModal.tsx`
  - top-bar overflow entry for remove / export JSON / import JSON
  - encrypted cross-device alias backup UI and code removed; JSON import/export is the only alias transfer path now
- Teach-alias flow:
  - `components/AliasTeachModal.tsx`
  - empty-result hint opens a local modal where each component is selected through RxNorm before save
- Patient modifier layer:
  - `components/PatientModifiers.tsx`
  - `lib/modifiers.ts`
  - renal, hepatic impairment, age ≥ 65, G6PD, pregnancy, and lactation chips
  - modifier state persisted locally with each case
  - deterministic client-side re-ranking and modifier citation blocks in the interaction list
- Cumulative stack layer:
  - `components/StackWarnings.tsx`
  - `lib/stacks.ts`
  - deterministic local stack warnings for QT (expanded with hydroxychloroquine, domperidone, droperidol, ranolazine, quinine), bleeding, serotonergic, anticholinergic, nephrotoxic, electrolyte, uric acid, glucose, lactic acidosis, normal-gap metabolic acidosis, **bradycardia** (digoxin, amiodarone, verapamil, diltiazem, adenosine, beta-blockers, lacosamide, flecainide, propafenone, sotalol, ivabradine, clonidine, dexmedetomidine, donepezil, rivastigmine), and **drug-induced seizure** (new: tramadol, bupropion, clozapine, isoniazid, meperidine, theophylline, lithium, calcineurin inhibitors, carbapenems, cefepime, metronidazole, ciprofloxacin)
  - myocardialdepression stack pruned: beta-blockers (propranolol, metoprolol) and metabolic acidosis drugs (metformin, tenofovir, zidovudine, linezolid) removed — those belong to the lacticacidosis stack
  - summary box stack buttons now expand to show actual high-yield drug names (up to 12) via `getStackHighYieldDrugs()` instead of class groups; HypoNa now shows 12 representative drugs
  - rendered as a separate cited section above pairwise results
- Pharmacogenomics layer:
  - `components/PharmacogenomicsPanel.tsx`
  - `lib/pgx.ts`
  - deterministic local CPIC-style gene prompts for CYP2C9, CYP2C19, CYP2D6, SLCO1B1, VKORC1, HLA-B*15:02, HLA-B*57:01, HLA-B*58:01, DPYD, TPMT, and NUDT15
  - warfarin now triggers local PGx alerts for CYP2C9 clearance / bleeding risk and VKORC1 sensitivity / dose requirement
  - PGx warning cards now collapse / expand like cumulative stack cards; matched-drug boxes and Ask LLM copy prompts appear only after expansion
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
- Pairwise interactions, cumulative stacks, and pharmacogenomic warnings all use the same expandable copy-prompt UI
- `npm run build:data` now regenerates `lib/data/brands/index.json` while preserving DDInter and interaction-overlay artifacts unless `REFRESH_DDINTER=1`
- Brand and alias resolution expands ingredient chips before `/api/interactions/check`, so the check route still receives RxCUIs only
- User alias precedence over curated brand defaults is implemented locally and no alias data is sent to API routes
- Alias management is now strictly local-only again: remove / export JSON / import JSON
- Tested searches: warfarin, lipitor, paracetamol, amoxi return hits
- Batch/paste matching now resolves each matched term to generic ingredients before adding, and combination products stay behind a confirmation step in bulk flows too
- Medication chips can show curated CYP substrate / inhibitor / inducer notes such as `CYP2C19: Sub (PGx, prodrug)` under the generic name

### File map

```
app/
  layout.tsx          # metadata, viewport, manifest link
  page.tsx            # renders <AppShell />
  globals.css         # Tailwind v4 + theme tokens
  api/drugs/search/route.ts   # RxNorm proxy (edge)
  api/interactions/check/route.ts   # deterministic pair check (edge)
  api/interactions/explain/route.ts # legacy streamed Anthropic explainer route, not used by current UI
components/
  AppShell.tsx        # composes the mobile UI
  AliasManagerModal.tsx # local alias database import/export/remove modal
  AliasTeachModal.tsx # teach-alias flow with RxNorm-confirmed components
  CaseSwitcher.tsx    # horizontal chip row + new/rename
  DrugSearch.tsx      # autocomplete + brand expansion + alias save + pasted med-list bulk import
  DrugChip.tsx        # med list row with remove button + via-brand tag
  InteractionList.tsx # severity-sorted list with citations + expanders
  InteractionExplanation.tsx # shared LLM prompt UI for pairwise results
  LlmPromptPanel.tsx  # expandable prompt-copy UI reused by pairwise / stack / PGx cards
  PatientModifiers.tsx # local modifier chips
  PharmacogenomicsPanel.tsx # local PGx test prompts and phenotype-aware guidance
  StackWarnings.tsx   # cumulative stack warning cards with citations
  SeverityBadge.tsx   # red/orange/amber/yellow severity variants
lib/
  cyp.ts             # curated local CYP substrate / inhibitor / inducer annotations for matched drugs
  interactions.ts     # shared pair types, prompt builder, explanation parsing
  aliases.ts          # local alias persistence, precedence chain, inline alias parsing
  modifiers.ts        # deterministic patient modifier rules and re-ranking
  pgx.ts              # deterministic pharmacogenomics rules and phenotype-aware alerts
  stacks.ts           # deterministic cumulative stack detection rules
  rxnorm.ts           # searchRxNorm(term, max) -> DrugCandidate[]
  store.ts            # Zustand store: cases, activeCaseId, drugs; IndexedDB persist
  data/
    brands/
      *.yaml          # curated brand / combo expansions
      index.json      # generated brand overlay for local resolution
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
3. **No patient or case data leaves the device.** Persistence is IndexedDB on the client. Aliases stay local unless the user explicitly exports/imports JSON. No DB of patient lists. No auth in v1.
4. **Safety footer.** "Decision-support only. Verify in primary references." must stay visible on every result screen.
5. **Mobile-first.** Design at 360px width first. Thumb-zone action bar. Min 44 pt touch targets. Dark mode required.
6. **Thai brand names via curated overlay only** — never LLM-invented.

---

## Next task — M10: Offline polish

Goal: harden the bedside experience for low-connectivity use, installability, and final mobile polish without changing the deterministic clinical logic.

### Build

1. **Offline PWA**
   - Add a real service worker using `serwist`.
   - Cache the app shell and deterministic local assets needed for repeat visits.

2. **Installability**
   - Add an install prompt flow that works cleanly on supported mobile browsers.
   - Keep the prompt unobtrusive and easy to dismiss.

3. **Mobile polish**
   - Add haptic feedback for Major and Contraindicated results where supported.
   - Tighten dark-mode contrast and finish any rough edges in the 360px layout.

4. **Deterministic integration**
   - Do not move clinical decision logic into the service worker.
   - Keep all existing local deterministic layers functioning unchanged.

### Acceptance criteria (M10)

- [ ] Repeat visits can load the app shell offline after the first successful session
- [ ] Install prompt behavior works on supported browsers
- [ ] Major / Contraindicated result states trigger supported haptics
- [ ] Dark mode remains legible and polished at 360px width
- [ ] `npm run build` passes

### Do NOT in this milestone

- Do not add new clinical rule engines beyond polish work.
- Do not add automatic background alias sync or accounts in v1.
- Do not reopen M6 / M7 as part of M10.

---

## Milestone order

- **M3** — External LLM copy prompts for deterministic pair results — **done**.
- **M4** — Patient modifiers as chips — **done**.
- **M5** — Cumulative risk stacks — **done**.
- **M6** — Voice input (Web Speech API), OCR (tesseract.js), paste-block EMR parser — *paste-block done as part of M8 session; voice and OCR still deferred.*
- **M7** — Shareable report: copy-to-EMR text, structured JSON, PDF — *deferred.*
- **M8** — Pharmacogenomics (CPIC-style local panel) — **done**.
- **M9** — Brand & alias resolution — **done**.
- **M10** — Offline PWA service worker (serwist), haptics, dark-mode polish, install prompt — *next*.

Full feature brief with rationale lives in `/Users/home/projects/obsidian/Journal/Drug-interaction-checker.md` (owner's machine). The condensed version is this file plus the README.

---

## Working agreements

- Conventional commits to `main`. One feature per commit when practical.
- Open a Vercel preview per PR (or per push to `main` if the owner wires up auto-deploy).
- Update this HANDOFF.md at the end of each milestone: move the milestone into "Current state", and rewrite the "Next task" section for the following milestone so the next agent picks up cold.
