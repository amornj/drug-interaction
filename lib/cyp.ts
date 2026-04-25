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
      { system: "CYP3A4", role: "Weak Inh" },
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
      { system: "CYP2C19", role: "Moderate Inh" },
      { system: "P-gp", role: "Inh", note: "moderate" },
    ],
  },
  {
    match: "ciprofloxacin",
    annotations: [{ system: "CYP3A4", role: "Moderate Inh" }, { system: "CYP1A2", role: "Strong Inh" }],
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
      { system: "CYP3A4", role: "Moderate Ind" },
      { system: "CYP2B6", role: "Sub" },
      { system: "CYP2C9", role: "Moderate Ind" },
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
  { match: "fluoxetine", annotations: [{ system: "CYP2D6", role: "Sub" }, { system: "CYP2D6", role: "Strong Inh" }, { system: "CYP2C19", role: "Weak Inh" }, { system: "CYP2C9", role: "Moderate Inh" }] },
  { match: "aripiprazole", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "dextromethorphan", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "bupropion", annotations: [{ system: "CYP2D6", role: "Strong Inh" }, { system: "CYP2B6", role: "Sub" }] },
  { match: "quinidine", annotations: [{ system: "CYP2D6", role: "Strong Inh" }, { system: "P-gp", role: "Sub" }] },
  { match: "sertraline", annotations: [{ system: "CYP2D6", role: "Moderate Inh" }, { system: "CYP2C9", role: "Weak Inh" }, { system: "CYP2C19", role: "Weak Inh" }, { system: "CYP2B6", role: "Moderate Inh" }] },
  { match: "terbinafine", annotations: [{ system: "CYP2D6", role: "Moderate Inh" }] },
  {
    match: "cimetidine",
    annotations: [
      { system: "CYP2D6", role: "Moderate Inh" },
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
    annotations: [{ system: "CYP2C9", role: "Moderate Inh" }, { system: "CYP2C19", role: "Weak Inh" }, { system: "CYP2E1", role: "Strong Ind" }, { system: "NAT2", role: "Met" }],
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
  { match: "voriconazole", annotations: [{ system: "CYP2C19", role: "Sub" }, { system: "CYP2C19", role: "Strong Inh" }, { system: "CYP3A4", role: "Strong Inh" }, { system: "CYP2C9", role: "Strong Inh" }, { system: "CYP2B6", role: "Weak Inh" }] },
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

  // PPIs and P-CABs
  { match: "vonoprazan", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "P-gp", role: "Sub" }] },
  { match: "pantoprazole", annotations: [{ system: "CYP2C19", role: "Sub" }, { system: "CYP3A4", role: "Sub", note: "minor" }] },
  {
    match: "lansoprazole",
    annotations: [
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP3A4", role: "Sub", note: "minor" },
      { system: "CYP2C19", role: "Moderate Inh" },
    ],
  },
  {
    match: "rabeprazole",
    annotations: [
      { system: "Non-enzymatic", role: "Major" },
      { system: "CYP2C19", role: "Sub", note: "partial" },
      { system: "CYP2C19", role: "Moderate Inh" },
    ],
  },

  // Antipsychotics
  {
    match: "thioridazine",
    annotations: [
      { system: "CYP2D6", role: "Sub" },
      { system: "CYP2D6", role: "Strong Inh" },
      { system: "CYP1A2", role: "Sub", note: "minor" },
    ],
  },
  { match: "chlorpromazine", annotations: [{ system: "CYP2D6", role: "Sub" }, { system: "CYP1A2", role: "Sub", note: "minor" }] },
  { match: "perphenazine", annotations: [{ system: "CYP2D6", role: "Sub" }, { system: "CYP2D6", role: "Strong Inh" }] },
  { match: "ziprasidone", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "paliperidone", annotations: [{ system: "P-gp", role: "Sub" }, { system: "Renal elim", role: "Major" }] },

  // Antidepressants
  { match: "escitalopram", annotations: [{ system: "CYP2C19", role: "Sub" }, { system: "CYP2D6", role: "Sub", note: "minor" }] },
  { match: "mirtazapine", annotations: [{ system: "CYP1A2", role: "Sub" }, { system: "CYP3A4", role: "Sub" }, { system: "CYP2D6", role: "Sub", note: "minor" }] },
  { match: "trazodone", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2D6", role: "Sub", note: "minor" }] },
  { match: "desvenlafaxine", annotations: [{ system: "UGT", role: "Met" }, { system: "Renal elim", role: "Partial" }] },
  { match: "levomilnacipran", annotations: [{ system: "CYP3A4", role: "Sub" }] },

  // Opioids
  {
    match: "methadone",
    annotations: [
      { system: "CYP2B6", role: "Sub" },
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2D6", role: "Sub", note: "minor" },
    ],
  },
  { match: "buprenorphine", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "UGT", role: "Met" }] },
  { match: "hydrocodone", annotations: [{ system: "CYP2D6", role: "Sub", note: "→hydromorphone" }, { system: "CYP3A4", role: "Sub" }] },
  { match: "naloxone", annotations: [{ system: "UGT", role: "Met" }] },
  { match: "naltrexone", annotations: [{ system: "UGT", role: "Met" }] },

  // Corticosteroids
  { match: "dexamethasone", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "methylprednisolone", annotations: [{ system: "CYP3A4", role: "Sub" }] },

  // Beta-blockers and cardiovascular
  { match: "bisoprolol", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2D6", role: "Sub", note: "minor" }] },
  { match: "atenolol", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "lisinopril", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "enalapril", annotations: [{ system: "Esterase", role: "Prodrug" }, { system: "Renal elim", role: "Major" }] },
  { match: "ramipril", annotations: [{ system: "Esterase", role: "Prodrug" }, { system: "Renal elim", role: "Major" }] },
  { match: "perindopril", annotations: [{ system: "Esterase", role: "Prodrug" }, { system: "Renal elim", role: "Major" }] },

  // Oral antidiabetics
  { match: "glimepiride", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "gliclazide", annotations: [{ system: "CYP2C9", role: "Sub" }, { system: "CYP3A4", role: "Sub", note: "minor" }] },
  { match: "pioglitazone", annotations: [{ system: "CYP2C8", role: "Sub" }, { system: "CYP3A4", role: "Sub", note: "minor" }] },
  { match: "sitagliptin", annotations: [{ system: "P-gp", role: "Sub" }, { system: "Renal elim", role: "Major" }] },
  { match: "empagliflozin", annotations: [{ system: "UGT", role: "Met" }, { system: "P-gp", role: "Sub" }] },
  { match: "dapagliflozin", annotations: [{ system: "UGT", role: "Met" }] },
  { match: "canagliflozin", annotations: [{ system: "UGT", role: "Met" }, { system: "P-gp", role: "Sub" }] },

  // Statins (non-CYP dominant)
  {
    match: "rosuvastatin",
    annotations: [
      { system: "CYP2C9", role: "Sub", note: "minor" },
      { system: "OATP1B1", role: "Transport" },
      { system: "BCRP", role: "Transport" },
    ],
  },
  { match: "pravastatin", annotations: [{ system: "OATP1B1", role: "Transport" }] },
  { match: "pitavastatin", annotations: [{ system: "OATP1B1", role: "Transport" }, { system: "BCRP", role: "Transport" }] },
  { match: "ezetimibe", annotations: [{ system: "UGT", role: "Met" }, { system: "P-gp", role: "Sub" }] },

  // Antibiotics and anti-infectives
  { match: "azithromycin", annotations: [{ system: "P-gp", role: "Sub" }] },
  { match: "vancomycin", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "levofloxacin", annotations: [{ system: "Renal elim", role: "Major" }] },

  // Anticonvulsants
  { match: "levetiracetam", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "pregabalin", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "gabapentin", annotations: [{ system: "Renal elim", role: "Major" }] },

  // Diuretics
  { match: "furosemide", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "hydrochlorothiazide", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "spironolactone", annotations: [{ system: "CYP3A4", role: "Sub" }] },

  // Cardiac myosin modulators
  { match: "mavacamten", annotations: [{ system: "CYP2C19", role: "Sub" }, { system: "CYP3A4", role: "Sub", note: "minor" }] },
  { match: "aficamten", annotations: [{ system: "CYP2C19", role: "Sub" }, { system: "CYP3A4", role: "Sub", note: "minor" }] },

  // Uricosurics / gout
  { match: "benzbromarone", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "febuxostat", annotations: [{ system: "Xanthine oxidase", role: "Pathway" }, { system: "UGT", role: "Met" }] },
];

