import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const CYP_PATH = path.join(ROOT, "lib", "cyp.ts");
const RXCUI_MAP_PATH = path.join(ROOT, "lib", "data", "ddinter", "rxcui-map.json");
const OUT_DIR = path.join(ROOT, "lib", "data", "openfda");
const OUT_PATH = path.join(OUT_DIR, "nti-labels.json");

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractConstArray(source, constName) {
  const marker = `const ${constName}`;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`Missing ${constName} in ${CYP_PATH}`);
  }

  const assignmentStart = source.indexOf("=", start);
  const arrayStart = source.indexOf("[", assignmentStart);
  let depth = 0;
  let inString = null;
  let escaped = false;

  for (let index = arrayStart; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = char;
      continue;
    }

    if (char === "[") {
      depth += 1;
      continue;
    }

    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(arrayStart, index + 1);
      }
    }
  }

  throw new Error(`Unable to parse ${constName} in ${CYP_PATH}`);
}

function loadCypEntries(source) {
  return [
    ...vm.runInNewContext(extractConstArray(source, "METABOLISM_ENTRIES"), {}),
    ...vm.runInNewContext(extractConstArray(source, "CYP_REFERENCE_ONLY_ENTRIES"), {}),
  ];
}

function lookupRxcui(match, lookup) {
  const candidates = [
    match,
    normalizeName(match),
    match.replace(/\s+acid$/i, ""),
    `${match} acid`,
  ];

  for (const candidate of candidates) {
    const mapping = lookup.get(normalizeName(candidate));
    if (mapping?.rxcui) {
      return mapping.rxcui;
    }
  }

  return null;
}

async function fetchOpenFdaLabel(rxcui) {
  const url = new URL("https://api.fda.gov/drug/label.json");
  url.searchParams.set("search", `openfda.rxcui:${rxcui}`);
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`OpenFDA request failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const result = json.results?.[0];
  if (!result) {
    return null;
  }

  return {
    setId: result.set_id ?? null,
    effectiveTime: result.effective_time ?? null,
    openfda: result.openfda ?? {},
    drugInteractions: result.drug_interactions ?? [],
    warnings: result.warnings ?? [],
    contraindications: result.contraindications ?? [],
  };
}

async function main() {
  const [cypSource, rawRxcuiMap] = await Promise.all([
    readFile(CYP_PATH, "utf8"),
    readFile(RXCUI_MAP_PATH, "utf8"),
  ]);
  const rxcuiLookup = new Map();

  for (const [name, mapping] of Object.entries(JSON.parse(rawRxcuiMap).mappings)) {
    rxcuiLookup.set(normalizeName(name), mapping);
  }

  const targets = loadCypEntries(cypSource)
    .filter((entry) => entry.nti)
    .map((entry) => ({
      name: entry.match,
      rxcui: lookupRxcui(entry.match, rxcuiLookup),
    }))
    .filter((entry) => entry.rxcui)
    .sort((left, right) => left.name.localeCompare(right.name));

  const labels = [];
  for (const target of targets) {
    const label = await fetchOpenFdaLabel(target.rxcui);
    labels.push({
      ...target,
      label,
      source: {
        name: "OpenFDA drug label API",
        version: new Date().toISOString().slice(0, 10),
      },
    });
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    OUT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        note: "Review staging only. Do not promote parsed labels to runtime decisions without manual clinical review.",
        labels,
      },
      null,
      2
    ) + "\n"
  );

  console.log(
    JSON.stringify(
      {
        targets: targets.length,
        labelsWithInteractionText: labels.filter(
          (entry) => entry.label?.drugInteractions?.length
        ).length,
        output: path.relative(ROOT, OUT_PATH),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
