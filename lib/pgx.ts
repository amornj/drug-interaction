import type { InteractionSeverity, InteractionSource } from "@/lib/interaction-types";

export type PgxGene =
  | "cyp2c9"
  | "cyp2c19"
  | "cyp2d6"
  | "cyp3a5"
  | "ugt1a1"
  | "slco1b1"
  | "vkorc1"
  | "hla_b1502"
  | "hla_b5701"
  | "hla_b5801"
  | "dpyd"
  | "tpmt"
  | "nudt15";

export type PgxProfile = Record<PgxGene, string>;

export type PgxDrugRef = {
  rxcui: string;
  name: string;
};

export type PgxAlert = {
  gene: PgxGene;
  geneLabel: string;
  title: string;
  severity: InteractionSeverity;
  summary: string;
  matchedDrugs: PgxDrugRef[];
  phenotypeValue: string;
  phenotypeLabel: string;
  sources: InteractionSource[];
};

type PgxRule = {
  gene: PgxGene;
  title: string;
  matches: string[];
  defaultSeverity: InteractionSeverity;
  testRecommendation: string;
  phenotypeRecommendations: Record<
    string,
    { severity: InteractionSeverity; summary: string }
  >;
};

type PgxGeneConfig = {
  label: string;
  options: Array<{ value: string; label: string }>;
};

const PGX_RULE_SOURCE: InteractionSource = {
  name: "CPIC local rules",
  version: "2026-04",
};

const severityRank: Record<InteractionSeverity, number> = {
  Contraindicated: 0,
  Major: 1,
  Moderate: 2,
  Minor: 3,
};

export const pgxGeneConfigs: Record<PgxGene, PgxGeneConfig> = {
  cyp2c9: {
    label: "CYP2C9",
    options: [
      { value: "", label: "Unknown / not tested" },
      { value: "poor", label: "Poor metabolizer" },
      { value: "intermediate", label: "Intermediate metabolizer" },
      { value: "normal", label: "Normal metabolizer" },
    ],
  },
  cyp2c19: {
    label: "CYP2C19",
    options: [
      { value: "", label: "Unknown / not tested" },
      { value: "poor", label: "Poor metabolizer" },
      { value: "intermediate", label: "Intermediate metabolizer" },
      { value: "normal", label: "Normal metabolizer" },
      { value: "rapid", label: "Rapid metabolizer" },
      { value: "ultrarapid", label: "Ultrarapid metabolizer" },
    ],
  },
  cyp2d6: {
    label: "CYP2D6",
    options: [
      { value: "", label: "Unknown / not tested" },
      { value: "poor", label: "Poor metabolizer" },
      { value: "intermediate", label: "Intermediate metabolizer" },
      { value: "normal", label: "Normal metabolizer" },
      { value: "ultrarapid", label: "Ultrarapid metabolizer" },
    ],
  },
  cyp3a5: {
    label: "CYP3A5",
    options: [
      { value: "", label: "Unknown / not tested" },
      { value: "nonexpresser", label: "Non-expresser (*3/*3)" },
      { value: "intermediate", label: "Intermediate expresser (*1/*3)" },
      { value: "expresser", label: "Expresser (*1/*1)" },
    ],
  },
  ugt1a1: {
    label: "UGT1A1",
    options: [
      { value: "", label: "Unknown / not tested" },
      { value: "normal", label: "Normal metabolizer (*1/*1)" },
      { value: "intermediate", label: "Intermediate metabolizer (*1/*28)" },
      { value: "poor", label: "Poor metabolizer (*28/*28)" },
    ],
  },
  slco1b1: {
    label: "SLCO1B1",
    options: [
      { value: "", label: "Unknown / not tested" },
      { value: "normal", label: "Normal function" },
      { value: "decreased", label: "Decreased function" },
      { value: "poor", label: "Poor function" },
    ],
  },
  vkorc1: {
    label: "VKORC1",
    options: [
      { value: "", label: "Unknown / not tested" },
      { value: "sensitive", label: "Sensitive / lower dose needed" },
      { value: "normal", label: "Normal sensitivity" },
      { value: "resistant", label: "Resistant / higher dose needed" },
    ],
  },
  hla_b1502: {
    label: "HLA-B*15:02",
    options: [
      { value: "", label: "Unknown / not tested" },
      { value: "negative", label: "Negative" },
      { value: "positive", label: "Positive" },
    ],
  },
  hla_b5701: {
    label: "HLA-B*57:01",
    options: [
      { value: "", label: "Unknown / not tested" },
      { value: "negative", label: "Negative" },
      { value: "positive", label: "Positive" },
    ],
  },
  hla_b5801: {
    label: "HLA-B*58:01",
    options: [
      { value: "", label: "Unknown / not tested" },
      { value: "negative", label: "Negative" },
      { value: "positive", label: "Positive" },
    ],
  },
  dpyd: {
    label: "DPYD",
    options: [
      { value: "", label: "Unknown / not tested" },
      { value: "normal", label: "Normal metabolizer" },
      { value: "intermediate", label: "Intermediate metabolizer" },
      { value: "poor", label: "Poor metabolizer" },
    ],
  },
  tpmt: {
    label: "TPMT",
    options: [
      { value: "", label: "Unknown / not tested" },
      { value: "normal", label: "Normal metabolizer" },
      { value: "intermediate", label: "Intermediate metabolizer" },
      { value: "poor", label: "Poor metabolizer" },
    ],
  },
  nudt15: {
    label: "NUDT15",
    options: [
      { value: "", label: "Unknown / not tested" },
      { value: "normal", label: "Normal metabolizer" },
      { value: "intermediate", label: "Intermediate metabolizer" },
      { value: "poor", label: "Poor metabolizer" },
    ],
  },
};

