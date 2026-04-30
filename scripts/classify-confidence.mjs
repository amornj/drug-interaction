import fs from 'fs';

const ddinterData = JSON.parse(fs.readFileSync('./lib/data/ddinter/index.json', 'utf8'));
const pairIndex = ddinterData.pairIndex;
const rxcuiNames = ddinterData.rxcuiNames || {};
const rxcuiMapData = JSON.parse(fs.readFileSync('./lib/data/ddinter/rxcui-map.json', 'utf8')).mappings;

const cypContent = fs.readFileSync('./lib/cyp.ts', 'utf8');
const entriesMatch = cypContent.match(/export const METABOLISM_ENTRIES: MetabolismEntry\[\] = (\[.*?\]);/s);
const METABOLISM_ENTRIES = eval(entriesMatch[1]);

const drugAnnotations = new Map();
for (const entry of METABOLISM_ENTRIES) {
  const norm = entry.match.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  drugAnnotations.set(norm, entry.annotations);
}

const stacksContent = fs.readFileSync('./lib/stacks.ts', 'utf8');
const rulesMatch = stacksContent.match(/const stackRules: StackRule\[\] = (\[.*?\]);/s);
const stackRules = eval(rulesMatch[1]);

const PK_SYSTEMS = new Set([
  "CYP3A4","CYP2D6","CYP2C9","CYP2C19","CYP2C8","CYP2B6","CYP1A2",
  "P-gp","OAT","OCT","MATE","BCRP","UGT","UGT1A1"
]);

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getAnnotations(name) {
  const norm = normalizeName(name);
  return drugAnnotations.get(norm) || [];
}

function getStackDomains(name) {
  const norm = normalizeName(name);
  const domains = new Set();
  for (const rule of stackRules) {
    for (const match of rule.matches) {
      if (norm.includes(match.toLowerCase())) {
        domains.add(rule.domain || rule.id);
      }
    }
  }
  return Array.from(domains);
}

function classifyPair(nameA, nameB) {
  const tagsA = getAnnotations(nameA);
  const tagsB = getAnnotations(nameB);

  const inhibSystemsA = tagsA.filter(t => t.role.includes("Inh") && PK_SYSTEMS.has(t.system)).map(t => t.system);
  const inhibSystemsB = tagsB.filter(t => t.role.includes("Inh") && PK_SYSTEMS.has(t.system)).map(t => t.system);
  const subSystemsA = tagsA.filter(t => t.role === "Sub" && PK_SYSTEMS.has(t.system)).map(t => t.system);
  const subSystemsB = tagsB.filter(t => t.role === "Sub" && PK_SYSTEMS.has(t.system)).map(t => t.system);

  if (inhibSystemsA.some(s => subSystemsB.includes(s))) return "pk_confirmed";
  if (inhibSystemsB.some(s => subSystemsA.includes(s))) return "pk_confirmed";

  const sharedSubs = subSystemsA.filter(s => subSystemsB.includes(s));
  if (sharedSubs.length > 0) return "pk_plausible";

  const stacksA = getStackDomains(nameA);
  const stacksB = getStackDomains(nameB);
  if (stacksA.some(d => stacksB.includes(d))) return "pd_plausible";

  return "unverified";
}

function getSharedSystems(nameA, nameB) {
  const tagsA = getAnnotations(nameA);
  const tagsB = getAnnotations(nameB);
  const subSystemsA = tagsA.filter(t => t.role === "Sub" && PK_SYSTEMS.has(t.system)).map(t => t.system);
  const subSystemsB = tagsB.filter(t => t.role === "Sub" && PK_SYSTEMS.has(t.system)).map(t => t.system);
  return subSystemsA.filter(s => subSystemsB.includes(s));
}

const results = {
  pk_confirmed: [],
  pk_plausible: [],
  pd_plausible: [],
  unverified: [],
};

