import type {
  InteractionCheckResponse,
  InteractionPair,
  InteractionSeverity,
  InteractionSource,
} from "@/lib/interactions";

export type PatientModifierKey =
  | "pregnancy"
  | "lactation"
  | "hepaticImpairment"
  | "age65Plus"
  | "g6pdDeficiency"
  | "renal";

export type RenalInputs = {
  enabled: boolean;
  sex: "male" | "female";
  ageYears: string;
  weightKg: string;
  serumCreatinineMgDl: string;
};

export type PatientModifiers = {
  pregnancy: boolean;
  lactation: boolean;
  hepaticImpairment: boolean;
  age65Plus: boolean;
  g6pdDeficiency: boolean;
  renal: RenalInputs;
};

export type ModifierEffect = {
  modifier: PatientModifierKey;
  title: string;
  summary: string;
  source: InteractionSource;
  adjustedSeverity?: InteractionSeverity;
};

export type ModifiedInteractionPair = InteractionPair & {
  baseSeverity: InteractionSeverity;
  displaySeverity: InteractionSeverity;
  modifierEffects: ModifierEffect[];
};

export type ModifiedInteractionResult = Omit<InteractionCheckResponse, "pairs"> & {
  pairs: ModifiedInteractionPair[];
  modifierSummary: string[];
};

type ModifierRule = {
  modifier: Exclude<PatientModifierKey, "renal">;
  title: string;
  matches: string[];
  adjustedSeverity?: InteractionSeverity;
  summary: string;
};

type RenalRule = {
  title: string;
  matches: string[];
  threshold: "lt30" | "30to59";
  adjustedSeverity?: InteractionSeverity;
  summary: string;
};

const MODIFIER_RULE_SOURCE: InteractionSource = {
  name: "Patient modifier rules",
  version: "2026-04",
};

const severityRank: Record<InteractionSeverity, number> = {
  Contraindicated: 0,
  Major: 1,
  Moderate: 2,
  Minor: 3,
};

const defaultPatientModifiers: PatientModifiers = {
  pregnancy: false,
  lactation: false,
  hepaticImpairment: false,
  age65Plus: false,
  g6pdDeficiency: false,
  renal: {
    enabled: false,
    sex: "male",
    ageYears: "",
    weightKg: "",
    serumCreatinineMgDl: "",
  },
};

const modifierLabels: Record<PatientModifierKey, string> = {
  pregnancy: "Pregnancy",
  lactation: "Lactation",
  hepaticImpairment: "Hepatic impairment",
  age65Plus: "Age ≥ 65",
  g6pdDeficiency: "G6PD deficiency",
  renal: "Reduced renal function",
};

const modifierRules: ModifierRule[] = [
  {
    modifier: "pregnancy",
    title: "Pregnancy",
    matches: ["warfarin", "methotrexate", "isotretinoin", "valproic acid", "valproate"],
    adjustedSeverity: "Contraindicated",
    summary:
      "Pregnancy modifier raises concern because one drug in this pair is on the local avoid-in-pregnancy list.",
  },
  {
    modifier: "pregnancy",
    title: "Pregnancy",
    matches: ["lisinopril", "enalapril", "losartan", "valsartan", "irbesartan"],
    adjustedSeverity: "Major",
    summary:
      "Pregnancy modifier raises urgency because one drug in this pair is on the local pregnancy caution list.",
  },
  {
    modifier: "lactation",
    title: "Lactation",
    matches: ["methotrexate", "isotretinoin", "amiodarone"],
    adjustedSeverity: "Contraindicated",
    summary:
      "Lactation modifier raises concern because one drug in this pair is on the local avoid-in-lactation list.",
  },
  {
    modifier: "hepaticImpairment",
    title: "Hepatic impairment",
    matches: ["acetaminophen", "amiodarone", "methotrexate", "valproic acid", "valproate"],
    adjustedSeverity: "Major",
    summary:
      "Hepatic impairment modifier raises urgency because one drug in this pair is on the local liver-risk watchlist.",
  },
  {
    modifier: "age65Plus",
    title: "Age ≥ 65",
    matches: ["amitriptyline", "clonazepam", "diazepam", "lorazepam", "diphenhydramine", "zolpidem"],
    adjustedSeverity: "Major",
    summary:
      "Age ≥ 65 modifier raises urgency because one drug in this pair is on the local older-adult caution list.",
  },
  {
    modifier: "g6pdDeficiency",
    title: "G6PD deficiency",
    matches: ["nitrofurantoin", "dapsone", "primaquine", "rasburicase", "sulfamethoxazole"],
    adjustedSeverity: "Contraindicated",
    summary:
      "G6PD modifier raises concern because one drug in this pair is on the local oxidant-drug watchlist.",
  },
];

const renalRules: RenalRule[] = [
  {
    title: "Renal function < 30 mL/min",
    matches: ["metformin", "gabapentin", "pregabalin", "nitrofurantoin", "rivaroxaban", "dabigatran"],
    threshold: "lt30",
    adjustedSeverity: "Major",
    summary:
      "Cockcroft–Gault estimate below 30 mL/min raises urgency because one drug in this pair is on the local renal-dose watchlist.",
  },
  {
    title: "Renal function < 30 mL/min",
    matches: ["ibuprofen", "ketorolac", "naproxen", "celecoxib", "diclofenac"],
    threshold: "lt30",
    adjustedSeverity: "Major",
    summary:
      "Cockcroft–Gault estimate below 30 mL/min raises concern because one drug in this pair is on the local NSAID renal-risk watchlist.",
  },
  {
    title: "Renal function 30–59 mL/min",
    matches: ["ibuprofen", "ketorolac", "naproxen", "celecoxib", "diclofenac"],
    threshold: "30to59",
    adjustedSeverity: "Moderate",
    summary:
      "Cockcroft–Gault estimate 30–59 mL/min adds renal caution because one drug in this pair is on the local NSAID renal-risk watchlist.",
  },
];

