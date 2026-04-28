import { getDrugMetabolismTags } from "@/lib/cyp";
import { getStackDomainsForDrug } from "@/lib/stacks";

export type InteractionConfidence =
  | "pk_confirmed"
  | "pk_plausible"
  | "pd_plausible"
  | "unverified";

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

export function confidenceLabel(confidence: InteractionConfidence) {
  switch (confidence) {
    case "pk_confirmed":
      return "PK";
    case "pk_plausible":
      return "Co-sub";
    case "pd_plausible":
      return "PD";
    case "unverified":
      return "?";
  }
}

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

function systemsFor(
  name: string,
  predicate: (label: string) => boolean
): string[] {
  return getDrugMetabolismTags(name)
    .filter((tag) => PK_SYSTEMS.has(tag.system) && predicate(tag.label))
    .map((tag) => tag.system);
}

export function classifyConfidence(
  nameA: string,
  nameB: string
): InteractionConfidence {
  const inhibSystemsA = systemsFor(nameA, (label) => label.includes("Inh"));
  const inhibSystemsB = systemsFor(nameB, (label) => label.includes("Inh"));
  const subSystemsA = systemsFor(nameA, (label) => label.includes("Sub"));
  const subSystemsB = systemsFor(nameB, (label) => label.includes("Sub"));

  if (inhibSystemsA.some((system) => subSystemsB.includes(system))) {
    return "pk_confirmed";
  }

  if (inhibSystemsB.some((system) => subSystemsA.includes(system))) {
    return "pk_confirmed";
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
    return "pk_plausible";
  }

  const stacksA = getStackDomainsForDrug(nameA);
  const stacksB = getStackDomainsForDrug(nameB);
  if (stacksA.some((domain) => stacksB.includes(domain))) {
    return "pd_plausible";
  }

  return "unverified";
}
