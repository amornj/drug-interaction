# Drug Interaction Checker

A bedside-first web app for fast medication-list review.

**Decision-support only. Verify in primary references before prescribing.**

## What it does

Drug Interaction Checker helps clinicians paste or type a medication list and quickly see:

- significant pairwise drug interactions
- cumulative risk stacks such as bleeding, hyperkalemia, or bradycardia
- pharmacogenomic warnings
- patient-phenotype modifiers such as renal or hepatic risk
- copyable prompts for asking an LLM chat to explain mechanisms
- local metabolism / transporter annotations under matched drug names

The core checker is deterministic and local-first. No AI is involved in matching, scoring, or warning generation.

## Features

### Intelligent Input

- **Fuzzy single match:** standard search behavior for one drug at a time, tuned for accurate matching.
- **Batch match:** fast matching for many drugs in one input.
- Type multiple drugs in a single line.
- Copy and paste a chunk of text that contains a medication list.
- Remove existing drugs easily.
- Accepts both generic names and commercial names, primarily using US formulation conventions.
- Accepts combination pills and expands them into all matched ingredients.
- In batch and paste mode, each matched term is resolved to ingredient-level generic names before being added.
- Automatically rejects ingredients already present in the case when adding new input.
- Combination pills in batch and paste mode pause for confirmation instead of silently adding the wrong thing.
- Matched drug chips can show curated CYP, non-CYP metabolism, transporter, and P-gp annotations under the generic name, plus explicit `Prodrug` and `NTI` tags where curated (coverage: ~400+ drugs).
- Works almost entirely with keyboard-only use.

### Alias Dictionary

- Supports a local custom alias dictionary.
- Manual alias creation is useful for local shorthand, commercial products, and combination pills.
- JSON export and import are the only backup / transfer methods.
- This is manual work, but it is reliable and works well for combined products.

### Summary Box

- Shows the number of significant interactions.
- Shows major and moderate interaction counts.
- Shows the top drug interaction at a glance.
- Shows which cumulative stacks were triggered.

### Cumulative Stacks

Cumulative stacks are a core value of the app. They show additive risk across the whole medication list, not just one pairwise interaction.

The app currently detects the following cumulative burden stacks:

- **QT prolongation** — multiple QT-risk drugs (amiodarone, sotalol, quinidine, macrolides, fluoroquinolones, haloperidol, ziprasidone, methadone, etc.)
- **Bleeding risk** — anticoagulants, antiplatelets, NSAIDs, SSRIs, thrombolytics
- **Serotonin syndrome** — MAOIs, SSRIs, SNRIs, TCAs, tramadol, linezolid, triptans
- **Anticholinergic syndrome** — TCAs, antihistamines, antipsychotics, antispasmodics
- **Extrapyramidal syndrome (EPS)** — antipsychotics, metoclopramide, prochlorperazine
- **Ergotism** — ergot derivatives + CYP3A4 inhibitors
- **Myocardial depression** — beta-blockers, calcium channel blockers, antiarrhythmics
- **Fluid retention** — NSAIDs, corticosteroids, thiazolidinediones, estrogen
- **Drug-induced lactic acidosis** — metformin, nucleoside reverse transcriptase inhibitors, propofol, linezolid
- **Nephrotoxic burden** — aminoglycosides, vancomycin, amphotericin, NSAIDs, contrast, cisplatin
- **Hyperkalemia** — spironolactone, eplerenone, ACE inhibitors, ARBs, potassium supplements, trimethoprim
- **Hypokalemia** — loop/thiazide diuretics, insulin, beta-agonists, corticosteroids
- **Hypercalcemia** — calcium supplements, vitamin D, thiazides, lithium, teriparatide
- **Hypocalcemia** — bisphosphonates, denosumab, cinacalcet, foscarnet, anticonvulsants, loop diuretics
- **Hyponatremia** — thiazides, desmopressin, carbamazepine, SSRIs, antipsychotics, vincristine
- **Hypernatremia** — sodium bicarbonate, hypertonic saline, lithium, mannitol, fludrocortisone
- **Hyperuricemia / gout** — thiazides, loop diuretics, pyrazinamide, ethambutol, cyclosporine, tacrolimus, niacin
- **Hypoglycemia** — insulin, sulfonylureas, meglitinides, linezolid
- **Hyperglycemia** — corticosteroids, calcineurin inhibitors, atypical antipsychotics, thiazides
- **High anion gap metabolic acidosis (HAGMA)** — aspirin, methanol, ethylene glycol, propylene glycol, iron, isoniazid
- **Normal-gap metabolic acidosis** — acetazolamide, topiramate, amphotericin, ifosfamide, tenofovir
- **Bradycardia** — digoxin, amiodarone, verapamil, diltiazem, beta-blockers, ivabradine, donepezil
- **Drug-induced seizure** — tramadol, bupropion, clozapine, isoniazid, meperidine, theophylline, lithium, imipenem, ciprofloxacin