export function createDefaultPatientModifiers(): PatientModifiers {
  return {
    ...defaultPatientModifiers,
    renal: { ...defaultPatientModifiers.renal },
  };
}

function normalizeDrugName(name: string) {
  return name.toLowerCase().replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

function pairMatches(pair: InteractionPair, matches: string[]) {
  const combined = `${normalizeDrugName(pair.a.name)} | ${normalizeDrugName(pair.b.name)}`;
  return matches.some((match) => combined.includes(match));
}

function chooseHigherSeverity(
  current: InteractionSeverity,
  candidate?: InteractionSeverity
) {
  if (!candidate) {
    return current;
  }
  return severityRank[candidate] < severityRank[current] ? candidate : current;
}

export function calculateCockcroftGault(renal: RenalInputs) {
  const ageYears = Number(renal.ageYears);
  const weightKg = Number(renal.weightKg);
  const serumCreatinineMgDl = Number(renal.serumCreatinineMgDl);

  if (
    !renal.enabled ||
    !Number.isFinite(ageYears) ||
    !Number.isFinite(weightKg) ||
    !Number.isFinite(serumCreatinineMgDl) ||
    ageYears <= 0 ||
    weightKg <= 0 ||
    serumCreatinineMgDl <= 0
  ) {
    return { value: null, band: null as "lt30" | "30to59" | "60plus" | null };
  }

  const base = ((140 - ageYears) * weightKg) / (72 * serumCreatinineMgDl);
  const value = renal.sex === "female" ? base * 0.85 : base;

  if (value < 30) {
    return { value, band: "lt30" as const };
  }
  if (value < 60) {
    return { value, band: "30to59" as const };
  }
  return { value, band: "60plus" as const };
}

function applyFlagModifierRules(
  pair: InteractionPair,
  modifiers: PatientModifiers
): ModifierEffect[] {
  const effects: ModifierEffect[] = [];

  for (const rule of modifierRules) {
    if (!modifiers[rule.modifier]) {
      continue;
    }
    if (!pairMatches(pair, rule.matches)) {
      continue;
    }

    effects.push({
      modifier: rule.modifier,
      title: rule.title,
      summary: rule.summary,
      adjustedSeverity: rule.adjustedSeverity,
      source: MODIFIER_RULE_SOURCE,
    });
  }

  return effects;
}

function applyRenalRules(
  pair: InteractionPair,
  modifiers: PatientModifiers
): ModifierEffect[] {
  const effects: ModifierEffect[] = [];
  const renalEstimate = calculateCockcroftGault(modifiers.renal);
  if (!modifiers.renal.enabled || !renalEstimate.band || renalEstimate.band === "60plus") {
    return effects;
  }

  for (const rule of renalRules) {
    if (rule.threshold !== renalEstimate.band) {
      continue;
    }
    if (!pairMatches(pair, rule.matches)) {
      continue;
    }

    effects.push({
      modifier: "renal",
      title: rule.title,
      summary: rule.summary,
      adjustedSeverity: rule.adjustedSeverity,
      source: MODIFIER_RULE_SOURCE,
    });
  }

  return effects;
}

function summarizeActiveModifiers(modifiers: PatientModifiers) {
  const active: string[] = [];

  (Object.keys(modifierLabels) as PatientModifierKey[]).forEach((key) => {
    if (key === "renal") {
      const renalEstimate = calculateCockcroftGault(modifiers.renal);
      if (modifiers.renal.enabled && renalEstimate.value !== null) {
        active.push(
          `${modifierLabels.renal} (Cockcroft–Gault ${renalEstimate.value.toFixed(0)} mL/min)`
        );
      }
      return;
    }

    if (modifiers[key]) {
      active.push(modifierLabels[key]);
    }
  });

  return active;
}

export function applyPatientModifiers(
  result: InteractionCheckResponse,
  modifiers: PatientModifiers
): ModifiedInteractionResult {
  const pairs = result.pairs.map((pair) => {
    const effects = [
      ...applyFlagModifierRules(pair, modifiers),
      ...applyRenalRules(pair, modifiers),
    ];

    const displaySeverity = effects.reduce(
      (current, effect) => chooseHigherSeverity(current, effect.adjustedSeverity),
      pair.severity
    );

    return {
      ...pair,
      baseSeverity: pair.severity,
      displaySeverity,
      modifierEffects: effects,
    };
  });

  pairs.sort((left, right) => {
    const severityDiff =
      severityRank[left.displaySeverity] - severityRank[right.displaySeverity];
    if (severityDiff !== 0) {
      return severityDiff;
    }

    if (left.modifierEffects.length !== right.modifierEffects.length) {
      return right.modifierEffects.length - left.modifierEffects.length;
    }

    const pairALabel = `${left.a.name}|${left.b.name}`;
    const pairBLabel = `${right.a.name}|${right.b.name}`;
    return pairALabel.localeCompare(pairBLabel);
  });

  return {
    ...result,
    pairs,
    modifierSummary: summarizeActiveModifiers(modifiers),
  };
}