for (const [key, severityCode] of Object.entries(pairIndex)) {
  const [rxcuiA, rxcuiB] = key.split('|');
  const nameA = rxcuiNames[rxcuiA] || rxcuiMapData[Object.keys(rxcuiMapData).find(k => rxcuiMapData[k].rxcui === rxcuiA)]?.query || rxcuiA;
  const nameB = rxcuiNames[rxcuiB] || rxcuiMapData[Object.keys(rxcuiMapData).find(k => rxcuiMapData[k].rxcui === rxcuiB)]?.query || rxcuiB;

  const confidence = classifyPair(nameA, nameB);
  const severity = severityCode === 4 ? "Contraindicated" : severityCode === 3 ? "Major" : severityCode === 2 ? "Moderate" : "Minor";

  results[confidence].push({
    pair: `${nameA} + ${nameB}`,
    severity,
    severityCode,
    key,
  });
}

console.log(`Total DDInter pairs: ${Object.keys(pairIndex).length}`);
console.log(`\n=== Classification breakdown ===`);
console.log(`pk_confirmed:   ${results.pk_confirmed.length} (direct inhibitor→substrate)`);
console.log(`pk_plausible:   ${results.pk_plausible.length} (co-substrate competition)`);
console.log(`pd_plausible:   ${results.pd_plausible.length} (shared stack domain)`);
console.log(`unverified:     ${results.unverified.length} (no local mechanism)`);

// Co-substrate breakdown by severity
const pkPlausibleMajor = results.pk_plausible.filter(p => p.severityCode === 3);
const pkPlausibleModerate = results.pk_plausible.filter(p => p.severityCode === 2);
const pkPlausibleMinor = results.pk_plausible.filter(p => p.severityCode === 1);

console.log(`\n=== Co-substrate pairs by severity ===`);
console.log(`Major:     ${pkPlausibleMajor.length}`);
console.log(`Moderate:  ${pkPlausibleModerate.length}`);
console.log(`Minor:     ${pkPlausibleMinor.length}`);

// Show Major co-substrate with shared systems
console.log(`\n=== MAJOR co-substrate false positives (both pure substrates, no inhibitor) ===`);
const shown = new Set();
for (const p of results.pk_plausible) {
  if (p.severityCode !== 3) continue;
  const [a, b] = p.pair.split(' + ');
  const shared = getSharedSystems(a, b);
  if (shared.length === 0) continue;
  
  // Check neither is an inhibitor
  const annA = getAnnotations(a);
  const annB = getAnnotations(b);
  const hasInhA = annA.some(t => t.role.includes("Inh") && PK_SYSTEMS.has(t.system));
  const hasInhB = annB.some(t => t.role.includes("Inh") && PK_SYSTEMS.has(t.system));
  if (hasInhA || hasInhB) continue; // Skip if either has any inhibitor role
  
  const key = [a,b].sort().join('|');
  if (shown.has(key)) continue;
  shown.add(key);
  
  console.log(`${a} + ${b}  [${shared.join(', ')}]`);
  if (shown.size >= 50) break;
}

// Show Moderate co-substrate with shared systems  
console.log(`\n=== MODERATE co-substrate false positives (both pure substrates, no inhibitor) ===`);
const shown2 = new Set();
for (const p of results.pk_plausible) {
  if (p.severityCode !== 2) continue;
  const [a, b] = p.pair.split(' + ');
  const shared = getSharedSystems(a, b);
  if (shared.length === 0) continue;
  
  const annA = getAnnotations(a);
  const annB = getAnnotations(b);
  const hasInhA = annA.some(t => t.role.includes("Inh") && PK_SYSTEMS.has(t.system));
  const hasInhB = annB.some(t => t.role.includes("Inh") && PK_SYSTEMS.has(t.system));
  if (hasInhA || hasInhB) continue;
  
  const key = [a,b].sort().join('|');
  if (shown2.has(key)) continue;
  shown2.add(key);
  
  console.log(`${a} + ${b}  [${shared.join(', ')}]`);
  if (shown2.size >= 50) break;
}

// Show unverified Major
console.log(`\n=== UNVERIFIED Major pairs (no PK or PD mechanism in local data) ===`);
const shown3 = new Set();
for (const p of results.unverified) {
  if (p.severityCode !== 3) continue;
  const [a, b] = p.pair.split(' + ');
  const key = [a,b].sort().join('|');
  if (shown3.has(key)) continue;
  shown3.add(key);
  console.log(`${a} + ${b}`);
  if (shown3.size >= 30) break;
}
