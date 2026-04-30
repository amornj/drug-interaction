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
