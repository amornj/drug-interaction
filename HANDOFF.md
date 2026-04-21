# Handoff — continuing the Drug Interaction Checker

You (next agent) are picking up this repo mid-build. Read this file in full before touching code.

Owner: `amornj`. Repo: https://github.com/amornj/drug-interaction. Deploy: Vercel. Primary user: physicians using a phone at the bedside.

---

## Current state (M2 — DONE, on `main`)

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

Verified:
- `npm run lint` passes
- `npm run build` passes
- `/api/interactions/check` with `{"rxcuis":["11289","36567"]}` returns Warfarin ↔ Simvastatin with severity + citation
- Tested searches: warfarin, lipitor, paracetamol, amoxi return hits

### File map

```
app/
  layout.tsx          # metadata, viewport, manifest link
  page.tsx            # renders <AppShell />
  globals.css         # Tailwind v4 + theme tokens
  api/drugs/search/route.ts   # RxNorm proxy (edge)
  api/interactions/check/route.ts   # deterministic pair check (edge)
components/
  AppShell.tsx        # composes the mobile UI
  CaseSwitcher.tsx    # horizontal chip row + new/rename
  DrugSearch.tsx      # debounced autocomplete input + dropdown
  DrugChip.tsx        # med list row with remove button
  InteractionList.tsx # severity-sorted list with citations + expanders
  SeverityBadge.tsx   # red/orange/amber/yellow severity variants
lib/
  rxnorm.ts           # searchRxNorm(term, max) -> DrugCandidate[]
  interactions.ts     # shared types, versions, deterministic pair lookup
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

## Next task — M3: LLM explainer endpoint

Goal: add an **optional** explainer layer that turns deterministic M2 pair results into concise bedside prose without ever inventing medical facts.

### Build

1. **Explainer route**
   - Add a new route for streamed explanation output using Anthropic via the Vercel AI SDK.
   - Input should be the deterministic pair payload (or pair IDs) from M2, not free-form drug names alone.
   - Output should include:
     - a concise bedside explanation
     - what to monitor
     - when to avoid the combination
     - explicit citations for every claim
   - Temperature **must be `0`**.

2. **Prompting and safety**
   - The prompt must only allow the model to summarize or restate facts already present in the deterministic inputs.
   - If a needed fact is absent from DDInter/overlay input, the explainer must say it is unavailable rather than infer it.
   - Keep prose short enough for phone use.

3. **UI**
   - Add an optional per-pair “Explain” affordance in the interaction list.
   - The explainer output must be visually secondary to the deterministic severity/verdict/citation block.
   - The deterministic result remains the source of truth.

### Acceptance criteria (M3)

- [ ] No severity, contraindication, mechanism, or management fact is generated unless present in deterministic input
- [ ] Every explanatory claim visibly cites its deterministic source
- [ ] Streaming works on mobile without blocking the core interaction list
- [ ] `npm run build` passes

### Do NOT in this milestone

- Do not add patient modifiers (pregnancy, eGFR, etc.) — that is M4.
- Do not add accounts, analytics, or server-side patient storage.
- Do not let the LLM change severity ordering or deterministic verdict text.

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