The goal is to show potential side-effect burden up front, such as hyperkalemia risk when several matched drugs contribute to the same stack. Stack cards include copyable prompts so users can ask an LLM chat for mechanistic explanation.

### Pairwise Drug Interactions

- Checks each drug pair for interaction.
- Shows that an interaction exists and gives warning level at a glance.
- Does not try to replace a primary reference or full mechanistic monograph.
- Includes copyable prompts for asking an LLM chat to explain the mechanism.
- Warning strength can be modified by patient phenotype, such as renal or hepatic risk.
- Matching is fast because it relies on local rules and predetermined indexes.
- Once input is matched, interaction results update in real time.
- Includes a deterministic local rule for acid-reduction drugs with gastric-acid-dependent medicines, surfaced as a Major absorption warning.

### Pharmacogenomics

- Integrates pharmacogenomic warnings into the same workflow.
- Flags gene checks when a trigger drug is present.
- Keeps pharmacogenomic warnings separate from pairwise interaction results.
- PGx warning cards now expose copyable prompts asking why a gene should be tested for the matched drug and how to interpret the result.

Current examples include:

- CYP2C9 and VKORC1 for warfarin
- HLA-B*58:01 for allopurinol
- HLA-B*15:02 for carbamazepine
- HLA-B*57:01 for abacavir

### Metabolism and Transporter Annotations

Each matched drug chip can display curated metabolic pathway and transporter annotations. Selected drugs also carry explicit `Prodrug`, `NTI`, and `gastric acid dependent` tags when those flags matter clinically. The app covers ~400+ drugs across the following systems:

**Cytochrome P450 enzymes:**
- **CYP3A4** — the most clinically significant: substrates include simvastatin, atorvastatin, amlodipine, apixaban, rivaroxaban, tacrolimus, midazolam, fentanyl, oxycodone, quetiapine, carbamazepine, and many more; inhibitors include ritonavir, ketoconazole, clarithromycin, itraconazole, grapefruit juice; inducers include rifampin, carbamazepine, phenytoin, phenobarbital, St. John's wort
- **CYP2D6** — codeine, tramadol, tamoxifen, metoprolol, propranolol, amitriptyline, haloperidol, risperidone, paroxetine (strong inhibitor), fluoxetine (strong inhibitor), bupropion (strong inhibitor), quinidine (strong inhibitor)
- **CYP2C9** — warfarin, losartan, diclofenac, ibuprofen, glyburide, celecoxib; inhibitors include fluconazole, metronidazole, sulfamethoxazole; inducers include rifampin, carbamazepine, phenytoin
- **CYP2C19** — clopidogrel, omeprazole, esomeprazole, citalopram, voriconazole; inhibitors include omeprazole, esomeprazole, voriconazole, fluvoxamine; inducers include rifampin, carbamazepine, phenytoin
- **CYP1A2** — theophylline, caffeine, clozapine, olanzapine, tizanidine; inhibitors include ciprofloxacin, fluvoxamine; inducers include cigarette smoking, charbroiled meat, cruciferous vegetables
- **CYP2B6** — ketamine, bupropion, methadone; inhibitors include ticlopidine, thiotepa, prasugrel; inducers include nevirapine, cyclophosphamide, rifampin
- **CYP2C8** — pioglitazone, paclitaxel, repaglinide; inhibitors include gemfibrozil, trimethoprim, deferasirox
- **CYP2E1** — ethanol, halothane, acetaminophen (minor); inducers include chronic ethanol, acetone; inhibitors include disulfiram, fomepizole

**Transporters:**
- **P-glycoprotein (P-gp / MDR1)** — substrates: digoxin, dabigatran, colchicine, fexofenadine, loperamide, vincristine; inhibitors: verapamil, diltiazem, cyclosporine, ritonavir, ketoconazole, clarithromycin, amiodarone, ranolazine, ticagrelor
- **BCRP** — substrates: simvastatin, atorvastatin, rosuvastatin; inhibitors: cyclosporine
- **OATP1B1** — substrates: rosuvastatin, pravastatin, pitavastatin; inhibitors: cyclosporine, gemfibrozil
- **OCT (Organic Cation Transporter)** — metformin

**Non-CYP metabolic pathways:**
- **UGT (glucuronidation)** — morphine, lorazepam, lamotrigine, mycophenolate, ezetimibe, SGLT2 inhibitors (empagliflozin, dapagliflozin)
- **Esterase hydrolysis** — remifentanil, esmolol, aspirin, enalapril (prodrug)
- **Xanthine oxidase** — allopurinol, febuxostat
- **NAT2 (N-acetyltransferase)** — isoniazid, dapsone
- **Alcohol dehydrogenase** — ethanol, abacavir
- **Aldehyde oxidase** — zaleplon