const pgxRules: PgxRule[] = [
  {
    gene: "cyp2c9",
    title: "Warfarin clearance and bleeding risk",
    matches: ["warfarin"],
    defaultSeverity: "Major",
    testRecommendation:
      "Consider CYP2C9-guided warfarin dosing because reduced clearance can increase exposure and bleeding risk.",
    phenotypeRecommendations: {
      poor: {
        severity: "Contraindicated",
        summary:
          "CYP2C9 poor metabolizer status can markedly reduce warfarin clearance and increase bleeding risk. Start low only if unavoidable and recheck whether a different anticoagulant strategy is safer.",
      },
      intermediate: {
        severity: "Major",
        summary:
          "CYP2C9 intermediate metabolizer status can slow warfarin clearance and raise bleeding risk. Lower initial dosing and closer INR follow-up are warranted in the local PGx rule set.",
      },
      normal: {
        severity: "Minor",
        summary:
          "CYP2C9 normal metabolizer status supports expected warfarin clearance in the local PGx rule set.",
      },
    },
  },
  {
    gene: "cyp2c19",
    title: "Clopidogrel activation",
    matches: ["clopidogrel"],
    defaultSeverity: "Moderate",
    testRecommendation:
      "Consider CYP2C19-guided antiplatelet selection before relying on clopidogrel response.",
    phenotypeRecommendations: {
      poor:
        {
          severity: "Major",
          summary:
            "CYP2C19 poor metabolizer status predicts reduced clopidogrel activation. Consider an alternative antiplatelet strategy.",
        },
      intermediate: {
        severity: "Major",
        summary:
          "CYP2C19 intermediate metabolizer status can reduce clopidogrel activation. Recheck whether an alternative antiplatelet is preferred.",
      },
      normal: {
        severity: "Minor",
        summary:
          "CYP2C19 normal metabolizer status supports expected clopidogrel activation in the local PGx rule set.",
      },
      rapid: {
        severity: "Minor",
        summary:
          "CYP2C19 rapid metabolizer status does not add a local PGx restriction for clopidogrel in this panel.",
      },
      ultrarapid: {
        severity: "Minor",
        summary:
          "CYP2C19 ultrarapid metabolizer status does not add a local PGx restriction for clopidogrel in this panel.",
      },
    },
  },
  {
    gene: "cyp2d6",
    title: "Opioid bioactivation",
    matches: ["codeine", "tramadol"],
    defaultSeverity: "Moderate",
    testRecommendation:
      "Consider CYP2D6 status before using codeine or tramadol when analgesic reliability or toxicity risk matters.",
    phenotypeRecommendations: {
      poor: {
        severity: "Major",
        summary:
          "CYP2D6 poor metabolizer status can reduce activation of codeine or tramadol and make analgesic response unreliable.",
      },
      intermediate: {
        severity: "Moderate",
        summary:
          "CYP2D6 intermediate metabolizer status may reduce activation of codeine or tramadol and weaken analgesic response.",
      },
      normal: {
        severity: "Minor",
        summary:
          "CYP2D6 normal metabolizer status does not add a local PGx restriction for codeine or tramadol in this panel.",
      },
      ultrarapid: {
        severity: "Contraindicated",
        summary:
          "CYP2D6 ultrarapid metabolizer status can increase active opioid exposure from codeine or tramadol. Avoid these prodrugs in the local PGx rule set.",
      },
    },
  },
  {
    gene: "cyp3a5",
    title: "Tacrolimus dose requirement",
    matches: ["tacrolimus"],
    defaultSeverity: "Moderate",
    testRecommendation:
      "Consider CYP3A5 genotyping before tacrolimus initiation — expressers need substantially higher doses to reach target trough concentrations.",
    phenotypeRecommendations: {
      expresser: {
        severity: "Major",
        summary:
          "CYP3A5 expresser status (*1 carrier) predicts high tacrolimus clearance. Standard starting doses typically produce subtherapeutic troughs — expect 1.5–2× higher dose requirements and titrate with frequent TDM.",
      },
      intermediate: {
        severity: "Moderate",
        summary:
          "CYP3A5 intermediate expresser status (*1/*3) predicts modestly increased tacrolimus clearance. Recheck trough early and be prepared to titrate upward from standard starting doses.",
      },
      nonexpresser: {
        severity: "Minor",
        summary:
          "CYP3A5 non-expresser status (*3/*3) predicts standard tacrolimus clearance. Standard starting doses are appropriate; routine TDM applies.",
      },
    },
  },
  {
    gene: "ugt1a1",
    title: "Irinotecan toxicity risk",
    matches: ["irinotecan"],
    defaultSeverity: "Major",
    testRecommendation:
      "Consider UGT1A1 genotyping before irinotecan — poor metabolizers have markedly reduced SN-38 glucuronidation and are at high risk of severe neutropenia and diarrhoea.",
    phenotypeRecommendations: {
      normal: {
        severity: "Minor",
        summary:
          "UGT1A1 normal metabolizer status does not add a local PGx restriction for irinotecan dose in this panel.",
      },
      intermediate: {
        severity: "Moderate",
        summary:
          "UGT1A1 intermediate metabolizer status (*1/*28) raises local concern for irinotecan toxicity. Recheck starting dose strategy and monitor closely for neutropenia and diarrhoea.",
      },
      poor: {
        severity: "Contraindicated",
        summary:
          "UGT1A1 poor metabolizer status (*28/*28) triggers a local avoid signal for standard irinotecan doses because of high SN-38 accumulation and severe toxicity risk. Dose reduction or alternative regimen is warranted.",
      },
    },
  },
  {
    gene: "slco1b1",
    title: "Simvastatin myopathy risk",
    matches: ["simvastatin"],
    defaultSeverity: "Moderate",
    testRecommendation:
      "Consider SLCO1B1 status before using simvastatin when myopathy risk is a concern.",
    phenotypeRecommendations: {
      normal: {
        severity: "Minor",
        summary:
          "SLCO1B1 normal function does not add a local PGx restriction for simvastatin in this panel.",
      },
      decreased: {
        severity: "Moderate",
        summary:
          "SLCO1B1 decreased function increases local concern for simvastatin-associated myopathy. Recheck dose or statin choice.",
      },
      poor: {
        severity: "Major",
        summary:
          "SLCO1B1 poor function materially increases local concern for simvastatin-associated myopathy. Consider an alternative statin strategy.",
      },
    },
  },
  {
    gene: "vkorc1",
    title: "Warfarin sensitivity and dose requirement",
    matches: ["warfarin"],
    defaultSeverity: "Moderate",
    testRecommendation:
      "Consider VKORC1-guided warfarin dosing because genetic sensitivity can materially change dose requirement.",
    phenotypeRecommendations: {
      sensitive: {
        severity: "Major",
        summary:
          "VKORC1-sensitive status predicts lower warfarin dose requirement. Starting too high can increase overshoot and bleeding risk in the local PGx rule set.",
      },
      normal: {
        severity: "Minor",
        summary:
          "VKORC1 normal sensitivity does not add a local PGx restriction for warfarin dose requirement.",
      },
      resistant: {
        severity: "Moderate",
        summary:
          "VKORC1-resistant status predicts a higher warfarin dose requirement. Recheck whether standard starting doses are likely to underdose before titration.",
      },
    },
  },
  {
    gene: "hla_b1502",
    title: "Carbamazepine severe cutaneous reaction risk",
    matches: ["carbamazepine"],
    defaultSeverity: "Major",
    testRecommendation:
      "Check HLA-B*15:02 before starting carbamazepine when ancestry-based risk is relevant.",
    phenotypeRecommendations: {
      negative: {
        severity: "Minor",
        summary:
          "Negative HLA-B*15:02 status removes this specific local PGx avoid signal for carbamazepine.",
      },
      positive: {
        severity: "Contraindicated",
        summary:
          "Positive HLA-B*15:02 status triggers a local avoid signal for carbamazepine because of severe cutaneous reaction risk.",
      },
    },
  },
  {
    gene: "hla_b5701",
    title: "Abacavir hypersensitivity risk",
    matches: ["abacavir"],
    defaultSeverity: "Major",
    testRecommendation:
      "Check HLA-B*57:01 before starting abacavir.",
    phenotypeRecommendations: {
      negative: {
        severity: "Minor",
        summary:
          "Negative HLA-B*57:01 status removes this specific local PGx avoid signal for abacavir.",
      },
      positive: {
        severity: "Contraindicated",
        summary:
          "Positive HLA-B*57:01 status triggers a local avoid signal for abacavir because of hypersensitivity risk.",
      },
    },
  },
  {
    gene: "hla_b5801",
    title: "Allopurinol severe cutaneous reaction risk",
    matches: ["allopurinol"],
    defaultSeverity: "Major",
    testRecommendation:
      "Check HLA-B*58:01 before starting allopurinol when ancestry-based risk is relevant.",
    phenotypeRecommendations: {
      negative: {
        severity: "Minor",
        summary:
          "Negative HLA-B*58:01 status removes this specific local PGx avoid signal for allopurinol.",
      },
      positive: {
        severity: "Contraindicated",
        summary:
          "Positive HLA-B*58:01 status triggers a local avoid signal for allopurinol because of severe cutaneous reaction risk.",
      },
    },
  },
  {
    gene: "dpyd",
    title: "Fluoropyrimidine toxicity risk",
    matches: ["capecitabine", "fluorouracil", "5-fluorouracil"],
    defaultSeverity: "Major",
    testRecommendation:
      "Consider DPYD status before using fluoropyrimidines because severe toxicity risk may be genotype-sensitive.",
    phenotypeRecommendations: {
      normal: {
        severity: "Minor",
        summary:
          "DPYD normal metabolizer status does not add a local PGx restriction for fluoropyrimidines in this panel.",
      },
      intermediate: {
        severity: "Major",
        summary:
          "DPYD intermediate metabolizer status raises local concern for fluoropyrimidine toxicity. Recheck dose strategy before prescribing.",
      },
      poor: {
        severity: "Contraindicated",
        summary:
          "DPYD poor metabolizer status triggers a local avoid signal for standard fluoropyrimidine prescribing because toxicity risk is high.",
      },
    },
  },
  {
    gene: "tpmt",
    title: "Thiopurine myelotoxicity risk",
    matches: ["azathioprine", "mercaptopurine", "thioguanine"],
    defaultSeverity: "Major",
    testRecommendation:
      "Consider TPMT status before thiopurine therapy because intolerance and myelotoxicity risk may be genotype-sensitive.",
    phenotypeRecommendations: {
      normal: {
        severity: "Minor",
        summary:
          "TPMT normal metabolizer status does not add a local PGx restriction for thiopurines in this panel.",
      },
      intermediate: {
        severity: "Major",
        summary:
          "TPMT intermediate metabolizer status raises local concern for thiopurine myelotoxicity. Recheck dose strategy before prescribing.",
      },
      poor: {
        severity: "Contraindicated",
        summary:
          "TPMT poor metabolizer status triggers a local avoid signal for standard thiopurine use because of severe myelotoxicity risk.",
      },
    },
  },
  {
    gene: "nudt15",
    title: "Thiopurine myelotoxicity risk",
    matches: ["azathioprine", "mercaptopurine", "thioguanine"],
    defaultSeverity: "Major",
    testRecommendation:
      "Consider NUDT15 status before thiopurine therapy because intolerance and myelotoxicity risk may be genotype-sensitive.",
    phenotypeRecommendations: {
      normal: {
        severity: "Minor",
        summary:
          "NUDT15 normal metabolizer status does not add a local PGx restriction for thiopurines in this panel.",
      },
      intermediate: {
        severity: "Major",
        summary:
          "NUDT15 intermediate metabolizer status raises local concern for thiopurine myelotoxicity. Recheck dose strategy before prescribing.",
      },
      poor: {
        severity: "Contraindicated",
        summary:
          "NUDT15 poor metabolizer status triggers a local avoid signal for standard thiopurine use because of severe myelotoxicity risk.",
      },
    },
  },
];

