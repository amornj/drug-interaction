# Drug Interaction Checker

A bedside-first drug interaction checker built for fast clinical use.

**Decision-support only. Verify in primary references before prescribing.**

## What it does

Drug Interaction Checker is a fast local-first web app for reviewing medication lists at the bedside.

It is designed for the real workflow:
- type several drugs in one line
- paste a chunk of medication text from an EMR or note
- match brand or generic names
- expand combination pills into ingredients
- remove duplicates and already-present ingredients automatically
- surface both pairwise interactions and cumulative stack risks immediately

No AI is required for the core checker. The app relies on local deterministic rules and prebuilt indexes for real-time results.

## Why it is useful

Most interaction checkers tell you that two drugs interact.
This one is built to help you see the whole medication picture at a glance.

It gives you:
- **pairwise drug interaction warnings** with severity at a glance
- **cumulative stack warnings** for clinically meaningful burdens such as bleeding, hyperkalemia, hyperglycemia, serotonergic toxicity, nephrotoxicity, and more
- **pharmacogenomics warnings** with phenotype-aware local prompts
- **patient-context modifiers** such as renal or hepatic phenotype that can strengthen or re-rank warnings
- **copyable prompts** when you want to ask a local or external LLM for mechanism-level explanation

The real value is not only detecting one pair. It is showing the **cumulative load** of the whole regimen up front.

## Key features

### Intelligent input
- Intelligent search box with fuzzy single-match behavior tuned for speed and accuracy
- Batch matching for pasted medication lists
- Accepts multiple drugs typed in a single line
- Accepts copied text chunks that contain mixed medication lists
- Works well with keyboard-first workflow

### Flexible drug matching
- Accepts both **generic** and **commercial/brand** names
- Brand matching is primarily curated in **US-style naming/formulation conventions**
- Supports **combination pills** and expands them into all ingredients
- Automatically rejects ingredients already present in the list when a new combo or alias overlaps
- Makes it easy to remove an existing drug from the current case

### Alias system
- Create a **local custom alias dictionary** for your own naming habits
- Especially useful for local shorthand and combination products
- Manual alias creation works very well today
- **Remaining roadmap:** smoother syncing of custom aliases across devices, likely through a lightweight remote layer such as Vercel Blob or Supabase-backed login

### Interaction display
- Real-time matching once the input is entered
- Fast deterministic pairwise interaction checking
- Summary box showing:
  - number of significant interactions
  - major/moderate/minor breakdown
  - top interaction at a glance
  - cumulative stack hits
- Pairwise results are easy to scan quickly
- Copy prompt for deeper mechanism review in a local or external LLM chat if needed

### Cumulative stack warnings
The cumulative stack engine is one of the most useful parts of the app.

It can flag additive burden across different drug groups, including examples like:
- bleeding risk
- hyperkalemia
- hyperglycemia
- serotonergic toxicity
- nephrotoxicity
- and other clinically relevant stacks

This is valuable because the important bedside question is often:
**what overall side-effect burden is this whole regimen creating?**

### Pharmacogenomics and phenotype-aware warnings
- Integrated local pharmacogenomics warning layer
- Pairwise interaction results stay separate from PGx guidance
- Warning strength can be modified by patient phenotype, such as renal or hepatic context
- Lets you copy a prompt for mechanism-focused follow-up in LLM chat when you want explanation beyond the deterministic rule

### UX
- Modern, highly styled UI — not a default Tailwind-looking app
- Built to feel fast and clean on desktop
- Also works well on iPhone
- Best desktop workflow: paste a medication list from the inpatient record and review results immediately
- Works almost perfectly with keyboard only

## Screenshots

### Main interaction view
![Drug Interaction Checker main screen](./docs/images/drug-interaction-main.png)

### Pharmacogenomics + cumulative load + pairwise results
![Drug Interaction Checker pharmacogenomics and cumulative load](./docs/images/drug-interaction-pgx.png)

## How it works

- Local deterministic interaction rules and precomputed indexes drive the core checker
- Pairwise interaction severity is shown directly in the app
- Cumulative stack logic runs locally
- Pharmacogenomics prompts run locally
- Results appear in real time once matching is complete
- Optional prompt-copy helpers exist for asking an LLM about mechanism, but **AI is not part of the core checking engine**

## Current product status

The app already covers the core workflow very well:
- bedside medication-list entry
- fuzzy matching
- generic + brand support
- combination pill expansion
- duplicate ingredient rejection
- pairwise interaction review
- cumulative stack warnings
- pharmacogenomics prompts
- keyboard-first use
- mobile and desktop support

In practice, the checker is already very close to the intended end state.

## Remaining roadmap

Only one meaningful product item remains:
- **sync custom aliases across devices**

Everything else is already focused on making the current local-first workflow fast, reliable, and easy to use.

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Zustand + IndexedDB for local-first persistence
- RxNorm-based normalization
- DDInter-derived pairwise interaction layer
- Local deterministic cumulative-stack rules
- Local deterministic pharmacogenomics rules

## Getting started

```bash
npm install
npm run build:data
npm run dev
```

Open `http://localhost:3000`.

## Notes

- Free to use
- No AI required for the core checker
- Designed for clinicians who need immediate signal, not a slow chat workflow
- Decision-support only. Final prescribing decisions still belong to the clinician using primary references