const CYP_REFERENCE_ONLY_ENTRIES: MetabolismEntry[] = [
  { match: "rifabutin", annotations: [{ system: "CYP3A4", role: "Strong Ind" }] },
  { match: "rifapentine", annotations: [{ system: "CYP3A4", role: "Moderate Ind" }] },
  { match: "st john's wort", annotations: [{ system: "CYP3A4", role: "Strong Ind" }, { system: "CYP2D6", role: "Weak Ind" }, { system: "CYP2C19", role: "Strong Ind" }, { system: "CYP2C8", role: "Moderate Ind" }] },
  { match: "st johns wort", annotations: [{ system: "CYP3A4", role: "Strong Ind" }, { system: "CYP2D6", role: "Weak Ind" }, { system: "CYP2C19", role: "Strong Ind" }, { system: "CYP2C8", role: "Moderate Ind" }] },
  { match: "enzalutamide", annotations: [{ system: "CYP3A4", role: "Strong Ind" }, { system: "CYP2C9", role: "Strong Ind" }, { system: "CYP2C19", role: "Strong Ind" }] },
  { match: "mitotane", annotations: [{ system: "CYP3A4", role: "Strong Ind" }] },
  { match: "apalutamide", annotations: [{ system: "CYP3A4", role: "Strong Ind" }, { system: "CYP2C9", role: "Strong Ind" }] },
  { match: "bosentan", annotations: [{ system: "CYP3A4", role: "Moderate Ind" }, { system: "CYP2C9", role: "Moderate Ind" }, { system: "CYP2C8", role: "Moderate Ind" }, { system: "CYP1A2", role: "Moderate Ind" }] },
  { match: "etravirine", annotations: [{ system: "CYP3A4", role: "Moderate Ind" }, { system: "CYP2C9", role: "Moderate Inh" }, { system: "CYP2C19", role: "Strong Inh" }] },
  { match: "modafinil", annotations: [{ system: "CYP3A4", role: "Moderate Ind" }, { system: "CYP1A2", role: "Weak Ind" }, { system: "CYP2C19", role: "Strong Inh" }] },
  { match: "nafcillin", annotations: [{ system: "CYP3A4", role: "Moderate Ind" }, { system: "CYP1A2", role: "Moderate Ind" }] },
  { match: "rufinamide", annotations: [{ system: "CYP3A4", role: "Moderate Ind" }] },
  { match: "dabrafenib", annotations: [{ system: "CYP3A4", role: "Moderate Ind" }, { system: "CYP2C9", role: "Weak Ind" }, { system: "CYP2C19", role: "Weak Ind" }, { system: "CYP2C8", role: "Weak Ind" }] },
  { match: "lorlatinib", annotations: [{ system: "CYP3A4", role: "Moderate Ind" }, { system: "CYP2C9", role: "Weak Ind" }] },
  { match: "armodafinil", annotations: [{ system: "CYP3A4", role: "Weak Ind" }, { system: "CYP2C19", role: "Weak Inh" }] },
  { match: "clobazam", annotations: [{ system: "CYP3A4", role: "Weak Ind" }] },
  { match: "dexamethasone", annotations: [{ system: "CYP3A4", role: "Weak Ind" }, { system: "CYP2D6", role: "Strong Ind" }, { system: "CYP2B6", role: "Weak Ind" }] },
  { match: "pioglitazone", annotations: [{ system: "CYP3A4", role: "Weak Ind" }, { system: "CYP2C19", role: "Moderate Ind" }] },
  { match: "artemisinin", annotations: [{ system: "CYP3A4", role: "Weak Ind" }, { system: "CYP2C19", role: "Moderate Ind" }, { system: "CYP2B6", role: "Moderate Ind" }] },
  { match: "ertugliflozin", annotations: [{ system: "CYP3A4", role: "Weak Ind" }] },
  { match: "pexidartinib", annotations: [{ system: "CYP3A4", role: "Weak Ind" }] },
  { match: "posaconazole", annotations: [{ system: "CYP3A4", role: "Strong Inh" }] },
  { match: "nelfinavir", annotations: [{ system: "CYP3A4", role: "Strong Inh" }, { system: "CYP2B6", role: "Moderate Inh" }] },
  { match: "nefazodone", annotations: [{ system: "CYP3A4", role: "Strong Inh" }] },
  { match: "grapefruit juice", annotations: [{ system: "CYP3A4", role: "Strong Inh" }] },
  { match: "idelalisib", annotations: [{ system: "CYP3A4", role: "Strong Inh" }] },
  { match: "tucatinib", annotations: [{ system: "CYP3A4", role: "Strong Inh" }] },
  { match: "aprepitant", annotations: [{ system: "CYP3A4", role: "Moderate Inh" }, { system: "CYP2C9", role: "Moderate Ind" }] },
  { match: "crizotinib", annotations: [{ system: "CYP3A4", role: "Moderate Inh" }] },
  { match: "dronedarone", annotations: [{ system: "CYP3A4", role: "Moderate Inh" }, { system: "CYP2D6", role: "Moderate Inh" }] },
  { match: "imatinib", annotations: [{ system: "CYP3A4", role: "Moderate Inh" }] },
  { match: "nilotinib", annotations: [{ system: "CYP3A4", role: "Moderate Inh" }] },
  { match: "tofacitinib", annotations: [{ system: "CYP3A4", role: "Moderate Inh" }] },
  { match: "cinacalcet", annotations: [{ system: "CYP2D6", role: "Strong Inh" }] },
  { match: "darifenacin", annotations: [{ system: "CYP2D6", role: "Strong Inh" }] },
  { match: "perphenazine", annotations: [{ system: "CYP2D6", role: "Strong Inh" }] },
  { match: "mirabegron", annotations: [{ system: "CYP2D6", role: "Moderate Inh" }] },
  { match: "abiraterone", annotations: [{ system: "CYP2D6", role: "Moderate Inh" }] },
  { match: "lorcaserin", annotations: [{ system: "CYP2D6", role: "Moderate Inh" }] },
  { match: "clomipramine", annotations: [{ system: "CYP2D6", role: "Weak Inh" }] },
  { match: "methadone", annotations: [{ system: "CYP2D6", role: "Weak Inh" }] },
  { match: "moclobemide", annotations: [{ system: "CYP2D6", role: "Weak Inh" }] },
  { match: "ranitidine", annotations: [{ system: "CYP2D6", role: "Weak Inh" }] },
  { match: "miconazole", annotations: [{ system: "CYP2C9", role: "Strong Inh" }] },
  { match: "sulfinpyrazone", annotations: [{ system: "CYP2C9", role: "Strong Inh" }] },
  { match: "capecitabine", annotations: [{ system: "CYP2C9", role: "Strong Inh" }] },
  { match: "oxandrolone", annotations: [{ system: "CYP2C9", role: "Moderate Inh" }] },
  { match: "zafirlukast", annotations: [{ system: "CYP2C9", role: "Moderate Inh" }] },
  { match: "piperine", annotations: [{ system: "CYP2C9", role: "Moderate Inh" }] },
  { match: "cotrimoxazole", annotations: [{ system: "CYP2C9", role: "Weak Inh" }] },
  { match: "fenofibrate", annotations: [{ system: "CYP2C9", role: "Weak Inh" }] },
  { match: "ticlopidine", annotations: [{ system: "CYP2C19", role: "Strong Inh" }, { system: "CYP2B6", role: "Strong Inh" }] },
  { match: "chloramphenicol", annotations: [{ system: "CYP2C19", role: "Moderate Inh" }] },
  { match: "felbamate", annotations: [{ system: "CYP2C19", role: "Moderate Inh" }] },
  { match: "lansoprazole", annotations: [{ system: "CYP2C19", role: "Moderate Inh" }] },
  { match: "rabeprazole", annotations: [{ system: "CYP2C19", role: "Moderate Inh" }] },
  { match: "indomethacin", annotations: [{ system: "CYP2C19", role: "Weak Inh" }] },
  { match: "enoxacin", annotations: [{ system: "CYP1A2", role: "Strong Inh" }] },
  { match: "rofecoxib", annotations: [{ system: "CYP1A2", role: "Strong Inh" }] },
  { match: "norfloxacin", annotations: [{ system: "CYP1A2", role: "Moderate Inh" }] },
  { match: "phenylpropanolamine", annotations: [{ system: "CYP1A2", role: "Moderate Inh" }] },
  { match: "thiabendazole", annotations: [{ system: "CYP1A2", role: "Moderate Inh" }] },
  { match: "zileuton", annotations: [{ system: "CYP1A2", role: "Moderate Inh" }] },
  { match: "vemurafenib", annotations: [{ system: "CYP1A2", role: "Moderate Inh" }] },
  { match: "acyclovir", annotations: [{ system: "CYP1A2", role: "Weak Inh" }] },
  { match: "allopurinol", annotations: [{ system: "CYP1A2", role: "Weak Inh" }] },
  { match: "ethinyl estradiol", annotations: [{ system: "CYP1A2", role: "Weak Inh" }] },
  { match: "mexiletine", annotations: [{ system: "CYP1A2", role: "Weak Inh" }] },
  { match: "oral contraceptives", annotations: [{ system: "CYP1A2", role: "Weak Inh" }] },
  { match: "cigarette smoking", annotations: [{ system: "CYP1A2", role: "Strong Ind" }] },
  { match: "charbroiled meat", annotations: [{ system: "CYP1A2", role: "Strong Ind" }] },
  { match: "cruciferous vegetables", annotations: [{ system: "CYP1A2", role: "Moderate Ind" }] },
  { match: "insulin", annotations: [{ system: "CYP1A2", role: "Moderate Ind" }] },
  { match: "moricizine", annotations: [{ system: "CYP1A2", role: "Moderate Ind" }] },
  { match: "broccoli", annotations: [{ system: "CYP1A2", role: "Weak Ind" }] },
  { match: "teriflunomide", annotations: [{ system: "CYP1A2", role: "Weak Ind" }, { system: "CYP2C8", role: "Moderate Inh" }] },
  { match: "ethanol chronic", annotations: [{ system: "CYP2E1", role: "Strong Ind" }] },
  { match: "acetone", annotations: [{ system: "CYP2E1", role: "Strong Ind" }] },
  { match: "pyrazole", annotations: [{ system: "CYP2E1", role: "Strong Ind" }] },
  { match: "benzene", annotations: [{ system: "CYP2E1", role: "Moderate Ind" }] },
  { match: "obesity/fasting", annotations: [{ system: "CYP2E1", role: "Moderate Ind" }] },
  { match: "toluene", annotations: [{ system: "CYP2E1", role: "Moderate Ind" }] },
  { match: "styrene", annotations: [{ system: "CYP2E1", role: "Moderate Ind" }] },
  { match: "diabetes uncontrolled", annotations: [{ system: "CYP2E1", role: "Weak Ind" }] },
  { match: "high-fat diet", annotations: [{ system: "CYP2E1", role: "Weak Ind" }] },
  { match: "diethyldithiocarbamate", annotations: [{ system: "CYP2E1", role: "Strong Inh" }] },
  { match: "4-methylpyrazole", annotations: [{ system: "CYP2E1", role: "Strong Inh" }] },
  { match: "fomepizole", annotations: [{ system: "CYP2E1", role: "Strong Inh" }] },
  { match: "clomethiazole", annotations: [{ system: "CYP2E1", role: "Moderate Inh" }] },
  { match: "dimethyl sulfoxide", annotations: [{ system: "CYP2E1", role: "Moderate Inh" }] },
  { match: "watercress", annotations: [{ system: "CYP2E1", role: "Moderate Inh" }] },
  { match: "phenethyl isothiocyanate", annotations: [{ system: "CYP2E1", role: "Weak Inh" }] },
  { match: "diallyl sulfide", annotations: [{ system: "CYP2E1", role: "Weak Inh" }] },
  { match: "thiotepa", annotations: [{ system: "CYP2B6", role: "Strong Inh" }] },
  { match: "prasugrel", annotations: [{ system: "CYP2B6", role: "Strong Inh" }] },
  { match: "nevirapine", annotations: [{ system: "CYP2B6", role: "Strong Ind" }] },
  { match: "cyclophosphamide", annotations: [{ system: "CYP2B6", role: "Moderate Ind" }] },
  { match: "gemfibrozil", annotations: [{ system: "CYP2C8", role: "Strong Inh" }] },
  { match: "trimethoprim", annotations: [{ system: "CYP2C8", role: "Strong Inh" }] },
  { match: "deferasirox", annotations: [{ system: "CYP2C8", role: "Strong Inh" }] },
  { match: "quercetin", annotations: [{ system: "CYP2C8", role: "Weak Inh" }] },
  { match: "montelukast", annotations: [{ system: "CYP2C8", role: "Weak Inh" }] },
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

  for (const entry of [...METABOLISM_ENTRIES, ...CYP_REFERENCE_ONLY_ENTRIES]) {
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

  for (const entry of [...METABOLISM_ENTRIES, ...CYP_REFERENCE_ONLY_ENTRIES]) {
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
