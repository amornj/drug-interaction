function normalizeDrugName(name: string) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const gastricAcidDependentDrugs = new Set([
  "ketoconazole",
  "itraconazole",
  "posaconazole",
  "erlotinib",
  "gefitinib",
  "dasatinib",
  "nilotinib",
  "pazopanib",
  "atazanavir",
  "rilpivirine",
]);

export const chelationSusceptibleDrugs = new Set([
  "dolutegravir",
  "bictegravir",
  "elvitegravir",
  "raltegravir",
  "atazanavir",
  "rilpivirine",
  "ledipasvir",
  "sofosbuvir",
  "velpatasvir",
  "voxilaprevir",
  // Fluoroquinolones — all chelate polyvalent cations
  "ciprofloxacin",
  "levofloxacin",
  "moxifloxacin",
  "norfloxacin",
  "ofloxacin",
  "gemifloxacin",
  "delafloxacin",
  "gatifloxacin",
  "sparfloxacin",
  "lomefloxacin",
  "grepafloxacin",
  "trovafloxacin",
  "prulifloxacin",
]);

export const acidReductionDrugs = new Set([
  "omeprazole",
  "esomeprazole",
  "pantoprazole",
  "rabeprazole",
  "lansoprazole",
  "dexlansoprazole",
  "famotidine",
  "cimetidine",
  "nizatidine",
  "vonoprazan",
  "aluminum hydroxide",
  "magnesium hydroxide",
  "calcium carbonate",
  "sodium bicarbonate",
]);

export const chelatingAgents = new Set([
  "aluminum hydroxide",
  "aluminum carbonate",
  "aluminum phosphate",
  "magnesium hydroxide",
  "magnesium carbonate",
  "magnesium chloride",
  "magnesium citrate",
  "magnesium gluconate",
  "magnesium oxide",
  "magnesium sulfate",
  "magnesium trisilicate",
  "magaldrate",
  "calcium carbonate",
  "calcium acetate",
  "calcium citrate",
  "calcium gluconate",
  "calcium lactate",
  "calcium phosphate",
  "ferrous sulfate",
  "ferrous fumarate",
  "ferrous gluconate",
  "iron",
  "iron polysaccharide",
  "sucralfate",
  "kaolin",
  "attapulgite",
  "bismuth subsalicylate",
  "zinc",
  "zinc sulfate",
  "zinc acetate",
  "zinc gluconate",
]);

export function isGastricAcidDependent(name: string): boolean {
  return gastricAcidDependentDrugs.has(normalizeDrugName(name));
}

export function isChelationSusceptible(name: string): boolean {
  return chelationSusceptibleDrugs.has(normalizeDrugName(name));
}

export function getOtherAcidDependentDrugs(excludeName: string): string[] {
  const exclude = normalizeDrugName(excludeName);
  return Array.from(gastricAcidDependentDrugs)
    .filter((d) => d !== exclude)
    .sort();
}

export function getOtherChelationSusceptibleDrugs(excludeName: string): string[] {
  const exclude = normalizeDrugName(excludeName);
  return Array.from(chelationSusceptibleDrugs)
    .filter((d) => d !== exclude)
    .sort();
}

export function getAcidReducers(): string[] {
  return Array.from(acidReductionDrugs).sort();
}

export function getChelatingAgents(): string[] {
  return Array.from(chelatingAgents).sort();
}
