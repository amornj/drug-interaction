# Handoff — continuing the Drug Interaction Checker

You (next agent) are picking up this repo mid-build. Read this file in full before touching code.

Owner: `amornj`. Repo: https://github.com/amornj/drug-interaction. Deploy: Vercel. Primary user: physicians using a phone at the bedside.

---

## Current state (M9 + stack / prompt / input / alias-storage / metabolism annotation expansion — DONE, on `main`)

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
  - medication chips now show curated local metabolism / transporter annotations under the matched generic name when available, including CYP, non-CYP pathways, renal elimination, transporter handling, and P-gp — coverage expanded to ~400+ drugs spanning A–Z plus ARB and gliptin families
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
  - PGx warning cards now collapse / expand like cumulative stack cards; matched-drug boxes and a direct `Copy prompt` button appear only after expansion
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
- Pairwise interactions keep the expandable prompt UI; cumulative stacks and pharmacogenomic warnings now use direct copy buttons after expansion
- `npm run build:data` now regenerates `lib/data/brands/index.json` while preserving DDInter and interaction-overlay artifacts unless `REFRESH_DDINTER=1`
- Brand and alias resolution expands ingredient chips before `/api/interactions/check`, so the check route still receives RxCUIs only
- User alias precedence over curated brand defaults is implemented locally and no alias data is sent to API routes
- Alias management is now strictly local-only again: remove / export JSON / import JSON
- Tested searches: warfarin, lipitor, paracetamol, amoxi return hits
- Batch/paste matching now resolves each matched term to generic ingredients before adding, and combination products stay behind a confirmation step in bulk flows too
- Medication chips can show curated metabolism / transporter notes such as `CYP2C19: Sub (PGx, prodrug)`, `UGT: Met`, `Renal elim: Major`, or `P-gp: Sub (NTI)` under the generic name
- Expanded `lib/cyp.ts` coverage includes ARBs (losartan, valsartan, irbesartan, candesartan, azilsartan), gliptins (sitagliptin, saxagliptin, linagliptin, alogliptin, vildagliptin, teneligliptin), and comprehensive E–Z drug additions

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
  cyp.ts             # curated local metabolism / transporter annotations for matched drugs, including CYP, non-CYP routes, and P-gp
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

## DDInter quality and the plan to improve it

### What DDInter 2.0 is and how it works

DDInter 2.0 is a manually curated database aggregating ~302,516 drug-drug interaction pairs from published literature and FDA drug labels, reviewed by ≥2 pharmacists per entry using DRUGDEX severity standards (Minor / Moderate / Major). It is not machine-learning predicted. Its RxCUI mapping is resolved via RxNorm at ingest time and stored in `lib/data/ddinter/rxcui-map.json`.

**Known structural weaknesses:**
- Zero Contraindicated entries in the current build — every severe pair tops out at Major.
- Co-substrate status (two drugs sharing a CYP pathway as substrates) is frequently treated as interaction evidence even when neither drug inhibits the other. This inflates Moderate pair counts.
- Older literature and animal-study data receive the same weight as prospective clinical trials.
- No severity validation against independent datasets; quality depends entirely on the pharmacist consensus process.

**Two concrete examples already investigated:**
- `colchicine ↔ simvastatin` — **legitimate, well-documented** (38 published case reports of myopathy/rhabdomyolysis). Both are CYP3A4 and P-gp substrates; competitive effects are real. DDInter is correct.
- `colchicine ↔ spironolactone` — **almost certainly a false positive**. Spironolactone is a P-gp inducer, not inhibitor. No clinical signal in CLEAR-SYNERGY (3,500+ patients). DDInter flagged it based on CYP3A4 co-substrate proximity, not demonstrated harm.

### The improvement strategy

Three layers, independent of each other, applied in this order of priority:

1. **Layer 1 — CYP-derived pair generation** (build-time, high yield). Generate pharmacokinetically grounded pairs from `lib/cyp.ts` annotation data and add them as a new overlay source. Every generated pair has an explicit inhibitor→substrate mechanism.
2. **Layer 2 — Confidence classification** (runtime, zero new data). Cross-check each displayed DDInter pair against cyp.ts and stacks.ts to classify it as `pk_confirmed`, `pk_plausible`, `pd_plausible`, or `unverified`. Show the confidence class in the UI alongside severity.
3. **Layer 3 — OpenFDA label pull** (deferred). Machine-readable FDA drug labels contain structured interaction sections. A targeted crawler for NTI drugs (warfarin, tacrolimus, digoxin, lithium, etc.) can stage verified pairs for manual overlay promotion.

