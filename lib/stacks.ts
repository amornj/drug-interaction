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
  | "normalgapacidosis";

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
      "levofloxacin",
      "ciprofloxacin",
      "haloperidol",
      "quetiapine",
      "ziprasidone",
      "citalopram",
      "escitalopram",
      "methadone",
      "ondansetron",
    ],
    highRiskMatches: ["amiodarone", "sotalol", "quinidine", "methadone", "ziprasidone"],
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
      "diphenhydramine",
      "oxybutynin",
      "promethazine",
      "chlorpheniramine",
      "scopolamine",
      "benztropine",
      "cyclobenzaprine",
      "paroxetine",
      "tolterodine",
    ],
    summary: (matched) =>
      `Anticholinergic drugs are stacking: ${matched.join(", ")}. Review for cumulative anticholinergic syndrome risk: delirium, urinary retention, ileus, tachycardia, and hyperthermia.`,
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
      "propranolol",
      "metoprolol",
      "flecainide",
      "disopyramide",
      "propofol",
      "nivolumab",
      "clozapine",
      "tenofovir",
      "zidovudine",
      "linezolid",
      "metformin",
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
        "propranolol",
        "metoprolol",
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
      const hasLacticAcidosisDriver = ["tenofovir", "zidovudine", "linezolid", "metformin", "propofol"].some(
        (keyword) => matchedKeywords.includes(keyword)
      );

      if (
        highRiskCount >= 2 ||
        (hasNegativeInotrope && hasChemoCardiotoxin) ||
        (hasNegativeInotrope && hasMyocarditisTrigger) ||
        (hasNegativeInotrope && hasLacticAcidosisDriver) ||
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
