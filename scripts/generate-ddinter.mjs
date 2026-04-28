import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DDINTER_DIR = path.join(ROOT, "lib", "data", "ddinter");
const OVERLAY_DIR = path.join(ROOT, "lib", "data", "overlay");
const BRANDS_DIR = path.join(ROOT, "lib", "data", "brands");
const RXCUI_MAP_PATH = path.join(DDINTER_DIR, "rxcui-map.json");
const DDINTER_INDEX_PATH = path.join(DDINTER_DIR, "index.json");
const DDINTER_REPORT_PATH = path.join(DDINTER_DIR, "build-report.json");
const OVERLAY_INDEX_PATH = path.join(OVERLAY_DIR, "index.json");
const BRANDS_INDEX_PATH = path.join(BRANDS_DIR, "index.json");

const DDINTER_CODES = ["A", "B", "C", "D", "G", "H", "J", "L", "M", "N", "P", "R", "S", "V"];
const DDINTER_VERSION = "2.0";
const OVERLAY_VERSION = "2026-04";
const BRANDS_VERSION = "2026-04";
const RXNAV = "https://rxnav.nlm.nih.gov/REST/rxcui.json?name=";

const severityToCode = {
  Minor: 1,
  Moderate: 2,
  Major: 3,
  Contraindicated: 4,
};

const overlayEntrySchema = z.object({
  pair: z.tuple([z.string().min(1), z.string().min(1)]),
  suppress: z.boolean().optional(),
  severity: z.enum(["Contraindicated", "Major", "Moderate", "Minor"]).optional(),
  verdict: z.string().trim().min(1).optional(),
  mechanism_class: z.string().trim().min(1).optional(),
  management: z.string().trim().min(1).optional(),
  sources: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        version: z.string().trim().min(1),
      })
    )
    .min(1),
}).superRefine((entry, ctx) => {
  if (entry.suppress) {
    return;
  }

  if (!entry.severity) {
    ctx.addIssue({
      code: "custom",
      message: "Overlay entries must include severity unless suppress is true",
      path: ["severity"],
    });
  }

  if (!entry.verdict) {
    ctx.addIssue({
      code: "custom",
      message: "Overlay entries must include verdict unless suppress is true",
      path: ["verdict"],
    });
  }
});

const overlayFileSchema = z.array(overlayEntrySchema);
const brandEntrySchema = z.object({
  term: z.string().trim().min(1),
  components: z
    .array(
      z.object({
        rxcui: z.string().trim().min(1),
        name: z.string().trim().min(1),
      })
    )
    .min(1),
  sources: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        version: z.string().trim().min(1),
      })
    )
    .min(1),
});

const brandFileSchema = z.array(brandEntrySchema);

function csvToRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows;
}

function sortedPairKey(a, b) {
  return [a, b].sort((left, right) => left.localeCompare(right)).join("|");
}

function buildLookupCandidates(name) {
  const candidates = [
    name.trim(),
    name.replace(/\s+/g, " ").trim(),
    name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim(),
  ];

  return [...new Set(candidates.filter(Boolean))];
}

