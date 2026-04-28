import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const CYP_PATH = path.join(ROOT, "lib", "cyp.ts");
const RXCUI_MAP_PATH = path.join(ROOT, "lib", "data", "ddinter", "rxcui-map.json");
const DDINTER_INDEX_PATH = path.join(ROOT, "lib", "data", "ddinter", "index.json");
const OUT_PATH = path.join(ROOT, "lib", "data", "overlay", "cyp-derived.yaml");

const SOURCE_VERSION = "2026-04";
const SOURCE_NAME = "CYP/transporter-derived";
const INCLUDED_SYSTEMS = new Set([
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
  "BCRP",
  "OAT",
  "MATE",
  "OCT",
  "UGT",
  "UGT1A1",
]);
const severityToCode = {
  Minor: 1,
  Moderate: 2,
  Major: 3,
  Contraindicated: 4,
};

function sortedPairKey(a, b) {
  return [a, b].sort((left, right) => left.localeCompare(right)).join("|");
}

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

function loadArrayFromSource(source, constName) {
  const arrayLiteral = extractConstArray(source, constName);
  return vm.runInNewContext(arrayLiteral, {});
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

function roleKind(role) {
  if (role.includes("Inh")) {
    return "inhibitor";
  }
  if (role.includes("Ind")) {
    return "inducer";
  }
  return null;
}

function roleStrength(role, note = "") {
  const text = `${role} ${note}`.toLowerCase();
  if (text.includes("strong")) {
    return "Strong";
  }
  if (text.includes("moderate")) {
    return "Moderate";
  }
  if (text.includes("weak")) {
    return "Weak";
  }
  return role.includes("Inh") ? "Unspecified" : "Unspecified";
}

function pathwayFraction(note = "") {
  const lowered = note.toLowerCase();
  if (lowered.includes("minor")) {
    return "minor";
  }
  if (lowered.includes("major")) {
    return "major";
  }
  return "primary";
}

function severityFor(kind, strength, isNti, fraction) {
  const isMinorPathway = fraction === "minor";

  if (kind === "inducer") {
    if (strength === "Strong") {
      return isMinorPathway ? "Moderate" : "Major";
    }
    if (strength === "Moderate") {
      if (isNti) {
        return isMinorPathway ? "Moderate" : "Major";
      }
      return isMinorPathway ? null : "Moderate";
    }
    return null;
  }

  if (strength === "Strong") {
    if (isNti && !isMinorPathway) {
      return "Contraindicated";
    }
    if (isNti && isMinorPathway) {
      return "Major";
    }
    return isMinorPathway ? "Moderate" : "Major";
  }

  if (strength === "Moderate") {
    if (isNti) {
      return isMinorPathway ? "Moderate" : "Major";
    }
    return isMinorPathway ? null : "Moderate";
  }

  if (strength === "Weak") {
    return isNti && !isMinorPathway ? "Moderate" : null;
  }

  return isNti && !isMinorPathway ? "Moderate" : null;
}

function isProdrug(annotation) {
  return annotation.note?.toLowerCase().includes("prodrug") ?? false;
}

function yamlScalar(value) {
  return String(value).replace(/"/g, '\\"');
}

function yamlBlock(value, indent = "  ") {
  return String(value)
    .split("\n")
    .map((line) => `${indent}${line}`)
    .join("\n");
}

function buildEntry(interactor, substrate, system, severity, kind, strength, prodrug) {
  const normalizedStrength = strength === "Unspecified" ? "" : `${strength.toLowerCase()} `;
  const effectVerb = kind === "inhibitor" ? "reduce clearance of" : "accelerate clearance of";
  const outcome = kind === "inhibitor" && !prodrug
    ? "increase plasma exposure"
    : "reduce therapeutic effect";
  const verdict = prodrug
    ? `${interactor.drugName} is a ${normalizedStrength}${system} ${kind}. ${substrate.drugName} requires ${system}-mediated activation. Co-administration is predicted to reduce activation of ${substrate.drugName} and reduce its therapeutic effect.`
    : `${interactor.drugName} is a ${normalizedStrength}${system} ${kind}. ${substrate.drugName} is metabolised via ${system}. Co-administration is predicted to ${effectVerb} ${substrate.drugName} and ${outcome}.`;
  const management = severity === "Contraindicated"
    ? `Avoid combination. If unavoidable, use specialist guidance, adjust ${substrate.drugName} dose, and monitor levels or therapeutic endpoints closely.`
    : severity === "Major"
    ? `Avoid combination where possible. If necessary, adjust ${substrate.drugName} dose and monitor levels or therapeutic endpoints closely.`
    : kind === "inhibitor" && !prodrug
    ? `Monitor for signs of ${substrate.drugName} toxicity. Dose adjustment may be required.`
    : `Monitor for reduced ${substrate.drugName} efficacy. Dose adjustment may be required.`;

  return {
    pair: [interactor.rxcui, substrate.rxcui].sort((left, right) =>
      left.localeCompare(right)
    ),
    system,
    interactor: interactor.drugName,
    substrate: substrate.drugName,
    severity,
    verdict,
    mechanism_class: `${system} ${kind}`,
    management,
  };
}

async function main() {
  const [cypSource, rawRxcuiMap, rawDdinterIndex] = await Promise.all([
    readFile(CYP_PATH, "utf8"),
    readFile(RXCUI_MAP_PATH, "utf8"),
    readFile(DDINTER_INDEX_PATH, "utf8"),
  ]);
  const entries = [
    ...loadArrayFromSource(cypSource, "METABOLISM_ENTRIES"),
    ...loadArrayFromSource(cypSource, "CYP_REFERENCE_ONLY_ENTRIES"),
  ];
  const rxcuiLookup = new Map();
  const ddinterPairIndex = JSON.parse(rawDdinterIndex).pairIndex;

  for (const [name, mapping] of Object.entries(JSON.parse(rawRxcuiMap).mappings)) {
    rxcuiLookup.set(normalizeName(name), mapping);
  }

  const interactorsBySystem = new Map();
  const substratesBySystem = new Map();

  for (const entry of entries) {
    const rxcui = lookupRxcui(entry.match, rxcuiLookup);
    if (!rxcui) {
      continue;
    }

    for (const annotation of entry.annotations) {
      if (!INCLUDED_SYSTEMS.has(annotation.system)) {
        continue;
      }

      if (annotation.role === "Sub") {
        const substrates = substratesBySystem.get(annotation.system) ?? [];
        substrates.push({
          drugName: entry.match,
          normalizedName: normalizeName(entry.match),
          rxcui,
          nti: entry.nti ?? false,
          annotation,
          fraction: pathwayFraction(annotation.note),
        });
        substratesBySystem.set(annotation.system, substrates);
        continue;
      }

      const kind = roleKind(annotation.role);
      if (!kind) {
        continue;
      }

      const interactors = interactorsBySystem.get(annotation.system) ?? [];
      interactors.push({
        drugName: entry.match,
        normalizedName: normalizeName(entry.match),
        rxcui,
        annotation,
        kind,
        strength: roleStrength(annotation.role, annotation.note),
      });
      interactorsBySystem.set(annotation.system, interactors);
    }
  }

  const generated = new Map();
  for (const system of [...INCLUDED_SYSTEMS].sort((a, b) => a.localeCompare(b))) {
    const interactors = interactorsBySystem.get(system) ?? [];
    const substrates = substratesBySystem.get(system) ?? [];

    for (const interactor of interactors) {
      for (const substrate of substrates) {
        if (interactor.normalizedName === substrate.normalizedName) {
          continue;
        }

        const severity = severityFor(
          interactor.kind,
          interactor.strength,
          substrate.nti,
          substrate.fraction
        );
        if (!severity) {
          continue;
        }

        const key = sortedPairKey(interactor.rxcui, substrate.rxcui);
        const currentSeverityCode = ddinterPairIndex[key] ?? 0;
        if (currentSeverityCode >= severityToCode[severity]) {
          continue;
        }
        if (!substrate.nti && currentSeverityCode === 0) {
          continue;
        }

        const nextEntry = buildEntry(
          interactor,
          substrate,
          system,
          severity,
          interactor.kind,
          interactor.strength,
          isProdrug(substrate.annotation)
        );
        const existing = generated.get(key);
        if (
          !existing ||
          severityToCode[nextEntry.severity] > severityToCode[existing.severity]
        ) {
          generated.set(key, nextEntry);
        }
      }
    }
  }

  const outputEntries = [...generated.values()].sort((left, right) => {
    const systemDiff = left.system.localeCompare(right.system);
    if (systemDiff !== 0) {
      return systemDiff;
    }
    const interactorDiff = left.interactor.localeCompare(right.interactor);
    if (interactorDiff !== 0) {
      return interactorDiff;
    }
    return left.substrate.localeCompare(right.substrate);
  });

  const yaml = [
    "# Generated by scripts/generate-cyp-pairs.mjs.",
    "# Do not edit manually; curated exclusions belong in separate overlay files.",
    ...outputEntries.map((entry) =>
      [
        `- pair: ["${yamlScalar(entry.pair[0])}", "${yamlScalar(entry.pair[1])}"]`,
        `  severity: ${entry.severity}`,
        "  verdict: >-",
        yamlBlock(entry.verdict, "    "),
        `  mechanism_class: "${yamlScalar(entry.mechanism_class)}"`,
        "  management: >-",
        yamlBlock(entry.management, "    "),
        "  sources:",
        `    - name: "${SOURCE_NAME}"`,
        `      version: "${SOURCE_VERSION}"`,
      ].join("\n")
    ),
  ].join("\n\n");

  await writeFile(OUT_PATH, `${yaml}\n`);
  console.log(
    JSON.stringify(
      {
        generatedPairs: outputEntries.length,
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