---

## Layer 1 — CYP-derived pair generator (detailed)

### Goal

Produce `lib/data/overlay/cyp-derived.yaml` at build time. The existing overlay pipeline in `scripts/generate-ddinter.mjs` picks it up automatically. Every entry in this file takes precedence over DDInter for that RxCUI pair and carries a transparent source attribution.

### New script: `scripts/generate-cyp-pairs.ts`

Run with `tsx`. Add to `package.json`:

```json
"build:cyp-pairs": "tsx scripts/generate-cyp-pairs.ts",
"build:all": "npm run build:data && npm run build:cyp-pairs && npm run build:data"
```

The second `build:data` call picks up the freshly written `cyp-derived.yaml` into `overlay/index.json`.

### Input sources (all already on disk)

| File | Used for |
|---|---|
| `lib/cyp.ts` — `METABOLISM_ENTRIES` + `CYP_REFERENCE_ONLY_ENTRIES` | Drug name → inhibitor / inducer / substrate roles per system |
| `lib/data/ddinter/rxcui-map.json` | Case-insensitive drug name → RxCUI lookup (~1,971 entries) |
| `lib/data/ddinter/index.json` | Existing DDInter severity per sorted RxCUI pair key |

`lib/cyp.ts` currently covers 692 unique drug names with 767 substrate, 338 inhibitor, and 120 inducer annotations across 60+ systems.

### Script logic

**Step 1 — Parse cyp.ts.** Build two in-memory maps:

```
inhibitorIndex: Map<system, { drugName, strength, note? }[]>
  ← all annotations where role contains "Inh" or "Ind"

substrateIndex: Map<system, { drugName, pathwayFraction }[]>
  ← all annotations where role === "Sub"
  pathwayFraction = "major" | "primary" | "minor"  (derived from note field)
```

**Step 2 — Build RxCUI lookup.** Load `rxcui-map.json`. Normalize all keys to lowercase. For each drug name in cyp.ts, look up case-insensitively.

**Step 3 — Run the inhibitor × substrate matrix.** For every `(system, inhibitorDrug A, substrateDrug B)` triple where A ≠ B and both RxCUIs resolve:

- Determine severity from the matrix below.
- Resolve the sorted pair key (`[rxcuiA, rxcuiB].sort().join("|")`).
- Check DDInter: if the pair already exists at equal or higher severity → **skip** (do not override with weaker text).
- If DDInter is silent or lower → emit the pair to `cyp-derived.yaml`.

**Step 4 — Write output.** Sort by system then inhibitor drug name for readable diffs.

### Systems included

Generate pairs for these systems only. All others lack reliable small-molecule inhibitor/substrate clinical frameworks or are handled by PGx.

**CYP enzymes:** `CYP3A4`, `CYP2D6`, `CYP2C9`, `CYP2C19`, `CYP2C8`, `CYP2B6`, `CYP1A2`, `CYP2E1`, `CYP2A6`

**Transporters:** `P-gp`, `BCRP`, `OAT`, `MATE`, `OCT`

**Conjugation:** `UGT`, `UGT1A1`

**Exclude:** `Renal elim` (no enzyme to inhibit), `EHC` (enterohepatic cycling — effect depends on glucuronide reabsorption, not enzyme inhibition), `NAT` / `NAT2` / `TPMT` / `COMT` / `MAO-A` / `MAO-B` (handled by PGx layer), `Esterase` / `ADH` / `Hofmann` / `Xanthine oxidase` / `Non-enzymatic*` (no general inhibitor framework at therapeutic doses), `SULT` (few clinically significant small-molecule inhibitors).

### NTI drug set (hardcoded in script)

Drugs where a 2× exposure increase causes serious harm. Predicts one severity tier higher than a non-NTI substrate on the same pathway.

```
digoxin, warfarin, lithium, cyclosporine, tacrolimus, sirolimus, everolimus,
phenytoin, carbamazepine, valproate, valproic acid, theophylline, methotrexate,
colchicine, gentamicin, tobramycin, amikacin, vancomycin
```

### Severity matrix

`pathwayFraction` is read from the `note` field in cyp.ts: `note: "minor"` → minor, `note: "major"` → major, no note → primary. "Skip" means do not emit a pair at this combination — the signal is too weak to be useful.