async function fetchJson(url) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "text/plain,text/csv,*/*" },
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText} for ${url}`);
  }
  return response.text();
}

async function loadExistingMap() {
  try {
    const raw = await readFile(RXCUI_MAP_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed.mappings ?? {};
  } catch {
    return {};
  }
}

async function pathExists(targetPath) {
  try {
    await readFile(targetPath, "utf8");
    return true;
  } catch {
    return false;
  }
}

async function resolveName(name, existingMap) {
  if (existingMap[name]) {
    return existingMap[name];
  }

  for (const candidate of buildLookupCandidates(name)) {
    const json = await fetchJson(`${RXNAV}${encodeURIComponent(candidate)}`);
    const rxcui = json?.idGroup?.rxnormId?.[0] ?? null;
    if (rxcui) {
      return { rxcui, query: candidate };
    }
  }

  return { rxcui: null, query: null };
}

async function mapNamesToRxcuis(names, existingMap) {
  const mappings = { ...existingMap };
  const queue = [...names].filter((name) => mappings[name] === undefined);
  const concurrency = 10;

  async function worker() {
    while (queue.length > 0) {
      const name = queue.shift();
      if (!name) {
        return;
      }
      mappings[name] = await resolveName(name, mappings);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return mappings;
}

async function loadOverlayEntries() {
  const files = (await readdir(OVERLAY_DIR))
    .filter((name) => name.endsWith(".yaml"))
    .sort((left, right) => left.localeCompare(right));

  const entries = [];
  for (const fileName of files) {
    const fullPath = path.join(OVERLAY_DIR, fileName);
    const raw = await readFile(fullPath, "utf8");
    const parsed = parseYaml(raw) ?? [];
    const validated = overlayFileSchema.parse(parsed);
    for (const entry of validated) {
      entries.push({
        key: sortedPairKey(entry.pair[0], entry.pair[1]),
        pair: [...entry.pair].sort((left, right) => left.localeCompare(right)),
        suppress: entry.suppress ?? false,
        severity: entry.severity,
        verdict: entry.verdict,
        mechanism_class: entry.mechanism_class,
        management: entry.management,
        sources: entry.sources,
        file: fileName,
      });
    }
  }

  return entries;
}

function normalizeBrandTerm(term) {
  return term.toLowerCase().replace(/\s+/g, " ").trim();
}

async function loadBrandEntries() {
  const files = (await readdir(BRANDS_DIR))
    .filter((name) => name.endsWith(".yaml"))
    .sort((left, right) => left.localeCompare(right));

  const entries = [];
  for (const fileName of files) {
    const fullPath = path.join(BRANDS_DIR, fileName);
    const raw = await readFile(fullPath, "utf8");
    const parsed = parseYaml(raw) ?? [];
    const validated = brandFileSchema.parse(parsed);
    for (const entry of validated) {
      entries.push({
        term: entry.term,
        normalizedTerm: normalizeBrandTerm(entry.term),
        components: entry.components,
        sources: entry.sources,
        file: fileName,
      });
    }
  }

  return entries;
}

function buildBrandRxcuiNames(brandEntries) {
  const map = {};
  for (const entry of brandEntries) {
    for (const comp of entry.components) {
      const current = map[comp.rxcui];
      if (!current || comp.name.length < current.length) {
        map[comp.rxcui] = comp.name;
      }
    }
  }
  return map;
}

async function main() {
  await mkdir(DDINTER_DIR, { recursive: true });
  await mkdir(OVERLAY_DIR, { recursive: true });
  await mkdir(BRANDS_DIR, { recursive: true });

  const shouldRefreshDdinter =
    process.env.REFRESH_DDINTER === "1" ||
    !(await pathExists(RXCUI_MAP_PATH)) ||
    !(await pathExists(DDINTER_INDEX_PATH)) ||
    !(await pathExists(DDINTER_REPORT_PATH)) ||
    !(await pathExists(OVERLAY_INDEX_PATH));
  const brandEntries = await loadBrandEntries();
  const generatedAt = new Date().toISOString();

  if (shouldRefreshDdinter) {
    const existingMap = await loadExistingMap();
    const csvRows = [];
    const names = new Set();

    for (const code of DDINTER_CODES) {
      const csv = await fetchText(
        `https://ddinter2.scbdd.com/static/media/download/ddinter_downloads_code_${code}.csv`
      );
      const rows = csvToRows(csv);
      const [, ...body] = rows;
      for (const row of body) {
        const [ddinterIdA, drugA, ddinterIdB, drugB, level] = row;
        if (!ddinterIdA || !drugA || !ddinterIdB || !drugB || !level) {
          continue;
        }
        names.add(drugA);
        names.add(drugB);
        csvRows.push({
          ddinterIdA,
          drugA,
          ddinterIdB,
          drugB,
          level,
          code,
        });
      }
    }

    const mappings = await mapNamesToRxcuis(
      [...names].sort((a, b) => a.localeCompare(b)),
      existingMap
    );
    const pairIndex = {};
    const rxcuiNames = {};
    const unresolvedNames = [];
    let skippedUnknownLevel = 0;
    let skippedUnresolvedPairCount = 0;

    for (const [name, value] of Object.entries(mappings)) {
      if (!value?.rxcui) {
        unresolvedNames.push(name);
        continue;
      }
      const current = rxcuiNames[value.rxcui];
      if (!current || name.length < current.length) {
        rxcuiNames[value.rxcui] = name;
      }
    }

    for (const row of csvRows) {
      const severityCode = severityToCode[row.level];
      if (!severityCode) {
        skippedUnknownLevel += 1;
        continue;
      }

      const mappedA = mappings[row.drugA]?.rxcui ?? null;
      const mappedB = mappings[row.drugB]?.rxcui ?? null;
      if (!mappedA || !mappedB) {
        skippedUnresolvedPairCount += 1;
        continue;
      }

      const key = sortedPairKey(mappedA, mappedB);
      pairIndex[key] = Math.max(pairIndex[key] ?? 0, severityCode);
    }

    await writeFile(
      RXCUI_MAP_PATH,
      JSON.stringify(
        {
          generatedAt,
          ddinterVersion: DDINTER_VERSION,
          mappings,
        },
        null,
        2
      ) + "\n"
    );

    await writeFile(
      DDINTER_INDEX_PATH,
      JSON.stringify(
        {
          generatedAt,
          ddinterVersion: DDINTER_VERSION,
          pairIndex,
          rxcuiNames,
        },
        null,
        2
      ) + "\n"
    );

    await writeFile(
      DDINTER_REPORT_PATH,
      JSON.stringify(
        {
          generatedAt,
          ddinterVersion: DDINTER_VERSION,
          overlayVersion: OVERLAY_VERSION,
          sourceCodes: DDINTER_CODES,
          totalCsvRows: csvRows.length,
          uniqueDrugNames: names.size,
          resolvedDrugNames: names.size - unresolvedNames.length,
          unresolvedDrugNames: unresolvedNames.length,
          unresolvedNameList: unresolvedNames,
          skippedUnknownLevel,
          skippedUnresolvedPairCount,
          totalResolvedPairs: Object.keys(pairIndex).length,
        },
        null,
        2
      ) + "\n"
    );

    console.log(
      JSON.stringify(
        {
          totalCsvRows: csvRows.length,
          uniqueDrugNames: names.size,
          resolvedPairs: Object.keys(pairIndex).length,
          unresolvedDrugNames: unresolvedNames.length,
        },
        null,
        2
      )
    );
  } else {
    console.log(
      JSON.stringify(
        {
          ddinter: "preserved",
        },
        null,
        2
      )
    );
  }

  // Always regenerate overlay so YAML edits take effect without REFRESH_DDINTER=1
  const overlayEntries = await loadOverlayEntries();
  await writeFile(
    OVERLAY_INDEX_PATH,
    JSON.stringify(
      {
        generatedAt,
        overlayVersion: OVERLAY_VERSION,
        entries: overlayEntries,
      },
      null,
      2
    ) + "\n"
  );

  await writeFile(
    BRANDS_INDEX_PATH,
    JSON.stringify(
      {
        generatedAt,
        brandsVersion: BRANDS_VERSION,
        entries: brandEntries,
        rxcuiNames: buildBrandRxcuiNames(brandEntries),
      },
      null,
      2
    ) + "\n"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
