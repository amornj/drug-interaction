type MetabolismAnnotation = {
  system: string;
  role: string;
  note?: string;
};

type MetabolismEntry = {
  match: string;
  annotations: MetabolismAnnotation[];
};

export type DrugMetabolismTag = {
  id: string;
  system: string;
  label: string;
  clickable: boolean;
};

export type MetabolismReference = {
  system: string;
  inhibitors: string[];
  inducers: string[];
};

function normalizeDrugName(name: string) {
  return name.toLowerCase().replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

const METABOLISM_ENTRIES: MetabolismEntry[] = [
  { match: "simvastatin", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "BCRP", role: "Transport" }] },
  { match: "atorvastatin", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "BCRP", role: "Transport" }] },
  { match: "lovastatin", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "BCRP", role: "Transport" }] },
  { match: "amlodipine", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "nifedipine", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  {
    match: "verapamil",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A4", role: "Moderate Inh" },
      { system: "P-gp", role: "Inh", note: "moderate-strong" },
    ],
  },
  {
    match: "diltiazem",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A4", role: "Moderate Inh" },
      { system: "P-gp", role: "Inh", note: "strong" },
    ],
  },
  {
    match: "apixaban",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "P-gp", role: "Sub" },
      { system: "Renal elim", role: "Partial" },
    ],
  },
  {
    match: "rivaroxaban",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "P-gp", role: "Sub" },
      { system: "Renal elim", role: "Partial" },
    ],
  },
  {
    match: "edoxaban",
    annotations: [{ system: "P-gp", role: "Sub" }, { system: "Renal elim", role: "Partial" }],
  },
  {
    match: "dabigatran",
    annotations: [
      { system: "P-gp", role: "Sub", note: "critical" },
      { system: "Renal elim", role: "Partial" },
    ],
  },
  {
    match: "tacrolimus",
    annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "P-gp", role: "Sub" }],
  },
  {
    match: "cyclosporine",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "P-gp", role: "Sub" },
      { system: "P-gp", role: "Inh", note: "strong" },
    ],
  },
  { match: "midazolam", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "triazolam", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "fentanyl", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "oxycodone", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "sildenafil", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "P-gp", role: "Sub" }] },
  { match: "tadalafil", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "quetiapine", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "lurasidone", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  {
    match: "carbamazepine",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A4", role: "Moderate Ind" },
      { system: "CYP2C9", role: "Ind" },
      { system: "CYP2C19", role: "Ind" },
      { system: "CYP1A2", role: "Moderate Ind" },
      { system: "CYP2B6", role: "Ind" },
      { system: "P-gp", role: "Ind" },
    ],
  },
  { match: "diazepam", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2C19", role: "Sub" }] },
  { match: "alprazolam", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "prednisone", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "prednisolone", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  {
    match: "amiodarone",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A4", role: "Moderate Inh" },
      { system: "CYP2C9", role: "Strong Inh" },
      { system: "P-gp", role: "Inh", note: "strong" },
    ],
  },
  { match: "eplerenone", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "buspirone", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "zolpidem", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "domperidone", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "ivabradine", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "lidocaine", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "estradiol", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "ondansetron", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2D6", role: "Sub" }] },
  { match: "ergotamine", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  {
    match: "colchicine",
    annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "P-gp", role: "Sub" }],
  },
  {
    match: "ritonavir",
    annotations: [{ system: "CYP3A4", role: "Strong Inh" }, { system: "P-gp", role: "Inh", note: "strong" }],
  },
  { match: "cobicistat", annotations: [{ system: "CYP3A4", role: "Strong Inh" }] },
  {
    match: "ketoconazole",
    annotations: [{ system: "CYP3A4", role: "Strong Inh" }, { system: "P-gp", role: "Inh", note: "strong" }],
  },
  {
    match: "itraconazole",
    annotations: [{ system: "CYP3A4", role: "Strong Inh" }, { system: "P-gp", role: "Inh", note: "strong" }],
  },
  {
    match: "clarithromycin",
    annotations: [{ system: "CYP3A4", role: "Strong Inh" }, { system: "P-gp", role: "Inh", note: "strong" }],
  },
  {
    match: "erythromycin",
    annotations: [
      { system: "CYP3A4", role: "Moderate Inh" },
      { system: "P-gp", role: "Sub" },
      { system: "P-gp", role: "Inh", note: "moderate" },
    ],
  },
  {
    match: "fluconazole",
    annotations: [
      { system: "CYP3A4", role: "Moderate Inh" },
      { system: "CYP2C9", role: "Strong Inh" },
      { system: "P-gp", role: "Inh", note: "moderate" },
    ],
  },
  {
    match: "ciprofloxacin",
    annotations: [{ system: "CYP3A4", role: "Weak Inh" }, { system: "CYP1A2", role: "Strong Inh" }],
  },
  {
    match: "rifampin",
    annotations: [
      { system: "CYP3A4", role: "Strong Ind" },
      { system: "CYP2C9", role: "Ind" },
      { system: "CYP2C19", role: "Ind" },
      { system: "CYP1A2", role: "Moderate Ind" },
      { system: "CYP2B6", role: "Ind" },
      { system: "CYP2A6", role: "Ind" },
      { system: "P-gp", role: "Ind", note: "strong" },
    ],
  },
  {
    match: "phenytoin",
    annotations: [
      { system: "CYP3A4", role: "Moderate Ind" },
      { system: "CYP2C9", role: "Sub" },
      { system: "CYP2C9", role: "Ind" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP2C19", role: "Ind" },
      { system: "P-gp", role: "Ind" },
    ],
  },
  {
    match: "phenobarbital",
    annotations: [
      { system: "CYP3A4", role: "Moderate Ind" },
      { system: "CYP2C9", role: "Ind" },
      { system: "CYP2B6", role: "Ind" },
      { system: "P-gp", role: "Ind" },
    ],
  },
  {
    match: "efavirenz",
    annotations: [
      { system: "CYP3A4", role: "Weak Ind" },
      { system: "CYP2B6", role: "Sub" },
      { system: "P-gp", role: "Ind", note: "moderate" },
    ],
  },
  {
    match: "codeine",
    annotations: [{ system: "CYP2D6", role: "Sub", note: "PGx, prodrug" }],
  },
  {
    match: "tramadol",
    annotations: [{ system: "CYP2D6", role: "Sub", note: "PGx, prodrug" }],
  },
  { match: "metoprolol", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "propranolol", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "amitriptyline", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "nortriptyline", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "venlafaxine", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "risperidone", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "haloperidol", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "flecainide", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  {
    match: "propafenone",
    annotations: [{ system: "CYP2D6", role: "Sub" }],
  },
  {
    match: "tamoxifen",
    annotations: [{ system: "CYP2D6", role: "Sub", note: "PGx, prodrug" }],
  },
  { match: "carvedilol", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "duloxetine", annotations: [{ system: "CYP2D6", role: "Sub" }, { system: "CYP2D6", role: "Moderate Inh" }] },
  { match: "paroxetine", annotations: [{ system: "CYP2D6", role: "Sub" }, { system: "CYP2D6", role: "Strong Inh" }] },
  { match: "fluoxetine", annotations: [{ system: "CYP2D6", role: "Sub" }, { system: "CYP2D6", role: "Strong Inh" }, { system: "CYP2C19", role: "Moderate Inh" }] },
  { match: "aripiprazole", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "dextromethorphan", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "bupropion", annotations: [{ system: "CYP2D6", role: "Strong Inh" }, { system: "CYP2B6", role: "Sub" }] },
  { match: "quinidine", annotations: [{ system: "CYP2D6", role: "Strong Inh" }, { system: "P-gp", role: "Sub" }] },
  { match: "sertraline", annotations: [{ system: "CYP2D6", role: "Moderate Inh" }] },
  { match: "terbinafine", annotations: [{ system: "CYP2D6", role: "Moderate Inh" }] },
  {
    match: "cimetidine",
    annotations: [
      { system: "CYP2D6", role: "Weak Inh" },
      { system: "CYP2C19", role: "Weak Inh" },
      { system: "CYP1A2", role: "Moderate Inh" },
      { system: "P-gp", role: "Inh" },
    ],
  },
  {
    match: "warfarin",
    annotations: [{ system: "CYP2C9", role: "Sub" }, { system: "CYP1A2", role: "Sub", note: "minor" }],
  },
  { match: "diclofenac", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "ibuprofen", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "glyburide", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "glipizide", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "losartan", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "celecoxib", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "fluvastatin", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "tolbutamide", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "metronidazole", annotations: [{ system: "CYP2C9", role: "Strong Inh" }] },
  { match: "trimethoprim sulfamethoxazole", annotations: [{ system: "CYP2C9", role: "Strong Inh" }] },
  { match: "sulfamethoxazole trimethoprim", annotations: [{ system: "CYP2C9", role: "Strong Inh" }] },
  { match: "valproate", annotations: [{ system: "CYP2C9", role: "Moderate Inh" }] },
  {
    match: "isoniazid",
    annotations: [{ system: "CYP2C9", role: "Moderate Inh" }, { system: "CYP2E1", role: "Ind" }, { system: "NAT2", role: "Met" }],
  },
  {
    match: "clopidogrel",
    annotations: [
      { system: "CYP2C19", role: "Sub", note: "PGx, prodrug" },
      { system: "CYP2B6", role: "Inh" },
    ],
  },
  {
    match: "omeprazole",
    annotations: [
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP2C19", role: "Strong Inh" },
      { system: "CYP2C9", role: "Weak Inh" },
      { system: "P-gp", role: "Inh", note: "weak" },
    ],
  },
  {
    match: "esomeprazole",
    annotations: [{ system: "CYP2C19", role: "Sub" }, { system: "CYP2C19", role: "Strong Inh" }],
  },
  { match: "citalopram", annotations: [{ system: "CYP2C19", role: "Sub" }] },
  { match: "voriconazole", annotations: [{ system: "CYP2C19", role: "Sub" }] },
  { match: "proguanil", annotations: [{ system: "CYP2C19", role: "Sub" }] },
  {
    match: "fluvoxamine",
    annotations: [{ system: "CYP2C19", role: "Moderate Inh" }, { system: "CYP1A2", role: "Strong Inh" }],
  },
  { match: "theophylline", annotations: [{ system: "CYP1A2", role: "Sub" }] },
  { match: "caffeine", annotations: [{ system: "CYP1A2", role: "Sub" }] },
  { match: "clozapine", annotations: [{ system: "CYP1A2", role: "Sub" }] },
  { match: "olanzapine", annotations: [{ system: "CYP1A2", role: "Sub" }] },
  { match: "tizanidine", annotations: [{ system: "CYP1A2", role: "Sub" }] },
  { match: "ropinirole", annotations: [{ system: "CYP1A2", role: "Sub" }] },
  { match: "ketamine", annotations: [{ system: "CYP2B6", role: "Sub" }] },
  { match: "ticlopidine", annotations: [{ system: "CYP2B6", role: "Inh" }] },
  { match: "nicotine", annotations: [{ system: "CYP2A6", role: "Sub" }] },
  { match: "coumarin", annotations: [{ system: "CYP2A6", role: "Sub" }] },
  { match: "methoxsalen", annotations: [{ system: "CYP2A6", role: "Inh" }] },
  { match: "ethanol", annotations: [{ system: "CYP2E1", role: "Sub" }, { system: "Alcohol dehydrogenase", role: "Met" }] },
  {
    match: "acetaminophen",
    annotations: [{ system: "CYP2E1", role: "Sub", note: "minor" }, { system: "SULT", role: "Met", note: "major" }],
  },
  {
    match: "paracetamol",
    annotations: [{ system: "CYP2E1", role: "Sub", note: "minor" }, { system: "SULT", role: "Met", note: "major" }],
  },
  { match: "halothane", annotations: [{ system: "CYP2E1", role: "Sub" }] },
  { match: "disulfiram", annotations: [{ system: "CYP2E1", role: "Inh" }] },
  { match: "morphine", annotations: [{ system: "UGT", role: "Met" }] },
  { match: "lorazepam", annotations: [{ system: "UGT", role: "Met" }] },
  { match: "lamotrigine", annotations: [{ system: "UGT", role: "Met" }] },
  { match: "azathioprine", annotations: [{ system: "TPMT", role: "Met" }] },
  { match: "allopurinol", annotations: [{ system: "Xanthine oxidase", role: "Pathway" }] },
  { match: "remifentanil", annotations: [{ system: "Esterase", role: "Rapid hydrolysis" }] },
  { match: "esmolol", annotations: [{ system: "Esterase", role: "Rapid hydrolysis" }] },
  { match: "aspirin", annotations: [{ system: "Esterase", role: "Rapid hydrolysis" }] },
  {
    match: "metformin",
    annotations: [{ system: "Renal elim", role: "Major" }, { system: "OCT", role: "Transport" }],
  },
  {
    match: "lithium",
    annotations: [{ system: "Renal elim", role: "Major" }],
  },
  {
    match: "gentamicin",
    annotations: [{ system: "Renal elim", role: "Major" }],
  },
  {
    match: "tobramycin",
    annotations: [{ system: "Renal elim", role: "Major" }],
  },
  {
    match: "amikacin",
    annotations: [{ system: "Renal elim", role: "Major" }],
  },
  {
    match: "digoxin",
    annotations: [{ system: "P-gp", role: "Sub", note: "NTI" }],
  },
  {
    match: "loperamide",
    annotations: [{ system: "P-gp", role: "Sub" }],
  },
  {
    match: "doxorubicin",
    annotations: [{ system: "P-gp", role: "Sub" }],
  },
  {
    match: "vincristine",
    annotations: [{ system: "P-gp", role: "Sub" }],
  },
  {
    match: "methotrexate",
    annotations: [{ system: "P-gp", role: "Sub" }],
  },
  {
    match: "fexofenadine",
    annotations: [{ system: "P-gp", role: "Sub" }],
  },
  {
    match: "ranolazine",
    annotations: [{ system: "P-gp", role: "Inh", note: "moderate" }],
  },
  {
    match: "ticagrelor",
    annotations: [{ system: "P-gp", role: "Inh", note: "moderate" }],
  },
];

function formatAnnotation(annotation: MetabolismAnnotation) {
  return `${annotation.system}: ${annotation.role}${annotation.note ? ` (${annotation.note})` : ""}`;
}

function isClickableAnnotation(annotation: MetabolismAnnotation) {
  return annotation.role === "Sub" && (annotation.system.startsWith("CYP") || annotation.system === "P-gp");
}

export function getDrugMetabolismTags(name: string): DrugMetabolismTag[] {
  const normalized = normalizeDrugName(name);
  const seen = new Set<string>();
  const tags: DrugMetabolismTag[] = [];

  for (const entry of METABOLISM_ENTRIES) {
    if (!normalized.includes(entry.match)) {
      continue;
    }

    for (const annotation of entry.annotations) {
      const label = formatAnnotation(annotation);
      if (seen.has(label)) {
        continue;
      }
      seen.add(label);
      tags.push({
        id: `${annotation.system}:${annotation.role}:${annotation.note ?? ""}`,
        system: annotation.system,
        label,
        clickable: isClickableAnnotation(annotation),
      });
    }
  }

  return tags;
}

export function getDrugMetabolismAnnotations(name: string) {
  return getDrugMetabolismTags(name).map((tag) => tag.label);
}

function formatReferenceLabel(match: string, role: string, note?: string) {
  const prettyDrug = match
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
  return `${prettyDrug} · ${role}${note ? ` (${note})` : ""}`;
}

export function getMetabolismReference(system: string): MetabolismReference {
  const inhibitors: string[] = [];
  const inducers: string[] = [];
  const inhibitorSeen = new Set<string>();
  const inducerSeen = new Set<string>();

  for (const entry of METABOLISM_ENTRIES) {
    for (const annotation of entry.annotations) {
      if (annotation.system !== system) {
        continue;
      }

      const label = formatReferenceLabel(entry.match, annotation.role, annotation.note);

      if (annotation.role.includes("Inh") && !inhibitorSeen.has(label)) {
        inhibitorSeen.add(label);
        inhibitors.push(label);
      }

      if (annotation.role.includes("Ind") && !inducerSeen.has(label)) {
        inducerSeen.add(label);
        inducers.push(label);
      }
    }
  }

  return {
    system,
    inhibitors,
    inducers,
  };
}
