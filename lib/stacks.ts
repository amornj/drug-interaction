import type { InteractionSeverity, InteractionSource } from "@/lib/interactions";
import type { Drug } from "@/lib/store";

export type StackDomain =
  | "qt"
  | "bleeding"
  | "serotonergic"
  | "anticholinergic"
  | "eps"
  | "ergotism"
  | "myocardialdepression"
  | "fluidretention"
  | "lacticacidosis"
  | "nephrotoxic"
  | "hyperkalemia"
  | "hypokalemia"
  | "hypercalcemia"
  | "hypocalcemia"
  | "hyponatremia"
  | "hypernatremia"
  | "hyperuricemia"
  | "hypoglycemia"
  | "hyperglycemia"
  | "hagma"
  | "normalgapacidosis"
  | "bradycardia"
  | "druginducedseizure"
  | "cnsdepression"
  | "fallsrisk";

export type StackWarning = {
  domain: StackDomain;
  title: string;
  severity: InteractionSeverity;
  summary: string;
  matchedDrugs: Array<{ rxcui: string; name: string }>;
  sources: InteractionSource[];
};

type NormalizedDrug = Drug & { normalizedName: string };

type StackRule = {
  domain: StackDomain;
  title: string;
  matches: string[];
  highRiskMatches?: string[];
  summary: (matched: string[]) => string;
  detectSeverity?: (
    matchedKeywords: string[],
    matchedDrugs: NormalizedDrug[]
  ) => InteractionSeverity;
};

const STACK_RULE_SOURCE: InteractionSource = {
  name: "Cumulative stack rules",
  version: "2026-04-metabolic-electrolyte",
};

