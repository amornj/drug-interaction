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
    title: "Reduced renal function",
    matches: ["metformin", "gabapentin", "pregabalin", "nitrofurantoin", "rivaroxaban", "dabigatran"],
    adjustedSeverity: "Major",
    summary:
      "Renal modifier raises urgency because one drug in this pair is on the local renal-dose watchlist.",
  },
  {
    title: "Reduced renal function",
    matches: ["ibuprofen", "ketorolac", "naproxen", "celecoxib", "diclofenac"],
    adjustedSeverity: "Major",
    summary:
      "Renal modifier raises concern because one drug in this pair is on the local NSAID renal-risk watchlist.",
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
  if (!modifiers.renal.enabled) {
    return effects;
  }

  for (const rule of renalRules) {
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
      if (modifiers.renal.enabled) {
        active.push(modifierLabels.renal);
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
