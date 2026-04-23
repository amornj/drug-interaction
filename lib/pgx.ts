import type { InteractionSeverity, InteractionSource } from "@/lib/interactions";

export type PgxGene =
  | "cyp2c19"
  | "cyp2d6"
  | "slco1b1"
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
  slco1b1: {
    label: "SLCO1B1",
    options: [
      { value: "", label: "Unknown / not tested" },
      { value: "normal", label: "Normal function" },
      { value: "decreased", label: "Decreased function" },
      { value: "poor", label: "Poor function" },
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
    cyp2c19: "",
    cyp2d6: "",
    slco1b1: "",
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