| Inhibitor / Inducer strength | NTI substrate · primary pathway | NTI substrate · minor pathway | Normal substrate · primary pathway | Normal substrate · minor pathway |
|---|---|---|---|---|
| Strong Inh | **Major** | **Moderate** | **Major** | **Moderate** |
| Moderate Inh | **Major** | **Moderate** | **Moderate** | skip |
| Weak Inh | **Moderate** | skip | skip | skip |
| Inh (no strength) | **Moderate** | skip | **Moderate** | skip |
| Strong Ind | **Major** | **Moderate** | **Major** | **Moderate** |
| Moderate Ind | **Major** | **Moderate** | **Moderate** | skip |
| Ind / Weak Ind | skip | skip | skip | skip |

Ceiling is Major throughout. Contraindicated is reserved for manual clinical overlay entries only — it requires human review.

### Special cases

- **Prodrug substrates** — annotations with `note: "PGx, prodrug"` (e.g. clopidogrel, codeine, tamoxifen). A CYP2C19 inhibitor + clopidogrel is not toxicity but *loss of efficacy*. Keep Major severity but use the inducer verdict template ("reduced activation") instead of the inhibitor template ("elevated levels").
- **Auto-inhibition** — drug has both `Sub` and `Strong/Moderate Inh` on the same system (e.g. fluoxetine on CYP2D6). Generate the pair only when the other drug is a different substance. Do not generate a drug against itself.
- **Inducers reducing NTI efficacy** — e.g. rifampicin + tacrolimus. The severity is Major because loss of therapeutic effect from an immunosuppressant is as dangerous as toxicity.

### Verdict and management templates

```
Inhibitor pair:
"{A} is a {strength} {system} inhibitor. {B} is metabolised via {system}.
Co-administration is predicted to reduce clearance of {B} and increase plasma exposure."

Inducer pair:
"{A} is a {strength} {system} inducer. {B} is metabolised via {system}.
Co-administration is predicted to accelerate clearance of {B} and reduce its therapeutic effect."

Management — Major:
"Avoid combination where possible. If necessary, reduce {B} dose and monitor levels or
therapeutic endpoints closely."

Management — Moderate:
"Monitor for signs of {B} toxicity (inhibitor pair) or reduced efficacy (inducer pair).
Dose adjustment may be required."
```

Source on every generated entry: `{ name: "CYP/transporter annotation layer", version: "2026-04" }`.

### Expected output and manual review

Raw matrix for CYP3A4 alone: ~20 strong inhibitors × ~150 substrates = ~3,000 potential pairs. After filters (RxCUI resolution ~55%, DDInter already-correct ~50%), estimated **300–600 net new or upgraded pairs**.

Before committing `cyp-derived.yaml`, run a manual review pass:
- Sort output by system, scan for implausible drug names.
- Move false positives to `cyp-pairs-excluded.yaml` with a comment explaining why.
- Pay particular attention to: immunosuppressants (narrow margins), chemotherapy (dose-dependent toxicity), and prodrugs (inverted benefit/harm direction).

---

## Layer 2 — Confidence classification (detailed)

### Goal

Add a `confidence` field to every `InteractionPair` at runtime. The field does not change severity. It adds mechanistic transparency and enables future UI filtering to reduce alert fatigue from weak DDInter entries.

### New file: `lib/confidence.ts`

Exports:

```typescript
export type InteractionConfidence =
  | "pk_confirmed"   // cyp.ts has direct inhibitor→substrate link between the two drugs
  | "pk_plausible"   // both drugs share a CYP/transporter substrate system (co-substrate)
  | "pd_plausible"   // both appear in at least one shared cumulative stack domain
  | "unverified";    // no mechanism traceable in local annotation or stack data

export function classifyConfidence(nameA: string, nameB: string): InteractionConfidence;
export function confidenceLabel(c: InteractionConfidence): string;
```

### Classification logic