**Absorption annotations:**
- **Gastric acid dependent** — ketoconazole, itraconazole capsules, posaconazole oral suspension, erlotinib, gefitinib, dasatinib, nilotinib, pazopanib, atazanavir, rilpivirine

Current curated explicit `Prodrug` + `NTI` tags include:

- **CYP2C19** — clopidogrel
- **CYP2D6** — codeine, tramadol, tamoxifen
- **CYP3A4** — simvastatin, lovastatin
- **P-gp** — dabigatran etexilate
- **CYP2B6** — cyclophosphamide

Current curated `gastric acid dependent` tags include the classic azoles above, selected TKIs, and the acid-sensitive antiretrovirals atazanavir and rilpivirine.

### Design And Workflow

- Modern custom UI, not a vanilla Tailwind layout.
- Designed with a strong visual direction and the frontend-skill workflow.
- Works as a web app.
- Best on desktop when copying a medication list from an inpatient record and reviewing the result immediately.
- Also works on iPhone.
- Free to use.
- No AI is required for the core checker.

## Screenshots

### Main Interaction View

![Drug Interaction Checker main screen](./docs/images/drug-interaction-main.png)

### Pharmacogenomics, Cumulative Load, And Pairwise Results

![Drug Interaction Checker pharmacogenomics and cumulative load](./docs/images/drug-interaction-pgx.png)

## How It Works

There are two independent deterministic engines. No AI is involved in either.

### 1. Pairwise Interactions

**API route:** `POST /api/interactions/check` receives only a list of **RxCUIs** (ingredient-level drug IDs from RxNorm).

**Lookup logic** (`lib/interactions.ts`):

1. **Overlay first** — checks `lib/data/overlay/index.json` (hand-curated overrides). If a pair is here, it wins immediately with full severity, verdict, mechanism, and management.
2. **DDInter fallback** — if no overlay hit, looks up the pair in `lib/data/ddinter/index.json`, a precomputed map of `RxCUI_A|RxCUI_B → severity_code`:
   - `1` = Minor
   - `2` = Moderate
   - `3` = Major
   - `4` = Contraindicated
3. If neither source has the pair, it is silent — nothing is invented.

**How drugs become RxCUIs:**
- User types a name → RxNorm NIH API returns candidates.
- The app resolves the chosen candidate to an **ingredient-level RxCUI**.
- Brands and combos expand into ingredient chips before hitting the API, so the check route never sees raw text — only RxCUIs.

**Results:**
- Sorted by severity: Contraindicated → Major → Moderate → Minor.
- Every hit carries a source citation (`DDInter 2.0` or `Overlay`).
- The API caches responses in-memory by sorted RxCUI key.

### 2. Cumulative Stacks

**Client-side logic** (`lib/stacks.ts`), runs entirely in the browser:

- ~20 deterministic stack rules (QT, bleeding, hyperkalemia, serotonergic, lactic acidosis, nephrotoxic, bradycardia, etc.).
- Each rule has a `matches` array of drug name substrings.
- Drug names are normalized (lowercased, stripped of parenthetical text).
- If **≥2 drugs** in the current case match a rule's keyword list, a stack warning fires.

**Severity tuning:**
Many rules have custom `detectSeverity` logic. Examples:
- **Hyperkalemia** → Major if MRA + ACEi/ARB, or if potassium supplement is present, or if ≥3 drugs match.
- **QT** → Major if high-risk QT drug + hypokalemia driver present.
- **Serotonergic** → Major if MAOI + SSRI/SNRI, or if tramadol/linezolid overlap with antidepressants.
- Default fallback: Moderate for 2 drugs, Major for 3+ or if any `highRiskMatches` are present.

Stack warnings render as a separate section above the pairwise list.

### 3. Other Local Layers

- **Patient modifiers** (`lib/modifiers.ts`): renal/hepatic impairment, age ≥65, G6PD, pregnancy, lactation chips stored per case. These can re-rank or annotate interaction urgency client-side.
- **Pharmacogenomics** (`lib/pgx.ts`): CPIC-style gene-drug alerts (CYP2C19, CYP2D6, HLA-B*57:01, etc.) rendered as prompts separate from pairwise results.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Zustand + IndexedDB for local-first persistence
- RxNorm-based normalization
- DDInter-derived pairwise interaction layer
- Local deterministic cumulative-stack rules
- Local deterministic pharmacogenomics rules

## Getting Started

```bash
npm install
npm run build:data
npm run dev
```

Open `http://localhost:3000`.

## Clinical Note

This app is decision support only. It is built to surface signal quickly, not to replace clinical judgment, primary references, local policy, or prescribing responsibility.
