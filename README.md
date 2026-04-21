# Drug Interaction Checker

A mobile-first PWA for bedside drug interaction checking, built for busy clinicians.

**Decision-support only — verify in primary references before prescribing.**

## Status

**M2 — Deterministic pair check.** Med-list screen now posts active RxCUIs to a deterministic DDInter-backed edge route and renders severity-sorted interaction pairs with visible citations.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Zustand + idb-keyval (IndexedDB) for local-only state
- PWA manifest (real service worker deferred to M9)
- RxNorm REST API (NIH) for drug normalization and autocomplete

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

## Roadmap

| Milestone | Feature |
| --- | --- |
| M1 | Chip-based med list, RxNorm autocomplete, local persistence, multi-case switcher |
| M2 | Deterministic pair check (DDInter + overlay), severity-sorted list, red/amber verdict |
| M3 | LLM explainer endpoint (streaming) for mechanism, food/timing, alternatives — with citations |
| M4 | Patient modifiers (pregnancy, lactation, eGFR, hepatic, age ≥ 65, G6PD) + Cockcroft–Gault |
| M5 | Cumulative stacks: QT, bleeding, serotonergic, anticholinergic, nephrotoxic |
| M6 | Voice (Web Speech API), OCR (tesseract.js + Claude vision fallback), paste-block EMR parser |
| M7 | Shareable report: copy-to-EMR text, structured JSON, PDF |
| M8 | Pharmacogenomics panel (CPIC): tests before prescribing, allele-based management |
| M9 | Offline PWA service worker, haptics on Major/Contraindicated, dark mode polish, install prompt |

## Data sources

| Source | Purpose | Version | Generated / refreshed | Runtime use |
| --- | --- | --- | --- | --- |
| [RxNorm](https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html) | Drug normalization, autocomplete, DDInter name-to-RxCUI mapping | Live API | Mapping generated `2026-04-21` | Autocomplete + build-time DDInter mapping |
| [DDInter 2.0](https://ddinter2.scbdd.com/) | Deterministic pairwise interaction seed | `2.0` | Ingest generated `2026-04-21` | `/api/interactions/check` |
| `lib/data/overlay/*.yaml` | Hand-curated deterministic overrides / augmentations | `2026-04` | Generated `2026-04-21` | `/api/interactions/check` precedence layer |

See [docs/data-sources.md](/Users/home/projects/drug-interaction/docs/data-sources.md) for refresh cadence, artifact locations, and terms.