export function createDefaultPgxProfile(): PgxProfile {
  return {
    cyp2c9: "",
    cyp2c19: "",
    cyp2d6: "",
    cyp3a5: "",
    ugt1a1: "",
    slco1b1: "",
    vkorc1: "",
    hla_b1502: "",
    hla_b5701: "",
    hla_b5801: "",
    dpyd: "",
    tpmt: "",
    nudt15: "",
  };
}

function normalizeDrugName(name: string) {
  return name.toLowerCase().replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

function phenotypeLabel(gene: PgxGene, value: string) {
  return (
    pgxGeneConfigs[gene].options.find((option) => option.value === value)?.label ??
    "Unknown / not tested"
  );
}

function matchedDrugsForRule(rule: PgxRule, drugs: PgxDrugRef[]) {
  return drugs.filter((drug) =>
    rule.matches.some((match) => normalizeDrugName(drug.name).includes(match))
  );
}

export function findRelevantPgxGenes(drugs: PgxDrugRef[]) {
  return pgxRules
    .filter((rule) => matchedDrugsForRule(rule, drugs).length > 0)
    .map((rule) => rule.gene)
    .filter((gene, index, genes) => genes.indexOf(gene) === index);
}

export function detectPharmacogenomicAlerts(
  drugs: PgxDrugRef[],
  profile: PgxProfile
): PgxAlert[] {
  const alerts = pgxRules
    .map((rule) => {
      const matchedDrugs = matchedDrugsForRule(rule, drugs);
      if (matchedDrugs.length === 0) {
        return null;
      }

      const phenotypeValue = profile[rule.gene];
      const phenotypeRecommendation = phenotypeValue
        ? rule.phenotypeRecommendations[phenotypeValue]
        : undefined;

      return {
        gene: rule.gene,
        geneLabel: pgxGeneConfigs[rule.gene].label,
        title: rule.title,
        severity: phenotypeRecommendation?.severity ?? rule.defaultSeverity,
        summary:
          phenotypeRecommendation?.summary ?? rule.testRecommendation,
        matchedDrugs,
        phenotypeValue,
        phenotypeLabel: phenotypeLabel(rule.gene, phenotypeValue),
        sources: [PGX_RULE_SOURCE],
      } satisfies PgxAlert;
    })
    .filter((alert): alert is PgxAlert => alert !== null);

  alerts.sort((left, right) => {
    const severityDiff = severityRank[left.severity] - severityRank[right.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }

    return left.geneLabel.localeCompare(right.geneLabel);
  });

  return alerts;
}