const stackRules: StackRule[] = [
  {
    domain: "qt",
    title: "QT prolongation stack",
    matches: [
      "amiodarone",
      "sotalol",
      "quinidine",
      "azithromycin",
      "clarithromycin",
      "erythromycin",
      "levofloxacin",
      "moxifloxacin",
      "ciprofloxacin",
      "haloperidol",
      "quetiapine",
      "risperidone",
      "ziprasidone",
      "pimozide",
      "chlorpromazine",
      "thioridazine",
      "citalopram",
      "escitalopram",
      "methadone",
      "ondansetron",
      "hydroxychloroquine",
      "chloroquine",
      "domperidone",
      "droperidol",
      "ranolazine",
      "quinine",
      "pentamidine",
    ],
    highRiskMatches: ["amiodarone", "sotalol", "quinidine", "methadone", "ziprasidone", "droperidol", "hydroxychloroquine", "pimozide", "thioridazine", "pentamidine"],
    summary: (matched) =>
      `Multiple QT-risk drugs detected: ${matched.join(", ")}. Review ECG and electrolyte monitoring needs, especially if potassium or magnesium may drift low.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const hasHighRiskQt = ["amiodarone", "sotalol", "quinidine", "methadone", "ziprasidone"].some((keyword) => matchedKeywords.includes(keyword));
      const hasHypokalemiaDrivers = matchedDrugs.some((drug) =>
        [
          "furosemide",
          "bumetanide",
          "torsemide",
          "hydrochlorothiazide",
          "chlorthalidone",
          "indapamide",
          "metolazone",
          "insulin",
          "albuterol",
          "salbutamol",
          "terbutaline",
        ].some((keyword) => drug.normalizedName.includes(keyword))
      );

      if (matchedDrugs.length >= 2 || (hasHighRiskQt && hasHypokalemiaDrivers)) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "hyperkalemia",
    title: "Hyperkalemia risk stack",
    matches: [
      "spironolactone",
      "eplerenone",
      "amiloride",
      "triamterene",
      "lisinopril",
      "enalapril",
      "ramipril",
      "perindopril",
      "losartan",
      "valsartan",
      "candesartan",
      "irbesartan",
      "telmisartan",
      "sacubitril/valsartan",
      "trimethoprim",
      "tacrolimus",
      "cyclosporine",
      "potassium chloride",
    ],
    highRiskMatches: [
      "spironolactone",
      "eplerenone",
      "amiloride",
      "triamterene",
      "trimethoprim",
      "tacrolimus",
      "cyclosporine",
      "potassium chloride",
    ],
    summary: (matched) =>
      `Hyperkalemia-promoting drugs are stacking: ${matched.join(", ")}. Recheck potassium and renal function, especially with RAAS blockade or potassium supplementation.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const hasMra = ["spironolactone", "eplerenone", "amiloride", "triamterene"].some((keyword) => matchedKeywords.includes(keyword));
      const raasCount = [
        "lisinopril",
        "enalapril",
        "ramipril",
        "perindopril",
        "losartan",
        "valsartan",
        "candesartan",
        "irbesartan",
        "telmisartan",
        "sacubitril/valsartan",
      ].filter((keyword) => matchedKeywords.includes(keyword)).length;
      const hasPotassiumSupplement = matchedKeywords.includes("potassium chloride");
      const hasCkdModifier = matchedDrugs.some((drug) =>
        ["finerenone", "spironolactone", "eplerenone", "lisinopril", "losartan", "valsartan", "sacubitril/valsartan"].some((keyword) =>
          drug.normalizedName.includes(keyword)
        )
      );

      if ((hasMra && raasCount >= 1) || hasPotassiumSupplement || matchedDrugs.length >= 3) {
        return "Major";
      }

      if (raasCount >= 2 || hasCkdModifier) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "hypokalemia",
    title: "Hypokalemia risk stack",
    matches: [
      "furosemide",
      "bumetanide",
      "torsemide",
      "hydrochlorothiazide",
      "chlorthalidone",
      "indapamide",
      "metolazone",
      "insulin",
      "albuterol",
      "salbutamol",
      "terbutaline",
      "prednisone",
      "prednisolone",
      "hydrocortisone",
      "dexamethasone",
    ],
    highRiskMatches: [
      "furosemide",
      "bumetanide",
      "torsemide",
      "metolazone",
      "insulin",
      "albuterol",
      "salbutamol",
      "terbutaline",
    ],
    summary: (matched) =>
      `Hypokalemia-promoting drugs are stacking: ${matched.join(", ")}. Recheck potassium, magnesium, and arrhythmia risk if diuresis or intracellular potassium shift is expected.`,
  },
  {
    domain: "hypercalcemia",
    title: "Hypercalcemia risk stack",
    matches: [
      "hydrochlorothiazide",
      "chlorthalidone",
      "indapamide",
      "metolazone",
      "calcium carbonate",
      "calcium citrate",
      "calcium acetate",
      "calcitriol",
      "cholecalciferol",
      "ergocalciferol",
      "alfacalcidol",
      "lithium",
      "teriparatide",
      "abaloparatide",
    ],
    highRiskMatches: [
      "calcium carbonate",
      "calcium citrate",
      "calcium acetate",
      "calcitriol",
      "alfacalcidol",
      "lithium",
      "teriparatide",
      "abaloparatide",
    ],
    summary: (matched) =>
      `Hypercalcemia-promoting drugs are stacking: ${matched.join(", ")}. Recheck calcium, renal function, and calcium/vitamin D exposure, especially with thiazides or lithium.`,
  },
  {
    domain: "hypocalcemia",
    title: "Hypocalcemia risk stack",
    matches: [
      "alendronate",
      "risedronate",
      "ibandronate",
      "zoledronic acid",
      "pamidronate",
      "denosumab",
      "cinacalcet",
      "etelcalcetide",
      "foscarnet",
      "phenytoin",
      "phenobarbital",
      "carbamazepine",
      "furosemide",
      "bumetanide",
      "torsemide",
    ],
    highRiskMatches: [
      "zoledronic acid",
      "pamidronate",
      "denosumab",
      "cinacalcet",
      "etelcalcetide",
      "foscarnet",
    ],
    summary: (matched) =>
      `Hypocalcemia-promoting drugs are stacking: ${matched.join(", ")}. Recheck calcium, magnesium, vitamin D status, renal function, and symptoms such as paresthesias or tetany.`,
  },
  {
    domain: "hyponatremia",
    title: "Hyponatremia risk stack",
    matches: [
      "hydrochlorothiazide",
      "chlorthalidone",
      "indapamide",
      "metolazone",
      "desmopressin",
      "carbamazepine",
      "oxcarbazepine",
      "eslicarbazepine",
      "fluoxetine",
      "sertraline",
      "paroxetine",
      "citalopram",
      "escitalopram",
      "fluvoxamine",
      "venlafaxine",
      "desvenlafaxine",
      "duloxetine",
      "mirtazapine",
      "trazodone",
      "haloperidol",
      "risperidone",
      "olanzapine",
      "quetiapine",
      "cyclophosphamide",
      "vincristine",
    ],
    highRiskMatches: [
      "hydrochlorothiazide",
      "chlorthalidone",
      "indapamide",
      "metolazone",
      "desmopressin",
      "carbamazepine",
      "oxcarbazepine",
      "cyclophosphamide",
      "vincristine",
    ],
    summary: (matched) =>
      `Hyponatremia-promoting drugs are stacking: ${matched.join(", ")}. Recheck sodium trend, fluid intake, neurologic symptoms, and SIADH risk before continuing the full regimen.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const hasThiazide = ["hydrochlorothiazide", "chlorthalidone", "indapamide", "metolazone"].some((keyword) =>
        matchedKeywords.includes(keyword)
      );
      const hasDesmopressin = matchedKeywords.includes("desmopressin");
      const hasAntiseizureSiadh = ["carbamazepine", "oxcarbazepine", "eslicarbazepine"].some((keyword) =>
        matchedKeywords.includes(keyword)
      );

      if (hasDesmopressin || (hasThiazide && hasAntiseizureSiadh) || matchedDrugs.length >= 3) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "hypernatremia",
    title: "Hypernatremia risk stack",
    matches: [
      "sodium bicarbonate",
      "sodium chloride",
      "hypertonic saline",
      "lithium",
      "demeclocycline",
      "mannitol",
      "lactulose",
      "furosemide",
      "bumetanide",
      "torsemide",
      "prednisone",
      "prednisolone",
      "hydrocortisone",
      "fludrocortisone",
      "dexamethasone",
    ],
    highRiskMatches: [
      "sodium bicarbonate",
      "sodium chloride",
      "hypertonic saline",
      "lithium",
      "demeclocycline",
      "mannitol",
      "fludrocortisone",
    ],
    summary: (matched) =>
      `Hypernatremia-promoting drugs are stacking: ${matched.join(", ")}. Recheck sodium, free-water balance, osmotic diuresis, and sodium load exposure.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const hasSodiumLoad = ["sodium bicarbonate", "sodium chloride", "hypertonic saline"].some((keyword) =>
        matchedKeywords.includes(keyword)
      );
      const hasDiWaterLoss = ["lithium", "demeclocycline", "mannitol", "furosemide", "bumetanide", "torsemide", "lactulose"].some((keyword) =>
        matchedKeywords.includes(keyword)
      );

      if ((hasSodiumLoad && hasDiWaterLoss) || matchedDrugs.length >= 3) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "hyperuricemia",
    title: "Hyperuricemia and gout risk stack",
    matches: [
      "hydrochlorothiazide",
      "chlorthalidone",
      "indapamide",
      "furosemide",
      "bumetanide",
      "torsemide",
      "aspirin",
      "pyrazinamide",
      "ethambutol",
      "cyclosporine",
      "tacrolimus",
      "niacin",
      "nicotinic acid",
      "bempedoic acid",
      "bompedoic acid",
    ],
    highRiskMatches: [
      "pyrazinamide",
      "ethambutol",
      "cyclosporine",
      "tacrolimus",
      "bempedoic acid",
      "bompedoic acid",
    ],
    summary: (matched) =>
      `Hyperuricemia-promoting drugs are stacking: ${matched.join(", ")}. Recheck uric acid and gout risk, especially with diuretics, TB therapy, calcineurin inhibitors, niacin, aspirin, or bempedoic acid.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const hasTbDrug = ["pyrazinamide", "ethambutol"].some((keyword) =>
        matchedKeywords.includes(keyword)
      );
      const hasCalcineurinInhibitor = ["cyclosporine", "tacrolimus"].some((keyword) =>
        matchedKeywords.includes(keyword)
      );
      const diureticCount = [
        "hydrochlorothiazide",
        "chlorthalidone",
        "indapamide",
        "furosemide",
        "bumetanide",
        "torsemide",
      ].filter((keyword) => matchedKeywords.includes(keyword)).length;

      if (hasTbDrug || hasCalcineurinInhibitor || diureticCount >= 2 || matchedDrugs.length >= 3) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "hypoglycemia",
    title: "Hypoglycemia risk stack",
    matches: [
      "insulin",
      "glimepiride",
      "gliclazide",
      "glipizide",
      "glyburide",
      "glibenclamide",
      "repaglinide",
      "nateglinide",
      "linezolid",
    ],
    highRiskMatches: [
      "insulin",
      "glimepiride",
      "gliclazide",
      "glipizide",
      "glyburide",
      "glibenclamide",
      "repaglinide",
      "nateglinide",
      "linezolid",
    ],
    summary: (matched) =>
      `Hypoglycemia-risk drugs are stacking: ${matched.join(", ")}. Recheck glucose trend, meal intake, and renal function before keeping the full regimen.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const hasInsulin = matchedKeywords.includes("insulin");
      const hasSulfonylureaOrMeglitinide = [
        "glimepiride",
        "gliclazide",
        "glipizide",
        "glyburide",
        "glibenclamide",
        "repaglinide",
        "nateglinide",
      ].some((keyword) => matchedKeywords.includes(keyword));
      const hasLinezolid = matchedKeywords.includes("linezolid");

      if (
        (hasInsulin && hasSulfonylureaOrMeglitinide) ||
        (hasLinezolid && (hasInsulin || hasSulfonylureaOrMeglitinide)) ||
        matchedDrugs.length >= 3
      ) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "hyperglycemia",
    title: "Hyperglycemia risk stack",
    matches: [
      "prednisone",
      "prednisolone",
      "hydrocortisone",
      "dexamethasone",
      "methylprednisolone",
      "tacrolimus",
      "cyclosporine",
      "hydrochlorothiazide",
      "chlorthalidone",
      "olanzapine",
      "quetiapine",
      "risperidone",
    ],
    highRiskMatches: [
      "prednisone",
      "prednisolone",
      "hydrocortisone",
      "dexamethasone",
      "methylprednisolone",
      "tacrolimus",
      "olanzapine",
      "quetiapine",
    ],
    summary: (matched) =>
      `Hyperglycemia-promoting drugs are stacking: ${matched.join(", ")}. Recheck glucose monitoring needs and whether temporary diabetes-regimen adjustment is required.`,
  },
  {
    domain: "hagma",
    title: "High anion gap metabolic acidosis stack",
    matches: [
      "methanol",
      "ethylene glycol",
      "propylene glycol",
      "lorazepam",
      "diazepam",
      "salicylate",
      "acetylsalicylic acid",
      "aspirin",
      "iron",
      "ferrous sulfate",
      "ferrous gluconate",
      "ferrous fumarate",
      "isoniazid",
    ],
    highRiskMatches: [
      "methanol",
      "ethylene glycol",
      "propylene glycol",
      "salicylate",
      "acetylsalicylic acid",
      "aspirin",
      "iron",
      "isoniazid",
    ],
    summary: (matched) =>
      `High anion gap metabolic acidosis risk is stacking: ${matched.join(", ")}. Recheck acid-base status, anion gap, osmolar gap, lactate, ketones, salicylate or iron levels when relevant, and overdose/toxic alcohol context.`,
    detectSeverity: () => "Major",
  },
  {
    domain: "normalgapacidosis",
    title: "Normal-gap metabolic acidosis stack",
    matches: [
      "acetazolamide",
      "topiramate",
      "amphotericin",
      "ifosfamide",
      "tenofovir",
    ],
    highRiskMatches: ["amphotericin", "ifosfamide", "tenofovir"],
    summary: (matched) =>
      `Normal-gap metabolic acidosis risk is stacking: ${matched.join(", ")}. Recheck bicarbonate, chloride gap pattern, potassium, urinalysis, and renal tubular injury risk.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const hasCarbonicAnhydraseInhibitor = ["acetazolamide", "topiramate"].some((keyword) =>
        matchedKeywords.includes(keyword)
      );
      const hasTubularToxin = ["amphotericin", "ifosfamide", "tenofovir"].some((keyword) =>
        matchedKeywords.includes(keyword)
      );

      if ((hasCarbonicAnhydraseInhibitor && hasTubularToxin) || matchedDrugs.length >= 3) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "bleeding",
    title: "Bleeding risk stack",
    matches: [
      "warfarin",
      "apixaban",
      "rivaroxaban",
      "dabigatran",
      "edoxaban",
      "enoxaparin",
      "heparin",
      "aspirin",
      "clopidogrel",
      "ticagrelor",
      "prasugrel",
      "ibuprofen",
      "ketorolac",
      "naproxen",
      "diclofenac",
      "celecoxib",
      "sertraline",
      "fluoxetine",
      "paroxetine",
      "venlafaxine",
      "duloxetine",
    ],
    highRiskMatches: [
      "warfarin",
      "apixaban",
      "rivaroxaban",
      "dabigatran",
      "edoxaban",
      "enoxaparin",
      "heparin",
    ],
    summary: (matched) =>
      `Bleeding-risk drugs are stacking: ${matched.join(", ")}. Recheck additive anticoagulant, antiplatelet, NSAID, or SSRI exposure.`,
  },
  {
    domain: "serotonergic",
    title: "Serotonin syndrome stack",
    matches: [
      "phenelzine",
      "tranylcypromine",
      "isocarboxazid",
      "selegiline",
      "rasagiline",
      "fluoxetine",
      "sertraline",
      "paroxetine",
      "citalopram",
      "escitalopram",
      "fluvoxamine",
      "venlafaxine",
      "desvenlafaxine",
      "duloxetine",
      "levomilnacipran",
      "tramadol",
      "linezolid",
      "methylene blue",
      "amitriptyline",
      "clomipramine",
      "imipramine",
      "nortriptyline",
      "mirtazapine",
      "trazodone",
      "methadone",
      "dextromethorphan",
      "fentanyl",
      "st john",
      "buspirone",
      "lithium",
    ],
    highRiskMatches: [
      "phenelzine",
      "tranylcypromine",
      "isocarboxazid",
      "selegiline",
      "rasagiline",
      "linezolid",
      "methylene blue",
      "tramadol",
      "methadone",
      "dextromethorphan",
      "st john",
    ],
    summary: (matched) =>
      `High-risk serotonergic combination detected: ${matched.join(", ")}. Review serotonin syndrome risk, especially with MAOI exposure, tramadol, linezolid, methylene blue, or multiple antidepressants.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const hasMaoi = ["phenelzine", "tranylcypromine", "isocarboxazid", "selegiline", "rasagiline"].some((keyword) => matchedKeywords.includes(keyword));
      const hasSsriSnri = [
        "fluoxetine",
        "sertraline",
        "paroxetine",
        "citalopram",
        "escitalopram",
        "fluvoxamine",
        "venlafaxine",
        "desvenlafaxine",
        "duloxetine",
        "levomilnacipran",
      ].some((keyword) => matchedKeywords.includes(keyword));
      const hasTramadol = matchedKeywords.includes("tramadol");
      const hasLinezolid = matchedKeywords.includes("linezolid");
      const hasMethyleneBlue = matchedKeywords.includes("methylene blue");
      const antidepressantCount = matchedDrugs.filter((drug) =>
        [
          "fluoxetine",
          "sertraline",
          "paroxetine",
          "citalopram",
          "escitalopram",
          "fluvoxamine",
          "venlafaxine",
          "desvenlafaxine",
          "duloxetine",
          "levomilnacipran",
          "amitriptyline",
          "clomipramine",
          "imipramine",
          "nortriptyline",
          "mirtazapine",
          "trazodone",
          "phenelzine",
          "tranylcypromine",
          "isocarboxazid",
          "selegiline",
          "rasagiline",
        ].some((keyword) => drug.normalizedName.includes(keyword))
      ).length;

      if (
        (hasMaoi && hasSsriSnri) ||
        ((hasSsriSnri || antidepressantCount >= 1) && hasTramadol) ||
        ((hasSsriSnri || antidepressantCount >= 1) && hasLinezolid) ||
        ((hasSsriSnri || antidepressantCount >= 1) && hasMethyleneBlue) ||
        antidepressantCount >= 2
      ) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "anticholinergic",
    title: "Anticholinergic syndrome stack",
    matches: [
      "amitriptyline",
      "nortriptyline",
      "imipramine",
      "clomipramine",
      "diphenhydramine",
      "hydroxyzine",
      "chlorpheniramine",
      "promethazine",
      "meclizine",
      "oxybutynin",
      "tolterodine",
      "solifenacin",
      "darifenacin",
      "fesoterodine",
      "trospium",
      "scopolamine",
      "atropine",
      "glycopyrrolate",
      "tiotropium",
      "ipratropium",
      "benztropine",
      "trihexyphenidyl",
      "procyclidine",
      "orphenadrine",
      "cyclobenzaprine",
      "quetiapine",
      "olanzapine",
      "clozapine",
      "paroxetine",
    ],
    highRiskMatches: [
      "amitriptyline",
      "clomipramine",
      "diphenhydramine",
      "oxybutynin",
      "scopolamine",
      "atropine",
      "trihexyphenidyl",
      "clozapine",
    ],
    summary: (matched) =>
      `Anticholinergic drugs are stacking: ${matched.join(", ")}. Review cumulative anticholinergic burden: delirium, urinary retention, ileus, tachycardia, and hyperthermia — risk multiplies with each additional agent.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const highRiskCount = ["amitriptyline", "clomipramine", "diphenhydramine", "oxybutynin", "scopolamine", "atropine", "trihexyphenidyl", "clozapine"]
        .filter((k) => matchedKeywords.includes(k)).length;
      if (highRiskCount >= 2 || matchedDrugs.length >= 3) {
        return "Major";
      }
      return "Moderate";
    },
  },
  {
    domain: "eps",
    title: "Extrapyramidal syndrome stack",
    matches: [
      "haloperidol",
      "fluphenazine",
      "perphenazine",
      "chlorpromazine",
      "risperidone",
      "paliperidone",
      "olanzapine",
      "ziprasidone",
      "metoclopramide",
      "prochlorperazine",
    ],
    highRiskMatches: ["haloperidol", "fluphenazine", "metoclopramide", "prochlorperazine"],
    summary: (matched) =>
      `Dopamine-blocking drugs are stacking: ${matched.join(", ")}. Review cumulative extrapyramidal symptom risk including dystonia, parkinsonism, akathisia, and tardive syndromes.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const highRiskCount =
        ["haloperidol", "fluphenazine", "metoclopramide", "prochlorperazine"].filter((keyword) =>
          matchedKeywords.includes(keyword)
        ).length;

      if (highRiskCount >= 2 || matchedDrugs.length >= 3) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "ergotism",
    title: "Ergotism syndrome stack",
    matches: [
      "ergotamine",
      "dihydroergotamine",
      "cafergot",
      "ergot",
      "sumatriptan",
      "rizatriptan",
      "zolmitriptan",
      "naratriptan",
      "almotriptan",
      "eletriptan",
      "frovatriptan",
      "clarithromycin",
      "erythromycin",
      "ketoconazole",
      "itraconazole",
      "voriconazole",
      "posaconazole",
      "ritonavir",
      "cobicistat",
    ],
    highRiskMatches: [
      "ergotamine",
      "dihydroergotamine",
      "cafergot",
      "ergot",
      "clarithromycin",
      "erythromycin",
      "ketoconazole",
      "itraconazole",
      "voriconazole",
      "posaconazole",
      "ritonavir",
      "cobicistat",
    ],
    summary: (matched) =>
      `Ergot-related vasospasm risk detected: ${matched.join(", ")}. Review for ergotism risk when ergot derivatives overlap with triptans or strong CYP3A4 inhibitors.`,
    detectSeverity: (matchedKeywords) => {
      const hasErgot = ["ergotamine", "dihydroergotamine", "cafergot", "ergot"].some((keyword) =>
        matchedKeywords.includes(keyword)
      );
      const hasTriptan = [
        "sumatriptan",
        "rizatriptan",
        "zolmitriptan",
        "naratriptan",
        "almotriptan",
        "eletriptan",
        "frovatriptan",
      ].some((keyword) => matchedKeywords.includes(keyword));
      const hasStrongCyp3a4Inhibitor = [
        "clarithromycin",
        "erythromycin",
        "ketoconazole",
        "itraconazole",
        "voriconazole",
        "posaconazole",
        "ritonavir",
        "cobicistat",
      ].some((keyword) => matchedKeywords.includes(keyword));

      if (hasErgot && (hasTriptan || hasStrongCyp3a4Inhibitor)) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "myocardialdepression",
    title: "Myocardial depression stack",
    matches: [
      "doxorubicin",
      "daunorubicin",
      "epirubicin",
      "idarubicin",
      "trastuzumab",
      "cyclophosphamide",
      "ifosfamide",
      "fluorouracil",
      "5-fluorouracil",
      "5-fu",
      "cisplatin",
      "mavacamten",
      "aficamten",
      "cocaine",
      "amphetamine",
      "carbamazepine",
      "phenytoin",
      "verapamil",
      "diltiazem",
      "flecainide",
      "disopyramide",
      "propofol",
      "nivolumab",
      "clozapine",
    ],
    highRiskMatches: [
      "doxorubicin",
      "daunorubicin",
      "epirubicin",
      "idarubicin",
      "trastuzumab",
      "cyclophosphamide",
      "ifosfamide",
      "fluorouracil",
      "5-fluorouracil",
      "5-fu",
      "cisplatin",
      "mavacamten",
      "aficamten",
      "flecainide",
      "disopyramide",
      "propofol",
      "nivolumab",
      "clozapine",
    ],
    summary: (matched) =>
      `Myocardial-depressant exposures are stacking: ${matched.join(", ")}. Recheck LV function, shock or myocarditis context, lactate and acid-base burden when relevant, and additive negative inotropy before continuing the full regimen.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const highRiskCount =
        [
          "doxorubicin",
          "daunorubicin",
          "epirubicin",
          "idarubicin",
          "trastuzumab",
          "cyclophosphamide",
          "ifosfamide",
          "fluorouracil",
          "5-fluorouracil",
          "5-fu",
          "cisplatin",
          "mavacamten",
          "aficamten",
          "flecainide",
          "disopyramide",
          "propofol",
          "nivolumab",
          "clozapine",
        ].filter((keyword) => matchedKeywords.includes(keyword)).length;
      const hasNegativeInotrope = [
        "verapamil",
        "diltiazem",
        "flecainide",
        "disopyramide",
        "mavacamten",
        "aficamten",
      ].some((keyword) => matchedKeywords.includes(keyword));
      const hasChemoCardiotoxin = [
        "doxorubicin",
        "daunorubicin",
        "epirubicin",
        "idarubicin",
        "trastuzumab",
        "cyclophosphamide",
        "ifosfamide",
        "fluorouracil",
        "5-fluorouracil",
        "5-fu",
        "cisplatin",
      ].some((keyword) => matchedKeywords.includes(keyword));
      const hasMyocarditisTrigger = ["nivolumab", "clozapine"].some((keyword) =>
        matchedKeywords.includes(keyword)
      );

      if (
        highRiskCount >= 2 ||
        (hasNegativeInotrope && hasChemoCardiotoxin) ||
        (hasNegativeInotrope && hasMyocarditisTrigger) ||
        matchedDrugs.length >= 3
      ) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "fluidretention",
    title: "Drug-induced fluid retention stack",
    matches: [
      "ibuprofen",
      "ketorolac",
      "naproxen",
      "diclofenac",
      "celecoxib",
      "prednisone",
      "prednisolone",
      "methylprednisolone",
      "dexamethasone",
      "hydrocortisone",
      "fludrocortisone",
      "estrogen",
      "estradiol",
      "conjugated estrogens",
      "amlodipine",
      "nifedipine",
      "felodipine",
      "nicardipine",
      "verapamil",
      "diltiazem",
      "minoxidil",
      "hydralazine",
      "pioglitazone",
    ],
    highRiskMatches: [
      "fludrocortisone",
      "minoxidil",
      "hydralazine",
      "pioglitazone",
      "amlodipine",
      "nifedipine",
      "felodipine",
      "nicardipine",
      "verapamil",
      "diltiazem",
    ],
    summary: (matched) =>
      `Fluid-retaining drugs are stacking: ${matched.join(", ")}. Recheck edema, weight trend, blood pressure, heart-failure context, and whether vasodilatory edema or sodium retention is contributing.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const hasNsaid = ["ibuprofen", "ketorolac", "naproxen", "diclofenac", "celecoxib"].some(
        (keyword) => matchedKeywords.includes(keyword)
      );
      const hasSteroidOrMineralocorticoid = [
        "prednisone",
        "prednisolone",
        "methylprednisolone",
        "dexamethasone",
        "hydrocortisone",
        "fludrocortisone",
      ].some((keyword) => matchedKeywords.includes(keyword));
      const hasCcbOrVasodilator = [
        "amlodipine",
        "nifedipine",
        "felodipine",
        "nicardipine",
        "verapamil",
        "diltiazem",
        "minoxidil",
        "hydralazine",
      ].some((keyword) => matchedKeywords.includes(keyword));
      const hasPioglitazone = matchedKeywords.includes("pioglitazone");

      if (
        matchedDrugs.length >= 3 ||
        (hasNsaid && hasSteroidOrMineralocorticoid) ||
        (hasSteroidOrMineralocorticoid && hasCcbOrVasodilator) ||
        (hasPioglitazone && (hasNsaid || hasSteroidOrMineralocorticoid || hasCcbOrVasodilator))
      ) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "lacticacidosis",
    title: "Drug-induced lactic acidosis stack",
    matches: [
      "metformin",
      "linezolid",
      "propofol",
      "zidovudine",
      "stavudine",
      "didanosine",
      "lamivudine",
      "abacavir",
      "emtricitabine",
      "tenofovir",
    ],
    highRiskMatches: ["metformin", "linezolid", "propofol", "zidovudine", "stavudine", "didanosine"],
    summary: (matched) =>
      `Potential drug-induced lactic acidosis stack detected: ${matched.join(", ")}. Review mitochondrial toxicity risk, shock/perfusion context, renal function, and acid-base monitoring needs.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const highRiskCount =
        ["metformin", "linezolid", "propofol", "zidovudine", "stavudine", "didanosine"].filter((keyword) =>
          matchedKeywords.includes(keyword)
        ).length;
      const nrtiCount = [
        "zidovudine",
        "stavudine",
        "didanosine",
        "lamivudine",
        "abacavir",
        "emtricitabine",
        "tenofovir",
      ].filter((keyword) => matchedKeywords.includes(keyword)).length;

      if (highRiskCount >= 2 || (matchedKeywords.includes("metformin") && matchedKeywords.includes("linezolid")) || nrtiCount >= 2 || matchedDrugs.length >= 3) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "nephrotoxic",
    title: "Nephrotoxic burden stack",
    matches: [
      "ibuprofen",
      "ketorolac",
      "naproxen",
      "diclofenac",
      "celecoxib",
      "gentamicin",
      "tobramycin",
      "vancomycin",
      "tacrolimus",
      "cyclosporine",
      "amphotericin b",
      "lisinopril",
      "enalapril",
      "losartan",
      "valsartan",
      "furosemide",
    ],
    highRiskMatches: ["gentamicin", "tobramycin", "vancomycin", "amphotericin b", "tacrolimus", "cyclosporine"],
    summary: (matched) =>
      `Nephrotoxic exposures are stacking: ${matched.join(", ")}. Review additive kidney-injury risk and monitoring needs.`,
  },
  {
    domain: "bradycardia",
    title: "Bradycardia risk stack",
    matches: [
      "digoxin",
      "amiodarone",
      "verapamil",
      "diltiazem",
      "adenosine",
      "metoprolol",
      "bisoprolol",
      "carvedilol",
      "esmolol",
      "propranolol",
      "lacosamide",
      "flecainide",
      "propafenone",
      "sotalol",
      "ivabradine",
      "clonidine",
      "dexmedetomidine",
      "donepezil",
      "rivastigmine",
    ],
    highRiskMatches: [
      "digoxin",
      "amiodarone",
      "verapamil",
      "diltiazem",
      "adenosine",
      "metoprolol",
      "bisoprolol",
      "carvedilol",
      "esmolol",
      "propranolol",
      "ivabradine",
    ],
    summary: (matched) =>
      `Bradycardic drugs are stacking: ${matched.join(", ")}. Review resting heart rate, AV nodal conduction, blood pressure, and symptom burden if rate-slowing therapies overlap.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const avNodalBlockerCount = [
        "digoxin",
        "amiodarone",
        "verapamil",
        "diltiazem",
        "adenosine",
        "metoprolol",
        "bisoprolol",
        "carvedilol",
        "esmolol",
        "propranolol",
        "sotalol",
        "ivabradine",
      ].filter((keyword) => matchedKeywords.includes(keyword)).length;

      const hasConductionAgent = ["flecainide", "propafenone", "lacosamide"].some(
        (keyword) => matchedKeywords.includes(keyword)
      );
      const hasCentralOrCholinergicAgent = [
        "clonidine",
        "dexmedetomidine",
        "donepezil",
        "rivastigmine",
      ].some((keyword) => matchedKeywords.includes(keyword));

      if (
        avNodalBlockerCount >= 2 ||
        (avNodalBlockerCount >= 1 && hasConductionAgent) ||
        (avNodalBlockerCount >= 1 && hasCentralOrCholinergicAgent) ||
        matchedDrugs.length >= 3
      ) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "druginducedseizure",
    title: "Drug-induced seizure risk stack",
    matches: [
      "tramadol",
      "bupropion",
      "clozapine",
      "isoniazid",
      "meperidine",
      "pethidine",
      "theophylline",
      "cyclosporine",
      "tacrolimus",
      "imipenem",
      "meropenem",
      "cefepime",
      "metronidazole",
      "ciprofloxacin",
      "lithium",
    ],
    highRiskMatches: [
      "tramadol",
      "bupropion",
      "clozapine",
      "isoniazid",
      "meperidine",
      "pethidine",
      "theophylline",
      "lithium",
    ],
    summary: (matched) =>
      `Proconvulsant drugs are stacking: ${matched.join(", ")}. Review seizure threshold risk, drug levels for narrow-therapeutic-index agents, calcineurin inhibitor neurotoxicity, and pyridoxine status if isoniazid is present.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const highRiskCount = [
        "tramadol",
        "bupropion",
        "clozapine",
        "isoniazid",
        "meperidine",
        "pethidine",
        "theophylline",
        "lithium",
      ].filter((keyword) => matchedKeywords.includes(keyword)).length;

      if (highRiskCount >= 2 || matchedDrugs.length >= 3) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "cnsdepression",
    title: "CNS and respiratory depression stack",
    matches: [
      "morphine",
      "oxycodone",
      "fentanyl",
      "codeine",
      "tramadol",
      "hydrocodone",
      "methadone",
      "buprenorphine",
      "hydromorphone",
      "oxymorphone",
      "tapentadol",
      "diazepam",
      "lorazepam",
      "alprazolam",
      "clonazepam",
      "midazolam",
      "temazepam",
      "oxazepam",
      "chlordiazepoxide",
      "zolpidem",
      "zopiclone",
      "zaleplon",
      "eszopiclone",
      "gabapentin",
      "pregabalin",
      "cyclobenzaprine",
      "baclofen",
      "carisoprodol",
      "methocarbamol",
      "tizanidine",
      "metaxalone",
    ],
    highRiskMatches: [
      "morphine",
      "oxycodone",
      "fentanyl",
      "codeine",
      "hydrocodone",
      "methadone",
      "hydromorphone",
      "diazepam",
      "lorazepam",
      "alprazolam",
      "clonazepam",
      "midazolam",
      "zolpidem",
      "zopiclone",
      "gabapentin",
      "pregabalin",
    ],
    summary: (matched) =>
      `CNS/respiratory-depressant drugs are stacking: ${matched.join(", ")}. Opioid, benzodiazepine, and gabapentinoid combinations carry an FDA black-box warning for respiratory depression — review necessity of each agent and ensure monitoring is in place.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const hasOpioid = [
        "morphine", "oxycodone", "fentanyl", "codeine", "tramadol",
        "hydrocodone", "methadone", "buprenorphine", "hydromorphone",
        "oxymorphone", "tapentadol",
      ].some((k) => matchedKeywords.includes(k));
      const hasBenzoOrZDrug = [
        "diazepam", "lorazepam", "alprazolam", "clonazepam", "midazolam",
        "temazepam", "oxazepam", "chlordiazepoxide",
        "zolpidem", "zopiclone", "zaleplon", "eszopiclone",
      ].some((k) => matchedKeywords.includes(k));
      const hasGabapentinoid = ["gabapentin", "pregabalin"].some((k) => matchedKeywords.includes(k));

      if (
        (hasOpioid && hasBenzoOrZDrug) ||
        (hasOpioid && hasGabapentinoid) ||
        matchedDrugs.length >= 3
      ) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "fallsrisk",
    title: "Polypharmacy falls risk",
    matches: [
      "diazepam",
      "lorazepam",
      "alprazolam",
      "clonazepam",
      "temazepam",
      "zolpidem",
      "zopiclone",
      "zaleplon",
      "morphine",
      "oxycodone",
      "fentanyl",
      "codeine",
      "tramadol",
      "hydrocodone",
      "doxazosin",
      "prazosin",
      "tamsulosin",
      "alfuzosin",
      "terazosin",
      "amitriptyline",
      "nortriptyline",
      "trazodone",
      "mirtazapine",
      "haloperidol",
      "quetiapine",
      "risperidone",
      "olanzapine",
      "chlorpromazine",
      "gabapentin",
      "pregabalin",
      "furosemide",
      "hydrochlorothiazide",
    ],
    highRiskMatches: [
      "diazepam",
      "lorazepam",
      "alprazolam",
      "clonazepam",
      "zolpidem",
      "zopiclone",
    ],
    summary: (matched) =>
      `Multiple falls-risk drugs detected: ${matched.join(", ")}. Review combined sedation, orthostatic hypotension, and dizziness burden — especially in older adults or those with gait instability.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const hasBenzoOrZDrug = [
        "diazepam", "lorazepam", "alprazolam", "clonazepam",
        "temazepam", "zolpidem", "zopiclone", "zaleplon",
      ].some((k) => matchedKeywords.includes(k));
      const hasOpioid = [
        "morphine", "oxycodone", "fentanyl", "codeine", "tramadol", "hydrocodone",
      ].some((k) => matchedKeywords.includes(k));
      const hasGabapentinoid = ["gabapentin", "pregabalin"].some((k) => matchedKeywords.includes(k));
      const hasAlphaBlocker = ["doxazosin", "prazosin", "tamsulosin", "alfuzosin", "terazosin"]
        .some((k) => matchedKeywords.includes(k));

      if (
        (hasBenzoOrZDrug && hasOpioid) ||
        (hasBenzoOrZDrug && hasGabapentinoid) ||
        (hasBenzoOrZDrug && hasAlphaBlocker) ||
        matchedDrugs.length >= 3
      ) {
        return "Major";
      }

      return "Moderate";
    },
  },
];

function normalizeDrugName(name: string) {
  return name.toLowerCase().replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

function detectSeverity(
  rule: StackRule,
  matchedKeywords: string[],
  matchedDrugs: NormalizedDrug[],
  count: number
): InteractionSeverity {
  if (rule.detectSeverity) {
    return rule.detectSeverity(matchedKeywords, matchedDrugs);
  }

  if (rule.domain === "qt") {
    if (count >= 2) {
      return "Major";
    }
  }

  if (
    rule.domain === "hyperkalemia" ||
    rule.domain === "hypokalemia" ||
    rule.domain === "hypercalcemia" ||
    rule.domain === "hypocalcemia" ||
    rule.domain === "hyponatremia" ||
    rule.domain === "hypernatremia" ||
    rule.domain === "hyperuricemia" ||
    rule.domain === "hypoglycemia" ||
    rule.domain === "hyperglycemia" ||
    rule.domain === "fluidretention" ||
    rule.domain === "hagma" ||
    rule.domain === "normalgapacidosis"
  ) {
    const highRiskCount =
      rule.highRiskMatches?.filter((keyword) => matchedKeywords.includes(keyword)).length ?? 0;

    if (count >= 3 || highRiskCount >= 2) {
      return "Major";
    }

    return "Moderate";
  }

  if (count >= 3) {
    return "Major";
  }

  if (rule.highRiskMatches?.some((keyword) => matchedKeywords.includes(keyword))) {
    return "Major";
  }

  return "Moderate";
}

const STACK_REFERENCE_GROUPS: Record<StackDomain, string[]> = {
  qt: [
    "Amiodarone",
    "Sotalol",
    "Quinidine",
    "Macrolides (azithromycin, clarithromycin, erythromycin)",
    "Fluoroquinolones (moxifloxacin, levofloxacin)",
    "Antipsychotics (haloperidol, pimozide, thioridazine, risperidone)",
    "SSRIs (citalopram, escitalopram)",
    "Methadone",
    "Ondansetron",
    "Pentamidine",
  ],
  bleeding: ["Anticoagulants", "Antiplatelets", "NSAIDs", "SSRIs"],
  serotonergic: [
    "SSRIs and SNRIs",
    "TCAs",
    "MAOIs",
    "Tramadol",
    "Meperidine",
    "Dextromethorphan",
    "Linezolid",
    "Methylene blue",
    "Lithium",
    "St. John's wort",
    "Buspirone",
    "Triptans",
  ],
  anticholinergic: [
    "TCAs (amitriptyline, clomipramine, nortriptyline, imipramine)",
    "First-generation antihistamines (diphenhydramine, hydroxyzine, chlorpheniramine)",
    "Bladder antimuscarinics (oxybutynin, solifenacin, tolterodine, darifenacin)",
    "Antiparkinsonian antimuscarinics (benztropine, trihexyphenidyl)",
    "Low-potency antipsychotics (quetiapine, olanzapine, clozapine)",
    "Antispasmodics and antivertigo (scopolamine, glycopyrrolate, meclizine)",
  ],
  eps: ["Antipsychotics", "Metoclopramide", "Prochlorperazine"],
  ergotism: ["Ergot derivatives", "Triptans", "Strong CYP3A4 inhibitors"],
  myocardialdepression: [
    "Anthracyclines",
    "Trastuzumab",
    "Cyclophosphamide",
    "Ifosfamide",
    "5-FU",
    "Cisplatin",
    "Mavacamten and aficamten",
    "Cocaine and amphetamines",
    "Carbamazepine and phenytoin",
    "Verapamil and diltiazem",
    "Flecainide and disopyramide",
    "Propofol",
    "Nivolumab",
    "Clozapine",
  ],
  fluidretention: [
    "NSAIDs",
    "Corticosteroids",
    "Fludrocortisone",
    "Estrogens",
    "CCBs",
    "Minoxidil",
    "Hydralazine",
    "Pioglitazone",
  ],
  lacticacidosis: ["Metformin", "Linezolid", "Propofol", "NRTIs"],
  nephrotoxic: [
    "NSAIDs",
    "Aminoglycosides",
    "Vancomycin",
    "Calcineurin inhibitors",
    "Amphotericin B",
    "ACE inhibitors and ARBs",
    "Loop diuretics",
  ],
  hyperkalemia: [
    "MRAs and K-sparing diuretics",
    "ACE inhibitors",
    "ARBs",
    "Trimethoprim",
    "Calcineurin inhibitors",
    "Potassium supplements",
  ],
  hypokalemia: [
    "Loop diuretics",
    "Thiazide-type diuretics",
    "Insulin",
    "Beta-agonists",
    "Corticosteroids",
  ],
  hypercalcemia: [
    "Thiazide-type diuretics",
    "Calcium salts",
    "Active vitamin D",
    "Vitamin D supplements",
    "Lithium",
    "PTH analogs",
  ],
  hypocalcemia: [
    "Bisphosphonates",
    "Denosumab",
    "Calcimimetics",
    "Foscarnet",
    "Enzyme-inducing antiseizure drugs",
    "Loop diuretics",
  ],
  hyponatremia: [
    "Thiazide-type diuretics",
    "Desmopressin",
    "SSRIs and SNRIs",
    "Carbamazepine",
    "Oxcarbazepine",
    "Antipsychotics",
    "Vincristine",
    "Cyclophosphamide",
  ],
  hypernatremia: [
    "Lactulose",
    "Sodium bicarbonate",
    "Hypertonic saline",
    "Mannitol",
    "SGLT2 inhibitors",
  ],
  hyperuricemia: [
    "Thiazide diuretics",
    "Loop diuretics",
    "Low-dose aspirin",
    "Pyrazinamide",
    "Ethambutol",
    "Calcineurin inhibitors",
    "Niacin",
    "Bempedoic acid",
  ],
  hypoglycemia: ["Insulin", "Sulfonylureas", "Meglitinides", "Linezolid"],
  hyperglycemia: [
    "Corticosteroids",
    "Calcineurin inhibitors",
    "Thiazide diuretics",
    "Atypical antipsychotics",
  ],
  hagma: [
    "Methanol",
    "Ethylene glycol",
    "Propylene glycol",
    "Salicylates",
    "Iron",
    "Isoniazid",
  ],
  normalgapacidosis: [
    "Acetazolamide",
    "Topiramate",
    "Amphotericin B",
    "Ifosfamide",
    "Tenofovir",
  ],
  bradycardia: [
    "Digoxin",
    "Amiodarone",
    "Verapamil and diltiazem",
    "Adenosine",
    "Beta-blockers",
    "Lacosamide",
    "Flecainide and propafenone",
    "Ivabradine",
    "Clonidine",
    "Dexmedetomidine",
    "Cholinesterase inhibitors",
  ],
  druginducedseizure: [
    "Tramadol",
    "Bupropion",
    "Clozapine",
    "Isoniazid",
    "Meperidine",
    "Theophylline",
    "Lithium",
    "Calcineurin inhibitors",
    "Carbapenems",
    "Metronidazole",
    "Fluoroquinolones",
  ],
  cnsdepression: [
    "Opioids",
    "Benzodiazepines",
    "Z-drugs (zolpidem, zopiclone)",
    "Gabapentinoids",
    "Skeletal muscle relaxants",
  ],
  fallsrisk: [
    "Benzodiazepines and Z-drugs",
    "Opioids",
    "Alpha-1 blockers",
    "Sedating antidepressants",
    "Antipsychotics",
    "Gabapentinoids",
    "Loop and thiazide diuretics",
  ],
};

export function getStackReferenceGroups(domain: StackDomain) {
  return STACK_REFERENCE_GROUPS[domain] ?? [];
}

const STACK_HIGH_YIELD_DRUGS: Record<StackDomain, string[]> = {
  qt: [
    "Amiodarone", "Sotalol", "Quinidine", "Azithromycin", "Clarithromycin",
    "Erythromycin", "Moxifloxacin", "Levofloxacin",
    "Haloperidol", "Pimozide", "Thioridazine", "Chlorpromazine",
    "Quetiapine", "Risperidone", "Ziprasidone",
    "Hydroxychloroquine", "Methadone", "Ondansetron", "Droperidol", "Pentamidine",
  ],
  bleeding: [
    "Warfarin", "Apixaban", "Rivaroxaban", "Dabigatran", "Heparin",
    "Enoxaparin", "Aspirin", "Clopidogrel", "Ticagrelor", "Ibuprofen",
    "Sertraline", "Naproxen",
  ],
  serotonergic: [
    "Phenelzine", "Tranylcypromine", "Selegiline", "Rasagiline",
    "Fluoxetine", "Sertraline", "Venlafaxine", "Paroxetine", "Escitalopram",
    "Tramadol", "Linezolid", "Methylene blue",
    "Amitriptyline", "Clomipramine", "Mirtazapine", "Trazodone",
    "Methadone", "Dextromethorphan", "St. John's wort",
  ],
  anticholinergic: [
    "Amitriptyline", "Clomipramine", "Nortriptyline", "Imipramine",
    "Diphenhydramine", "Hydroxyzine", "Promethazine", "Chlorpheniramine",
    "Oxybutynin", "Solifenacin", "Tolterodine", "Darifenacin",
    "Scopolamine", "Atropine", "Glycopyrrolate",
    "Benztropine", "Trihexyphenidyl",
    "Quetiapine", "Olanzapine", "Clozapine",
  ],
  eps: [
    "Haloperidol", "Fluphenazine", "Chlorpromazine", "Risperidone",
    "Ziprasidone", "Metoclopramide", "Prochlorperazine", "Olanzapine",
    "Paliperidone", "Perphenazine",
  ],
  ergotism: [
    "Ergotamine", "Dihydroergotamine", "Sumatriptan", "Rizatriptan",
    "Clarithromycin", "Erythromycin", "Ketoconazole", "Itraconazole",
    "Ritonavir", "Cobicistat",
  ],
  myocardialdepression: [
    "Doxorubicin", "Trastuzumab", "Cyclophosphamide", "Fluorouracil",
    "Cisplatin", "Mavacamten", "Verapamil", "Diltiazem",
    "Flecainide", "Disopyramide", "Propofol", "Nivolumab",
  ],
  fluidretention: [
    "Ibuprofen", "Naproxen", "Prednisone", "Methylprednisolone",
    "Fludrocortisone", "Amlodipine", "Nifedipine", "Minoxidil",
    "Pioglitazone", "Hydralazine",
  ],
  lacticacidosis: [
    "Metformin", "Linezolid", "Propofol", "Zidovudine",
    "Stavudine", "Didanosine", "Tenofovir", "Abacavir",
  ],
  nephrotoxic: [
    "Gentamicin", "Tobramycin", "Vancomycin", "Amphotericin B",
    "Tacrolimus", "Cyclosporine", "Ibuprofen", "Ketorolac",
    "Lisinopril", "Furosemide",
  ],
  hyperkalemia: [
    "Spironolactone", "Eplerenone", "Amiloride", "Lisinopril",
    "Losartan", "Valsartan", "Trimethoprim", "Tacrolimus",
    "Cyclosporine", "Potassium chloride",
  ],
  hypokalemia: [
    "Furosemide", "Bumetanide", "Torsemide", "Hydrochlorothiazide",
    "Metolazone", "Insulin", "Albuterol", "Prednisone",
    "Dexamethasone", "Terbutaline",
  ],
  hypercalcemia: [
    "Calcium carbonate", "Calcitriol", "Alfacalcidol", "Cholecalciferol",
    "Hydrochlorothiazide", "Lithium", "Teriparatide", "Abaloparatide",
  ],
  hypocalcemia: [
    "Zoledronic acid", "Denosumab", "Cinacalcet", "Foscarnet",
    "Phenytoin", "Carbamazepine", "Furosemide", "Alendronate",
    "Etelcalcetide", "Pamidronate",
  ],
  hyponatremia: [
    "Hydrochlorothiazide", "Chlorthalidone", "Desmopressin", "Carbamazepine",
    "Oxcarbazepine", "Fluoxetine", "Sertraline", "Venlafaxine",
    "Cyclophosphamide", "Vincristine", "Haloperidol", "Risperidone",
  ],
  hypernatremia: [
    "Sodium bicarbonate", "Lithium", "Mannitol", "Demeclocycline",
    "Furosemide", "Fludrocortisone", "Lactulose", "Dexamethasone",
  ],
  hyperuricemia: [
    "Hydrochlorothiazide", "Furosemide", "Aspirin", "Pyrazinamide",
    "Ethambutol", "Cyclosporine", "Tacrolimus", "Niacin", "Bempedoic acid",
  ],
  hypoglycemia: [
    "Insulin", "Glimepiride", "Gliclazide", "Glipizide",
    "Glyburide", "Repaglinide", "Nateglinide", "Linezolid",
  ],
  hyperglycemia: [
    "Prednisone", "Dexamethasone", "Methylprednisolone", "Tacrolimus",
    "Cyclosporine", "Olanzapine", "Quetiapine", "Hydrochlorothiazide",
  ],
  hagma: [
    "Aspirin", "Methanol", "Ethylene glycol", "Propylene glycol",
    "Iron", "Isoniazid", "Lorazepam", "Diazepam",
  ],
  normalgapacidosis: [
    "Acetazolamide", "Topiramate", "Amphotericin", "Ifosfamide", "Tenofovir",
  ],
  bradycardia: [
    "Digoxin", "Amiodarone", "Verapamil", "Diltiazem",
    "Adenosine", "Metoprolol", "Bisoprolol", "Carvedilol",
    "Propranolol", "Flecainide", "Ivabradine", "Donepezil",
  ],
  druginducedseizure: [
    "Tramadol", "Bupropion", "Clozapine", "Isoniazid",
    "Meperidine", "Theophylline", "Lithium", "Cyclosporine",
    "Tacrolimus", "Imipenem", "Metronidazole", "Ciprofloxacin",
  ],
  cnsdepression: [
    "Morphine", "Oxycodone", "Fentanyl", "Tramadol", "Hydrocodone",
    "Methadone", "Buprenorphine",
    "Diazepam", "Lorazepam", "Alprazolam", "Clonazepam", "Midazolam",
    "Zolpidem", "Zopiclone", "Gabapentin", "Pregabalin",
  ],
  fallsrisk: [
    "Diazepam", "Lorazepam", "Alprazolam", "Zolpidem", "Zopiclone",
    "Morphine", "Oxycodone", "Tramadol", "Fentanyl",
    "Doxazosin", "Tamsulosin", "Prazosin",
    "Gabapentin", "Pregabalin",
  ],
};

export function getStackHighYieldDrugs(domain: StackDomain): string[] {
  return (STACK_HIGH_YIELD_DRUGS[domain] ?? []).slice(0, 12);
}

export function detectCumulativeStacks(drugs: Drug[]): StackWarning[] {
  const normalizedDrugs: NormalizedDrug[] = drugs.map((drug) => ({
    ...drug,
    normalizedName: normalizeDrugName(drug.name),
  }));

  const warnings = stackRules
    .map((rule) => {
      const matchedDrugs = normalizedDrugs.filter((drug) =>
        rule.matches.some((match) => drug.normalizedName.includes(match))
      );

      if (matchedDrugs.length < 2) {
        return null;
      }

      const matchedKeywords = rule.matches.filter((match) =>
        matchedDrugs.some((drug) => drug.normalizedName.includes(match))
      );

      return {
        domain: rule.domain,
        title: rule.title,
        severity: detectSeverity(rule, matchedKeywords, matchedDrugs, matchedDrugs.length),
        summary: rule.summary(matchedDrugs.map((drug) => drug.name)),
        matchedDrugs: matchedDrugs.map((drug) => ({
          rxcui: drug.rxcui,
          name: drug.name,
        })),
        sources: [STACK_RULE_SOURCE],
      } satisfies StackWarning;
    })
    .filter((warning): warning is StackWarning => warning !== null);

  warnings.sort((left, right) => {
    const severityOrder: Record<InteractionSeverity, number> = {
      Contraindicated: 0,
      Major: 1,
      Moderate: 2,
      Minor: 3,
    };

    const severityDiff = severityOrder[left.severity] - severityOrder[right.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }

    return left.title.localeCompare(right.title);
  });

  return warnings;
}
