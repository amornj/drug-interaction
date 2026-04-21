# Data sources

| Source | Scope | Version in repo | Refresh cadence | License / terms | Notes |
| --- | --- | --- | --- | --- | --- |
| RxNorm REST API | Name normalization for DDInter build mapping and user autocomplete | Live API, mapping generated `2026-04-21` | On demand for autocomplete; manual refresh when `npm run build:data` is run | U.S. National Library of Medicine RxNorm API terms | Used to resolve DDInter drug names to RxCUIs and to power `/api/drugs/search`. |
| DDInter 2.0 | Deterministic pairwise drug-drug interaction seed data | `2.0`, generated `2026-04-21` | Manual refresh when `npm run build:data` is run | Academic database terms at `https://ddinter2.scbdd.com/terms/` | Ingested from published CSV partitions `A,B,C,D,G,H,J,L,M,N,P,R,S,V`. |
| Local overlay YAML | Hand-curated deterministic overrides / augmentations | `2026-04`, generated `2026-04-21` | Manual, repo-driven | Repository-local authored content | Stored in `lib/data/overlay/*.yaml`, validated with `zod`, emitted into `lib/data/overlay/index.json`. |
| `lib/modifiers.ts` local rules | Deterministic patient-context re-ranking and annotations | `2026-04` | Repo-managed | Repository-local authored content | Client-side M4 modifier layer with local-only case state. |
| `lib/stacks.ts` local rules | Deterministic cumulative stack warnings | `2026-04` | Repo-managed | Repository-local authored content | Client-side M5 cumulative risk layer with visible citations. |
| `lib/pgx.ts` local rules | Deterministic pharmacogenomics prompts and phenotype-aware guidance | `2026-04` | Repo-managed | Repository-local authored content | Client-side M8 CPIC-style panel; phenotype selections stay inside local case storage. |

## Generated artifacts

- `lib/data/ddinter/index.json`: committed RxCUI-pair index used at runtime by the edge route.
- `lib/data/ddinter/rxcui-map.json`: DDInter-name to RxCUI mapping generated via RxNorm.
- `lib/data/ddinter/build-report.json`: unresolved-name log and ingest stats for the last generation run.
- `lib/data/overlay/index.json`: validated overlay export used at runtime.

## Refresh workflow

1. Run `npm run build:data`.
2. Review `lib/data/ddinter/build-report.json` for unresolved names and skipped pairs.
3. Add or adjust `lib/data/overlay/*.yaml` entries if a deterministic local override is required.
4. Run `npm run build` and re-check the acceptance payloads before shipping.
