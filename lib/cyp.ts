type CypAnnotation = {
  enzyme: string;
  role: string;
  note?: string;
};

type CypEntry = {
  match: string;
  annotations: CypAnnotation[];
};

function normalizeDrugName(name: string) {
  return name.toLowerCase().replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

const CYP_ENTRIES: CypEntry[] = [
  { match: "simvastatin", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "atorvastatin", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "lovastatin", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "amlodipine", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  {
    match: "nifedipine",
    annotations: [{ enzyme: "CYP3A4", role: "Sub" }],
  },
  {
    match: "verapamil",
    annotations: [
      { enzyme: "CYP3A4", role: "Sub" },
      { enzyme: "CYP3A4", role: "Moderate Inh" },
    ],
  },
  {
    match: "diltiazem",
    annotations: [
      { enzyme: "CYP3A4", role: "Sub" },
      { enzyme: "CYP3A4", role: "Moderate Inh" },
    ],
  },
  { match: "apixaban", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "rivaroxaban", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "tacrolimus", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "cyclosporine", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "midazolam", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "triazolam", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "fentanyl", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "oxycodone", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "sildenafil", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "tadalafil", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "quetiapine", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "lurasidone", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  {
    match: "carbamazepine",
    annotations: [
      { enzyme: "CYP3A4", role: "Sub" },
      { enzyme: "CYP3A4", role: "Moderate Ind" },
      { enzyme: "CYP2C9", role: "Ind" },
      { enzyme: "CYP2C19", role: "Ind" },
      { enzyme: "CYP1A2", role: "Moderate Ind" },
      { enzyme: "CYP2B6", role: "Ind" },
    ],
  },
  { match: "diazepam", annotations: [{ enzyme: "CYP3A4", role: "Sub" }, { enzyme: "CYP2C19", role: "Sub" }] },
  { match: "alprazolam", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "prednisone", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "prednisolone", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  {
    match: "amiodarone",
    annotations: [
      { enzyme: "CYP3A4", role: "Sub" },
      { enzyme: "CYP3A4", role: "Moderate Inh" },
      { enzyme: "CYP2C9", role: "Strong Inh" },
    ],
  },
  { match: "eplerenone", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "buspirone", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "zolpidem", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "domperidone", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "ivabradine", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "lidocaine", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "estradiol", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "ondansetron", annotations: [{ enzyme: "CYP3A4", role: "Sub" }, { enzyme: "CYP2D6", role: "Sub" }] },
  { match: "ergotamine", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "colchicine", annotations: [{ enzyme: "CYP3A4", role: "Sub" }] },
  { match: "ritonavir", annotations: [{ enzyme: "CYP3A4", role: "Strong Inh" }] },
  { match: "cobicistat", annotations: [{ enzyme: "CYP3A4", role: "Strong Inh" }] },
  { match: "ketoconazole", annotations: [{ enzyme: "CYP3A4", role: "Strong Inh" }] },
  { match: "itraconazole", annotations: [{ enzyme: "CYP3A4", role: "Strong Inh" }] },
  { match: "clarithromycin", annotations: [{ enzyme: "CYP3A4", role: "Strong Inh" }] },
  { match: "erythromycin", annotations: [{ enzyme: "CYP3A4", role: "Moderate Inh" }] },
  {
    match: "fluconazole",
    annotations: [
      { enzyme: "CYP3A4", role: "Moderate Inh" },
      { enzyme: "CYP2C9", role: "Strong Inh" },
    ],
  },
  { match: "ciprofloxacin", annotations: [{ enzyme: "CYP3A4", role: "Weak Inh" }, { enzyme: "CYP1A2", role: "Strong Inh" }] },
  { match: "rifampin", annotations: [{ enzyme: "CYP3A4", role: "Strong Ind" }, { enzyme: "CYP2C9", role: "Ind" }, { enzyme: "CYP2C19", role: "Ind" }, { enzyme: "CYP1A2", role: "Moderate Ind" }, { enzyme: "CYP2B6", role: "Ind" }, { enzyme: "CYP2A6", role: "Ind" }] },
  { match: "phenytoin", annotations: [{ enzyme: "CYP3A4", role: "Moderate Ind" }, { enzyme: "CYP2C9", role: "Sub" }, { enzyme: "CYP2C9", role: "Ind" }, { enzyme: "CYP2C19", role: "Sub" }, { enzyme: "CYP2C19", role: "Ind" }] },
  { match: "phenobarbital", annotations: [{ enzyme: "CYP3A4", role: "Moderate Ind" }, { enzyme: "CYP2C9", role: "Ind" }, { enzyme: "CYP2B6", role: "Ind" }] },
  { match: "efavirenz", annotations: [{ enzyme: "CYP3A4", role: "Weak Ind" }, { enzyme: "CYP2B6", role: "Sub" }] },
  {
    match: "codeine",
    annotations: [{ enzyme: "CYP2D6", role: "Sub", note: "PGx, prodrug" }],
  },
  {
    match: "tramadol",
    annotations: [{ enzyme: "CYP2D6", role: "Sub", note: "PGx, prodrug" }],
  },
  { match: "metoprolol", annotations: [{ enzyme: "CYP2D6", role: "Sub" }] },
  { match: "propranolol", annotations: [{ enzyme: "CYP2D6", role: "Sub" }] },
  { match: "amitriptyline", annotations: [{ enzyme: "CYP2D6", role: "Sub" }] },
  { match: "nortriptyline", annotations: [{ enzyme: "CYP2D6", role: "Sub" }] },
  { match: "venlafaxine", annotations: [{ enzyme: "CYP2D6", role: "Sub" }] },
  { match: "risperidone", annotations: [{ enzyme: "CYP2D6", role: "Sub" }] },
  { match: "haloperidol", annotations: [{ enzyme: "CYP2D6", role: "Sub" }] },
  { match: "flecainide", annotations: [{ enzyme: "CYP2D6", role: "Sub" }] },
  { match: "propafenone", annotations: [{ enzyme: "CYP2D6", role: "Sub" }] },
  {
    match: "tamoxifen",
    annotations: [{ enzyme: "CYP2D6", role: "Sub", note: "PGx, prodrug" }],
  },
  { match: "carvedilol", annotations: [{ enzyme: "CYP2D6", role: "Sub" }] },
  { match: "duloxetine", annotations: [{ enzyme: "CYP2D6", role: "Sub" }, { enzyme: "CYP2D6", role: "Moderate Inh" }] },
  {
    match: "paroxetine",
    annotations: [{ enzyme: "CYP2D6", role: "Sub" }, { enzyme: "CYP2D6", role: "Strong Inh" }],
  },
  {
    match: "fluoxetine",
    annotations: [{ enzyme: "CYP2D6", role: "Sub" }, { enzyme: "CYP2D6", role: "Strong Inh" }, { enzyme: "CYP2C19", role: "Moderate Inh" }],
  },
  { match: "aripiprazole", annotations: [{ enzyme: "CYP2D6", role: "Sub" }] },
  { match: "dextromethorphan", annotations: [{ enzyme: "CYP2D6", role: "Sub" }] },
  { match: "bupropion", annotations: [{ enzyme: "CYP2D6", role: "Strong Inh" }, { enzyme: "CYP2B6", role: "Sub" }] },
  { match: "quinidine", annotations: [{ enzyme: "CYP2D6", role: "Strong Inh" }] },
  { match: "sertraline", annotations: [{ enzyme: "CYP2D6", role: "Moderate Inh" }] },
  { match: "terbinafine", annotations: [{ enzyme: "CYP2D6", role: "Moderate Inh" }] },
  { match: "cimetidine", annotations: [{ enzyme: "CYP2D6", role: "Weak Inh" }, { enzyme: "CYP2C19", role: "Weak Inh" }, { enzyme: "CYP1A2", role: "Moderate Inh" }] },
  { match: "warfarin", annotations: [{ enzyme: "CYP2C9", role: "Sub" }, { enzyme: "CYP1A2", role: "Sub", note: "minor" }] },
  { match: "diclofenac", annotations: [{ enzyme: "CYP2C9", role: "Sub" }] },
  { match: "ibuprofen", annotations: [{ enzyme: "CYP2C9", role: "Sub" }] },
  { match: "glyburide", annotations: [{ enzyme: "CYP2C9", role: "Sub" }] },
  { match: "glipizide", annotations: [{ enzyme: "CYP2C9", role: "Sub" }] },
  { match: "losartan", annotations: [{ enzyme: "CYP2C9", role: "Sub" }] },
  { match: "celecoxib", annotations: [{ enzyme: "CYP2C9", role: "Sub" }] },
  { match: "fluvastatin", annotations: [{ enzyme: "CYP2C9", role: "Sub" }] },
  { match: "tolbutamide", annotations: [{ enzyme: "CYP2C9", role: "Sub" }] },
  { match: "metronidazole", annotations: [{ enzyme: "CYP2C9", role: "Strong Inh" }] },
  { match: "trimethoprim sulfamethoxazole", annotations: [{ enzyme: "CYP2C9", role: "Strong Inh" }] },
  { match: "sulfamethoxazole trimethoprim", annotations: [{ enzyme: "CYP2C9", role: "Strong Inh" }] },
  { match: "valproate", annotations: [{ enzyme: "CYP2C9", role: "Moderate Inh" }] },
  { match: "isoniazid", annotations: [{ enzyme: "CYP2C9", role: "Moderate Inh" }, { enzyme: "CYP2E1", role: "Ind" }] },
  {
    match: "clopidogrel",
    annotations: [
      { enzyme: "CYP2C19", role: "Sub", note: "PGx, prodrug" },
      { enzyme: "CYP2B6", role: "Inh" },
    ],
  },
  {
    match: "omeprazole",
    annotations: [
      { enzyme: "CYP2C19", role: "Sub" },
      { enzyme: "CYP2C19", role: "Strong Inh" },
      { enzyme: "CYP2C9", role: "Weak Inh" },
    ],
  },
  {
    match: "esomeprazole",
    annotations: [
      { enzyme: "CYP2C19", role: "Sub" },
      { enzyme: "CYP2C19", role: "Strong Inh" },
    ],
  },
  { match: "citalopram", annotations: [{ enzyme: "CYP2C19", role: "Sub" }] },
  { match: "voriconazole", annotations: [{ enzyme: "CYP2C19", role: "Sub" }] },
  { match: "proguanil", annotations: [{ enzyme: "CYP2C19", role: "Sub" }] },
  { match: "fluvoxamine", annotations: [{ enzyme: "CYP2C19", role: "Moderate Inh" }, { enzyme: "CYP1A2", role: "Strong Inh" }] },
  { match: "theophylline", annotations: [{ enzyme: "CYP1A2", role: "Sub" }] },
  { match: "caffeine", annotations: [{ enzyme: "CYP1A2", role: "Sub" }] },
  { match: "clozapine", annotations: [{ enzyme: "CYP1A2", role: "Sub" }] },
  { match: "olanzapine", annotations: [{ enzyme: "CYP1A2", role: "Sub" }] },
  { match: "tizanidine", annotations: [{ enzyme: "CYP1A2", role: "Sub" }] },
  { match: "ropinirole", annotations: [{ enzyme: "CYP1A2", role: "Sub" }] },
  { match: "ketamine", annotations: [{ enzyme: "CYP2B6", role: "Sub" }] },
  { match: "ticlopidine", annotations: [{ enzyme: "CYP2B6", role: "Inh" }] },
  { match: "nicotine", annotations: [{ enzyme: "CYP2A6", role: "Sub" }] },
  { match: "coumarin", annotations: [{ enzyme: "CYP2A6", role: "Sub" }] },
  { match: "methoxsalen", annotations: [{ enzyme: "CYP2A6", role: "Inh" }] },
  { match: "ethanol", annotations: [{ enzyme: "CYP2E1", role: "Sub" }] },
  { match: "acetaminophen", annotations: [{ enzyme: "CYP2E1", role: "Sub", note: "minor" }] },
  { match: "paracetamol", annotations: [{ enzyme: "CYP2E1", role: "Sub", note: "minor" }] },
  { match: "halothane", annotations: [{ enzyme: "CYP2E1", role: "Sub" }] },
  { match: "disulfiram", annotations: [{ enzyme: "CYP2E1", role: "Inh" }] },
];

function formatAnnotation(annotation: CypAnnotation) {
  return `${annotation.enzyme}: ${annotation.role}${annotation.note ? ` (${annotation.note})` : ""}`;
}

export function getDrugCypAnnotations(name: string) {
  const normalized = normalizeDrugName(name);
  const seen = new Set<string>();
  const annotations: string[] = [];

  for (const entry of CYP_ENTRIES) {
    if (!normalized.includes(entry.match)) {
      continue;
    }

    for (const annotation of entry.annotations) {
      const formatted = formatAnnotation(annotation);
      if (seen.has(formatted)) {
        continue;
      }
      seen.add(formatted);
      annotations.push(formatted);
    }
  }

  return annotations;
}
