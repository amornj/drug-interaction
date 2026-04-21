# Handoff — continuing the Drug Interaction Checker

You (next agent) are picking up this repo mid-build. Read this file in full before touching code.

Owner: `amornj`. Repo: https://github.com/amornj/drug-interaction. Deploy: Vercel. Primary user: physicians using a phone at the bedside.

---

## Current state (M5 — DONE, on `main`)

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
- Streamed explainer route:
  - `app/api/interactions/explain/route.ts`
  - Anthropic via Vercel AI SDK
  - prompt constrained to deterministic pair payload only
  - returns clean `503` when `ANTHROPIC_API_KEY` is absent
- Pair-level explainer UI:
  - `components/InteractionExplanation.tsx`
  - optional “Explain” affordance per pair
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

Verified:
- `npm run lint` passes
- `npm run build` passes
- `/api/interactions/check` with `{"rxcuis":["11289","36567"]}` returns Warfarin ↔ Simvastatin with severity + citation
- `/api/interactions/explain` accepts deterministic pair payloads and returns `503` with a clear error when Anthropic is not configured locally
- Modifier state is stored inside each case record and used to re-rank displayed interaction urgency locally
- Cumulative stack warnings stay visually separate from DDInter pair results and show local rule citations
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
  DrugSearch.tsx      # debounced autocomplete input + dropdown
  DrugChip.tsx        # med list row with remove button
  InteractionList.tsx # severity-sorted list with citations + expanders
  InteractionExplanation.tsx # optional streamed explainer per pair
  PatientModifiers.tsx # local modifier chips + Cockcroft–Gault input panel
  StackWarnings.tsx   # cumulative stack warning cards with citations
  SeverityBadge.tsx   # red/orange/amber/yellow severity variants
lib/
  interactions.ts     # shared pair types, prompt builder, explanation parsing
  modifiers.ts        # deterministic patient modifier rules and re-ranking
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

## Next task — M6: Input expansion

Goal: add faster medication capture paths without weakening the deterministic-first architecture.

### Build

1. **Voice input**
   - Add bedside voice capture using the browser Web Speech API.
   - Convert recognized phrases into candidate medication names for RxNorm normalization.

2. **OCR input**
   - Add on-device OCR using `tesseract.js`.
   - Extract candidate medication names from a captured or uploaded med list image.

3. **Paste-block parser**
   - Add a compact paste area for EMR medication text blocks.
   - Parse newline/comma/bullet-delimited med lists into candidate drug names before RxNorm normalization.

4. **Deterministic integration**
   - Every new input path must still normalize through the existing RxNorm flow before a medication is added.
   - No patient text or images should be sent to a server for parsing.

### Acceptance criteria (M6)

- [ ] Voice capture produces candidate drug names that can be normalized locally through RxNorm
- [ ] OCR extracts medication candidates locally with `tesseract.js`
- [ ] Paste-block parsing splits common medication-list text formats into candidates
- [ ] All accepted medications still flow through RxNorm normalization before entering the case
- [ ] `npm run build` passes

### Do NOT in this milestone

- Do not add shareable reports — that is M7.
- Do not add accounts, analytics, or server-side patient storage.
- Do not skip RxNorm normalization for any imported medication.

---

## After M2

Milestones in order (from the agreed plan):

- **M3** — LLM explainer endpoint (streaming, Anthropic via Vercel AI SDK). Prose only. Every claim cites the deterministic source that fed the prompt.
- **M4** — Patient modifiers as chips: pregnancy, lactation, eGFR (Cockcroft–Gault), hepatic, age ≥ 65, G6PD. Re-rank interactions on toggle.
- **M5** — Cumulative risk stacks: QT, bleeding, serotonergic, anticholinergic, nephrotoxic.
- **M6** — Voice input (Web Speech API), OCR (tesseract.js), paste-block EMR parser.
- **M7** — Shareable report: copy-to-EMR text, structured JSON, PDF.
- **M8** — Pharmacogenomics (CPIC) panel.
- **M9** — Offline PWA service worker (serwist), haptics, dark mode polish, install prompt.

Full feature brief with rationale lives in `/Users/home/projects/obsidian/Journal/Drug-interaction-checker.md` (owner's machine). The condensed version is this file plus the README.

---

## Working agreements

- Conventional commits to `main`. One feature per commit when practical.
- Open a Vercel preview per PR (or per push to `main` if the owner wires up auto-deploy).
- Update this HANDOFF.md at the end of each milestone: move the milestone into "Current state", and rewrite the "Next task" section for the following milestone so the next agent picks up cold.
