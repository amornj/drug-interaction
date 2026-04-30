import fs from 'fs';

const overlay = JSON.parse(fs.readFileSync('./lib/data/overlay/index.json', 'utf8'));
const rxcuiMapData = JSON.parse(fs.readFileSync('./lib/data/ddinter/rxcui-map.json', 'utf8')).mappings;

function normalizeDrugName(name) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const cypContent = fs.readFileSync('./lib/cyp.ts', 'utf8');
const entriesMatch = cypContent.match(/export const METABOLISM_ENTRIES: MetabolismEntry\[\] = (\[.*?\]);/s);
const METABOLISM_ENTRIES = eval(entriesMatch[1]);

const drugAnnotations = new Map();
for (const entry of METABOLISM_ENTRIES) {
  const norm = entry.match.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  drugAnnotations.set(norm, entry.annotations);
}

const PK_SYSTEMS = new Set([
  "CYP3A4","CYP2D6","CYP2C9","CYP2C19","CYP2C8","CYP2B6","CYP1A2",
  "CYP2E1","CYP2A6","P-gp","OAT","OCT","MATE","BCRP","UGT","UGT1A1",
  "Xanthine oxidase"
]);

function getAnnotations(name) {
  const norm = normalizeDrugName(name);
  return drugAnnotations.get(norm) || [];
}

function classifyPair(nameA, nameB) {
  const tagsA = getAnnotations(nameA);
  const tagsB = getAnnotations(nameB);
  
  const inhibSystemsA = tagsA.filter(t => t.role.includes("Inh") && PK_SYSTEMS.has(t.system)).map(t => t.system);
  const inhibSystemsB = tagsB.filter(t => t.role.includes("Inh") && PK_SYSTEMS.has(t.system)).map(t => t.system);
  const inducSystemsA = tagsA.filter(t => t.role.includes("Ind") && !t.role.includes("Weak Ind") && PK_SYSTEMS.has(t.system)).map(t => t.system);
  const inducSystemsB = tagsB.filter(t => t.role.includes("Ind") && !t.role.includes("Weak Ind") && PK_SYSTEMS.has(t.system)).map(t => t.system);
  const subSystemsA = tagsA.filter(t => t.role === "Sub" && PK_SYSTEMS.has(t.system)).map(t => t.system);
  const subSystemsB = tagsB.filter(t => t.role === "Sub" && PK_SYSTEMS.has(t.system)).map(t => t.system);
  
  if (inhibSystemsA.some(s => subSystemsB.includes(s))) return "pk_confirmed";
  if (inhibSystemsB.some(s => subSystemsA.includes(s))) return "pk_confirmed";
  if (inducSystemsA.some(s => subSystemsB.includes(s))) return "pk_confirmed";
  if (inducSystemsB.some(s => subSystemsA.includes(s))) return "pk_confirmed";
  
  const sharedSubs = subSystemsA.filter(s => subSystemsB.includes(s));
  if (sharedSubs.length > 0) return "pk_plausible";
  
  return "unverified";
}

const rxcuiNames = overlay.rxcuiNames || {};

function getName(rxcui) {
  return rxcuiNames[rxcui] || rxcuiMapData[Object.keys(rxcuiMapData).find(k => rxcuiMapData[k].rxcui === rxcui)]?.query || rxcui;
}

const clinicalEntries = overlay.entries.filter(e => 
  e.sources?.some(s => s.name === "Clinical overlay")
);

console.log(`Total clinical overlay entries: ${clinicalEntries.length}\n`);

const noPk = [];
const hasPk = [];

for (const entry of clinicalEntries) {
  const [a, b] = entry.pair;
  const nameA = getName(a);
  const nameB = getName(b);
  const conf = classifyPair(nameA, nameB);
  
  if (conf === "unverified") {
    noPk.push({ pair: `${nameA} + ${nameB}`, key: entry.key, severity: entry.severity });
  } else {
    hasPk.push({ pair: `${nameA} + ${nameB}`, conf });
  }
}

console.log(`=== Clinical overlay pairs WITHOUT local PK data (${noPk.length}) ===`);
for (const p of noPk) {
  console.log(`  ${p.pair} (${p.severity})`);
}

console.log(`\n=== Clinical overlay pairs WITH local PK data (${hasPk.length}) ===`);
for (const p of hasPk) {
  console.log(`  ${p.pair} [${p.conf}]`);
}
