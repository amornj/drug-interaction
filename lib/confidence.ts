import { getDrugMetabolismTags } from "@/lib/cyp";
import { getStackDomainsForDrug } from "@/lib/stacks";
import type {
  InteractionConfidence,
  PkMechanism,
} from "@/lib/interaction-types";

export type ConfidenceClassification = {
  confidence: InteractionConfidence;
  pkMechanisms: PkMechanism[];
};

const PK_SYSTEMS = new Set([
  "CYP3A4",
  "CYP2D6",
  "CYP2C9",
  "CYP2C19",
  "CYP2C8",
  "CYP2B6",
  "CYP1A2",
  "CYP2E1",
  "CYP2A6",
  "P-gp",
  "OAT",
  "OCT",
  "MATE",
  "BCRP",
  "UGT",
  "UGT1A1",
  "Xanthine oxidase",
]);

const clinicallyMeaningfulCosubstrateSystems = new Set(["CYP3A4", "P-gp"]);
const cosubstrateSignalDrugs = new Set([
  "amiodarone",
  "apixaban",
  "atorvastatin",
  "carbamazepine",
  "colchicine",
  "cyclosporine",
  "dabigatran",
  "digoxin",
  "edoxaban",
  "lovastatin",
  "phenytoin",
  "rivaroxaban",
  "simvastatin",
  "sirolimus",
  "tacrolimus",
  "theophylline",
  "warfarin",
]);

function normalizeDrugName(name: string) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasCosubstrateSignal(nameA: string, nameB: string) {
  const normalizedA = normalizeDrugName(nameA);
  const normalizedB = normalizeDrugName(nameB);

  return [...cosubstrateSignalDrugs].some((drug) => normalizedA.includes(drug))
    && [...cosubstrateSignalDrugs].some((drug) => normalizedB.includes(drug));
}

function uniqueSystemsFor(
  name: string,
  predicate: (label: string) => boolean
): string[] {
  return [
    ...new Set(getDrugMetabolismTags(name)
    .filter((tag) => PK_SYSTEMS.has(tag.system) && predicate(tag.label))
      .map((tag) => tag.system)),
  ];
}

export function classifyConfidence(
  nameA: string,
  nameB: string
): InteractionConfidence {
  return classifyInteractionConfidence(nameA, nameB).confidence;
}

export function classifyInteractionConfidence(
  nameA: string,
  nameB: string
): ConfidenceClassification {
  const inhibSystemsA = uniqueSystemsFor(nameA, (label) => label.includes("Inh"));
  const inhibSystemsB = uniqueSystemsFor(nameB, (label) => label.includes("Inh"));
  const inducSystemsA = uniqueSystemsFor(
    nameA,
    (label) => label.includes("Ind") && !label.includes("Weak Ind")
  );
  const inducSystemsB = uniqueSystemsFor(
    nameB,
    (label) => label.includes("Ind") && !label.includes("Weak Ind")
  );
  const subSystemsA = uniqueSystemsFor(nameA, (label) => label.includes("Sub"));
  const subSystemsB = uniqueSystemsFor(nameB, (label) => label.includes("Sub"));
  const pkMechanisms: PkMechanism[] = [];

  for (const system of inhibSystemsA) {
    if (subSystemsB.includes(system)) {
      pkMechanisms.push({ kind: "sub_inh", system });
    }
  }
  for (const system of inhibSystemsB) {
    if (subSystemsA.includes(system)) {
      pkMechanisms.push({ kind: "sub_inh", system });
    }
  }
  for (const system of inducSystemsA) {
    if (subSystemsB.includes(system)) {
      pkMechanisms.push({ kind: "sub_ind", system });
    }
  }
  for (const system of inducSystemsB) {
    if (subSystemsA.includes(system)) {
      pkMechanisms.push({ kind: "sub_ind", system });
    }
  }
  if (pkMechanisms.length > 0) {
    return {
      confidence: "pk_confirmed",
      pkMechanisms,
    };
  }

  const sharedSubstrateSystems = subSystemsA.filter((system) =>
    subSystemsB.includes(system)
  );
  if (
    sharedSubstrateSystems.some((system) =>
      clinicallyMeaningfulCosubstrateSystems.has(system)
    ) &&
    hasCosubstrateSignal(nameA, nameB)
  ) {
    return {
      confidence: "pk_plausible",
      pkMechanisms: sharedSubstrateSystems.map((system) => ({
        kind: "co_sub",
        system,
      })),
    };
  }

  const stacksA = getStackDomainsForDrug(nameA);
  const stacksB = getStackDomainsForDrug(nameB);
  if (stacksA.some((domain) => stacksB.includes(domain))) {
    return {
      confidence: "pd_plausible",
      pkMechanisms: [],
    };
  }

  return {
    confidence: "unverified",
    pkMechanisms: [],
  };
}