```typescript
const PK_SYSTEMS = new Set([
  "CYP3A4","CYP2D6","CYP2C9","CYP2C19","CYP2C8","CYP2B6","CYP1A2",
  "P-gp","OAT","OCT","MATE","BCRP","UGT","UGT1A1"
]);

function classifyConfidence(nameA: string, nameB: string): InteractionConfidence {
  const tagsA = getDrugMetabolismTags(nameA);   // lib/cyp.ts
  const tagsB = getDrugMetabolismTags(nameB);

  const inhibSystemsA = tagsA.filter(t => t.label.includes("Inh") && PK_SYSTEMS.has(t.system)).map(t => t.system);
  const inhibSystemsB = tagsB.filter(t => t.label.includes("Inh") && PK_SYSTEMS.has(t.system)).map(t => t.system);
  const subSystemsA   = tagsA.filter(t => t.label.includes("Sub") && PK_SYSTEMS.has(t.system)).map(t => t.system);
  const subSystemsB   = tagsB.filter(t => t.label.includes("Sub") && PK_SYSTEMS.has(t.system)).map(t => t.system);

  // 1. pk_confirmed — A inhibits B's pathway, or B inhibits A's
  if (inhibSystemsA.some(s => subSystemsB.includes(s))) return "pk_confirmed";
  if (inhibSystemsB.some(s => subSystemsA.includes(s))) return "pk_confirmed";

  // 2. pk_plausible — shared substrate system (competitive saturation possible)
  if (subSystemsA.some(s => subSystemsB.includes(s)))   return "pk_plausible";

  // 3. pd_plausible — both appear in the same cumulative stack domain
  const stacksA = getStackDomainsForDrug(nameA);         // lib/stacks.ts (new export)
  const stacksB = getStackDomainsForDrug(nameB);
  if (stacksA.some(d => stacksB.includes(d)))            return "pd_plausible";

  return "unverified";
}
```

### Required new export from `lib/stacks.ts`

```typescript
export function getStackDomainsForDrug(name: string): StackDomain[] {
  const normalized = normalizeDrugName(name);
  return stackRules
    .filter(rule => rule.matches.some(m => normalized.includes(m)))
    .map(rule => rule.domain);
}
```

This reuses the existing `normalizeDrugName` and `stackRules` — zero new data required.

### Integration into `lib/interactions.ts`

Extend `InteractionPair`:

```typescript
export type InteractionPair = {
  // ... all existing fields unchanged ...
  confidence: InteractionConfidence;
};
```

In `checkInteractions()`, after resolving each pair add:

```typescript
const nameA = getRxcuiName(a) ?? a;
const nameB = getRxcuiName(b) ?? b;
pairs.push({
  ...existingFields,
  confidence: classifyConfidence(nameA, nameB),
});
```

`getRxcuiName` is already imported and used in the same function. The `classifyConfidence` call adds negligible runtime cost — it's a pure in-memory lookup against two small sets.

### What confidence produces on the two problem pairs

| Pair | DDInter severity | Confidence | Reason |
|---|---|---|---|
| colchicine ↔ simvastatin | Major | `pk_plausible` | Both CYP3A4 Sub; neither has inhibitor role on the other |
| colchicine ↔ spironolactone | Moderate | `unverified` | No shared inhibitor/substrate system; no shared stack domain |

The simvastatin pair keeps its Major severity with a `pk_plausible` label — honest about the evidence (competitive co-substrate, not direct inhibition) while not dismissing 38 case reports. The spironolactone pair shows Moderate with `unverified` — visible but flagged.

### UI changes in `InteractionList.tsx`

- **Confidence badge** — small inline indicator beside the severity badge. `pk_confirmed` renders the same as today. Others show a lighter label: `Co-sub`, `PD`, or `?`.
- **Expansion note for `unverified`** — inside the collapsed pair card, a single italic line: "Mechanism not confirmed in local CYP/transporter or pharmacodynamic data." Does not claim the interaction is wrong.
- **Optional filter** (default off) — "Hide unverified Moderate" toggle. Contraindicated and Major always shown regardless of confidence. This is the direct fix for prescriber alert fatigue on weak Moderate entries.

### What confidence never does

- Does not remove any pair from display.
- Does not modify or override severity.
- Does not suppress Major or Contraindicated interactions for any reason.
- Does not treat `unverified` as wrong — DDInter may hold pharmacodynamic evidence that cyp.ts does not model (e.g. additive CNS or QT effects).

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
- **M11** — DDInter quality: Layer 1 CYP-derived pair generator + Layer 2 confidence classification — *planned, see above*.

Full feature brief with rationale lives in `/Users/home/projects/obsidian/Journal/Drug-interaction-checker.md` (owner's machine). The condensed version is this file plus the README.

---

## Working agreements

- Conventional commits to `main`. One feature per commit when practical.
- Open a Vercel preview per PR (or per push to `main` if the owner wires up auto-deploy).
- Update this HANDOFF.md at the end of each milestone: move the milestone into "Current state", and rewrite the "Next task" section for the following milestone so the next agent picks up cold.
