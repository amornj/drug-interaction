# Drug Interaction Checker

A mobile-first PWA for bedside drug interaction checking, built for busy clinicians.

**Decision-support only — verify in primary references before prescribing.**

## Status

**M5 — Cumulative stacks.** Deterministic pair results still render unchanged, and the app now adds a separate local cumulative-stack section for QT, bleeding, serotonergic, anticholinergic, and nephrotoxic burden warnings with visible citations.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Zustand + idb-keyval (IndexedDB) for local-only state
- Vercel AI SDK + Anthropic provider for streamed explanation prose
- PWA manifest (real service worker deferred to M9)
- RxNorm REST API (NIH) for drug normalization and autocomplete
- Local deterministic patient-modifier rule layer for pregnancy, lactation, renal, hepatic, age ≥ 65, and G6PD
- Local deterministic cumulative-stack rule layer for QT, bleeding, serotonergic, anticholinergic, and nephrotoxic burden

## Architecture rules

1. LLMs never invent severity, contraindication, or dosing. Deterministic layer first; LLMs only summarize/explain with citations. Temperature 0.
2. Every interaction claim must carry a source + version/date citation.
3. Patient data stays on device (IndexedDB). No server-side patient storage or accounts in v1.
4. Mobile-first: design at 360px width first, expand up. Thumb-zone action bar. Min 44 pt touch targets. Dark mode required.

## Getting started

```bash
npm install
npm run build:data
npm run dev
```

Open http://localhost:3000 on a phone viewport.

`npm run build:data` refreshes the committed DDInter/RxNorm artifacts under `lib/data/`. `npm run build` uses those local files and does not need to fetch DDInter at build time.

To enable the optional M3 explainer locally, set `ANTHROPIC_API_KEY` in `.env.local`. Without that key, deterministic pair checking, M4 patient modifiers, and M5 cumulative stack warnings still work and `/api/interactions/explain` returns a clean `503` explainer-unavailable response.

## Roadmap

| Milestone | Feature |
| --- | --- |
| M1 | Chip-based med list, RxNorm autocomplete, local persistence, multi-case switcher |
| M2 | Deterministic pair check (DDInter + overlay), severity-sorted list, red/amber verdict |
| M3 | Streamed Anthropic explainer that restates deterministic pair facts with citations |
| M4 | Local patient modifier chips with Cockcroft–Gault renal input and deterministic pair re-ranking |
| M5 | Local deterministic cumulative stacks: QT, bleeding, serotonergic, anticholinergic, nephrotoxic |
| M6 | Voice (Web Speech API), OCR (tesseract.js), paste-block EMR parser |
| M7 | Shareable report: copy-to-EMR text, structured JSON, PDF |
| M8 | Pharmacogenomics panel (CPIC): tests before prescribing, allele-based management |
| M9 | Offline PWA service worker, haptics on Major/Contraindicated, dark mode polish, install prompt |

## Data sources

| Source | Purpose | Version | Generated / refreshed | Runtime use |
| --- | --- | --- | --- | --- |
| [RxNorm](https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html) | Drug normalization, autocomplete, DDInter name-to-RxCUI mapping | Live API | Mapping generated `2026-04-21` | Autocomplete + build-time DDInter mapping |
| [DDInter 2.0](https://ddinter2.scbdd.com/) | Deterministic pairwise interaction seed | `2.0` | Ingest generated `2026-04-21` | `/api/interactions/check` |
| `lib/data/overlay/*.yaml` | Hand-curated deterministic overrides / augmentations | `2026-04` | Generated `2026-04-21` | `/api/interactions/check` precedence layer |
| `lib/modifiers.ts` local rules | Deterministic patient-context re-ranking and annotations | `2026-04` | Repo-managed | Client-side M4 modifier layer |
| `lib/stacks.ts` local rules | Deterministic cumulative stack warnings and citations | `2026-04` | Repo-managed | Client-side M5 stack layer |

See [docs/data-sources.md](/Users/home/projects/drug-interaction/docs/data-sources.md) for refresh cadence, artifact locations, and terms.
