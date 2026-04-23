# Data sources

| Source | Scope | Version in repo | Refresh cadence | License / terms | Notes |
| --- | --- | --- | --- | --- | --- |
| RxNorm REST API | Name normalization for DDInter build mapping and user autocomplete | Live API, mapping generated `2026-04-21` | On demand for autocomplete; manual refresh when `npm run build:data` is run | U.S. National Library of Medicine RxNorm API terms | Used to resolve DDInter drug names to RxCUIs and to power `/api/drugs/search`. |
| DDInter 2.0 | Deterministic pairwise drug-drug interaction seed data | `2.0`, generated `2026-04-21` | Manual refresh when `npm run build:data` is run | Academic database terms at `https://ddinter2.scbdd.com/terms/` | Ingested from published CSV partitions `A,B,C,D,G,H,J,L,M,N,P,R,S,V`. |
| Local overlay YAML | Hand-curated deterministic overrides / augmentations | `2026-04`, generated `2026-04-21` | Manual, repo-driven | Repository-local authored content | Stored in `lib/data/overlay/*.yaml`, validated with `zod`, emitted into `lib/data/overlay/index.json`. |
| Curated brand YAML | Hand-curated brand and combo expansions | `2026-04`, generated `2026-04-22` | Manual, repo-driven | Repository-local authored content | Stored in `lib/data/brands/*.yaml`, validated with `zod`, emitted into `lib/data/brands/index.json`. |
| `lib/modifiers.ts` local rules | Deterministic patient-context re-ranking and annotations | `2026-04` | Repo-managed | Repository-local authored content | Client-side M4 modifier layer with local-only case state. |
| `lib/stacks.ts` local rules | Deterministic cumulative stack warnings | `2026-04-electrolyte-acid-base` | Repo-managed | Repository-local authored content | Client-side M5 cumulative risk layer with visible citations, including electrolyte, glucose, and acid-base stack rules. |
| `lib/pgx.ts` local rules | Deterministic pharmacogenomics prompts and phenotype-aware guidance | `2026-04` | Repo-managed | Repository-local authored content | Client-side M8 CPIC-style panel; phenotype selections stay inside local case storage. |
| `lib/aliases.ts` local rules | Deterministic user alias persistence and precedence chain | `2026-04` | Repo-managed | Repository-local authored content | Client-side M9 alias database at IndexedDB key `di.aliases.v1`; never sent to API routes. |
| `/api/aliases/backup/[syncId]` | Encrypted alias-only backup blob | `2026-04` | Repo-managed | Vercel Blob terms plus repository-local encryption format | Stores only opaque encrypted alias JSON; requires `BLOB_READ_WRITE_TOKEN`. |

## Generated artifacts

- `lib/data/ddinter/index.json`: committed RxCUI-pair index used at runtime by the edge route.
- `lib/data/ddinter/rxcui-map.json`: DDInter-name to RxCUI mapping generated via RxNorm.
- `lib/data/ddinter/build-report.json`: unresolved-name log and ingest stats for the last generation run.
- `lib/data/overlay/index.json`: validated overlay export used at runtime.
- `lib/data/brands/index.json`: validated brand expansion export used at runtime for M9 alias/brand resolution.

## Refresh workflow

1. Run `npm run build:data`.
2. Review `lib/data/brands/index.json` if you changed `lib/data/brands/*.yaml`.
3. Review `lib/data/ddinter/build-report.json` only when running `REFRESH_DDINTER=1 npm run build:data`.
4. Add or adjust `lib/data/overlay/*.yaml` or `lib/data/brands/*.yaml` entries if a deterministic local override is required.
5. Run `npm run build` and re-check the acceptance payloads before shipping.
