# Drug Interaction Checker

A mobile-first PWA for bedside drug interaction checking, built for busy clinicians.

**Decision-support only — verify in primary references before prescribing.**

## Status

**M9 — Brand and alias resolution, plus encrypted alias backup/sync.** The app expands saved aliases and curated brand names into ingredient chips before interaction checking, detects brand/generic duplicates at pick time with an inline warning, shows a confirmation banner for combination products, and lets user aliases be backed up and restored as an encrypted remote blob with manual-only sync controls.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Zustand + idb-keyval (IndexedDB) for local-only state
- Per-pair and cumulative-stack prompt copy helpers for external LLM chat apps
- PWA manifest (real service worker deferred to M10)
- RxNorm REST API (NIH) for drug normalization and autocomplete
- Local deterministic patient-modifier rule layer for pregnancy, lactation, renal, hepatic, age ≥ 65, and G6PD
- Local deterministic cumulative-stack rule layer for QT, bleeding, serotonergic, anticholinergic syndrome, extrapyramidal syndrome, ergotism, drug-induced lactic acidosis, nephrotoxic, electrolyte, uric acid, glucose, and normal-gap acidosis burden
- Local deterministic pharmacogenomics rule layer for CPIC-style test prompts and phenotype-aware guidance, including HLA-B*15:02, HLA-B*57:01, and HLA-B*58:01 triggers
- Search-box paste importer for comma/newline medication chunks routed through RxNorm normalization
- Per-pair clipboard prompt for external LLM chat use
- Local alias database with user-overrides-first precedence over the curated brand overlay
- Curated brand overlay generated from `lib/data/brands/*.yaml`
- Brand/generic equivalence: picked RxNorm results normalized to ingredient-level RxCUI via `resolveToIngredient()`; typing a brand while its generic is already in the list shows an inline amber duplicate warning
- Combination drug confirmation banner: selecting a combo product lists all components with partial-overlap detection before adding
- Encrypted alias-only backup/restore and manual sync via remote blob storage

## Architecture rules

1. LLMs never invent severity, contraindication, or dosing. Deterministic layer first; LLMs only summarize/explain with citations. Temperature 0.
2. Every interaction claim must carry a source + version/date citation.
3. Patient and case data stay on device (IndexedDB). User aliases may sync only as a client-side encrypted blob; no readable clinical data or patient lists are stored server-side.
4. Mobile-first: design at 360px width first, expand up. Thumb-zone action bar. Min 44 pt touch targets. Dark mode required.

## Getting started

```bash
npm install
npm run build:data
npm run dev
```

Open http://localhost:3000 on a phone viewport.

`npm run build:data` refreshes the committed DDInter/RxNorm artifacts under `lib/data/`. `npm run build` uses those local files and does not need to fetch DDInter at build time.

To enable encrypted alias backup and manual sync, configure `BLOB_READ_WRITE_TOKEN` for the alias backup route. Without that token, the alias sync UI still renders but backup/restore returns a clean `503` storage-unavailable response.

Recent additions in M9:

- Pasting medication text such as `Med: Hydrochlorothiazine 1/2*1, atorvastatin 40 1*1, ezetimibe 10 1/2*1` into the search box now bulk-adds matched drugs through the existing RxNorm route.
- Each interaction card has a `Copy prompt` button that copies `Check drug interaction between <Drug A> and <Drug B>` so clinicians can paste the pair into another AI chat tool.
- Typing a curated brand like `Janumet` offers one-tap ingredient expansion and adds both chips with `via Janumet`.
- Typing `galvusmet = vildagliptin + metformin` saves a local alias and adds both ingredients.
- A local alias database is available from the top-bar overflow with remove, export JSON, and import JSON actions.
- The alias database can now create an encrypted backup, restore from a recovery key plus passphrase, and manually sync aliases across devices without syncing any patient or case data.
- Picking any drug from the RxNorm dropdown now resolves it to an ingredient-level RxCUI via the RxNorm `related?tty=IN` endpoint before storing, so branded and generic entries for the same molecule correctly deduplicate.
- If the typed term resolves (via the curated brand overlay or a user alias) to a generic already in the list, an inline amber warning appears immediately: *"Glucophage is the same drug as metformin, already in your list."*
- Selecting a combination product (e.g. `Exforge`) shows a confirmation banner that lists every component. Components already present are shown with a strikethrough and an *already in list* badge; only the missing ones are queued. Confirming adds the remainder in one tap.

## Roadmap

| Milestone | Feature |
| --- | --- |
| M1 | Chip-based med list, RxNorm autocomplete, local persistence, multi-case switcher |
| M2 | Deterministic pair check (DDInter + overlay), severity-sorted list, red/amber verdict |
| M3 | Copy-prompt affordance for external LLM chat while deterministic pair facts remain authoritative |
| M4 | Local patient modifier chips with user-set renal, hepatic, age, G6PD, pregnancy, and lactation modifiers |
| M5 | Local deterministic cumulative stacks: QT, bleeding, serotonergic, anticholinergic syndrome, extrapyramidal syndrome, ergotism, drug-induced lactic acidosis, nephrotoxic, potassium, calcium, sodium, uric acid, glucose, and normal-gap acidosis |
| M6 | Voice (Web Speech API), OCR (tesseract.js), paste-block EMR parser |
| M7 | Shareable report: copy-to-EMR text, structured JSON, PDF |
| M8 | Local pharmacogenomics panel (CPIC-style): tests before prescribing, phenotype-aware management |
| M9 | Brand and alias resolution: user alias DB, curated brand overlay, via-brand chips |
| M10 | Offline PWA service worker, haptics on Major/Contraindicated, dark mode polish, install prompt |

## Data sources

| Source | Purpose | Version | Generated / refreshed | Runtime use |
| --- | --- | --- | --- | --- |
| [RxNorm](https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html) | Drug normalization, autocomplete, DDInter name-to-RxCUI mapping | Live API | Mapping generated `2026-04-21` | Autocomplete + build-time DDInter mapping |
| [DDInter 2.0](https://ddinter2.scbdd.com/) | Deterministic pairwise interaction seed | `2.0` | Ingest generated `2026-04-21` | `/api/interactions/check` |
| `lib/data/overlay/*.yaml` | Hand-curated deterministic overrides / augmentations | `2026-04` | Generated `2026-04-21` | `/api/interactions/check` precedence layer |
| `lib/data/brands/*.yaml` | Curated commercial / combo brand expansions | `2026-04` | Generated `2026-04-22` | Client-side M9 brand overlay layer |
| `lib/modifiers.ts` local rules | Deterministic patient-context re-ranking and annotations | `2026-04` | Repo-managed | Client-side M4 modifier layer |
| `lib/stacks.ts` local rules | Deterministic cumulative stack warnings and citations | `2026-04-metabolic-electrolyte` | Repo-managed | Client-side M5 stack layer |
| `lib/pgx.ts` local rules | Deterministic pharmacogenomics prompts and phenotype-aware guidance | `2026-04` | Repo-managed | Client-side M8 pharmacogenomics layer |
| `lib/aliases.ts` local rules | Deterministic alias persistence and precedence chain | `2026-04` | Repo-managed | Client-side M9 user alias database |
| `/api/aliases/backup/[syncId]` | Opaque encrypted alias blob backup/restore | `2026-04` | Repo-managed | Remote storage for alias-only encrypted backups |

See [docs/data-sources.md](/Users/home/projects/drug-interaction/docs/data-sources.md) for refresh cadence, artifact locations, and terms.
