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
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
      { system: "OCT", role: "Moderate Inh", note: "weak-moderate OCT inhibition" },
    ],
  },
  {
    match: "diltiazem",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A4", role: "Moderate Inh" },
      { system: "P-gp", role: "Inh", note: "strong" },
      { system: "OCT", role: "Moderate Inh" },
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
      { system: "OAT", role: "Strong Inh", note: "multi-transporter inhibitor" },
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
      { system: "Epoxide hydrolase", role: "Sub", note: "major, carbamazepine-epoxide detox; prevents toxicity" },
    ],
  },
  { match: "diazepam", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2C19", role: "Sub" }] },
  { match: "alprazolam", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "dopamine", annotations: [{ system: "MAO-B", role: "Sub", note: "oxidative deamination; Parkinson relevance" }, { system: "COMT", role: "Sub", note: "methylation; fast, tissue-based" }] },
  { match: "epinephrine", annotations: [{ system: "MAO-A", role: "Sub", note: "oxidative deamination; fast, tissue-based" }, { system: "COMT", role: "Sub", note: "methylation; fast, tissue-based" }] },
  { match: "norepinephrine", annotations: [{ system: "MAO-A", role: "Sub", note: "oxidative deamination; CNS neurotransmitter metabolism" }] },
  { match: "serotonin", annotations: [{ system: "MAO-A", role: "Sub", note: "oxidative deamination; CNS neurotransmitter metabolism" }] },
  { match: "levodopa", annotations: [{ system: "MAO", role: "Sub", note: "deamination; fast, tissue-based" }, { system: "COMT", role: "Sub", note: "methylation; fast, tissue-based" }] },
  { match: "catecholamine", annotations: [{ system: "COMT", role: "Sub", note: "methylation" }] },
  { match: "entacapone", annotations: [{ system: "COMT", role: "Inh" }] },
  { match: "tolcapone", annotations: [{ system: "COMT", role: "Inh" }] },
  { match: "prednisone", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "prednisolone", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  {
    match: "amiodarone",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A4", role: "Weak Inh" },
      { system: "CYP2C9", role: "Strong Inh" },
      { system: "P-gp", role: "Inh", note: "strong" },
      { system: "OCT", role: "Moderate Inh", note: "broad PK interaction potential" },
    ],
  },
  { match: "eplerenone", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "buspirone", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "zolpidem", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "domperidone", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "ivabradine", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "lidocaine", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "estradiol", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "SULT", role: "Sub", note: "major, sulfation" }] },
  { match: "ondansetron", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2D6", role: "Sub" }] },
  { match: "ergotamine", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  {
    match: "colchicine",
    annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "P-gp", role: "Sub" }],
  },
  {
    match: "ritonavir",
    annotations: [{ system: "CYP3A4", role: "Strong Inh" }, { system: "P-gp", role: "Inh", note: "strong" }, { system: "OAT", role: "Strong Inh", note: "broad transporter and CYP effects" }],
  },
  { match: "cobicistat", annotations: [{ system: "CYP3A4", role: "Strong Inh" }, { system: "OAT", role: "Strong Inh", note: "also affects creatinine secretion" }] },
  {
    match: "ketoconazole",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A4", role: "Strong Inh" },
      { system: "CYP2C9", role: "Moderate Inh" },
      { system: "CYP2C19", role: "Moderate Inh" },
      { system: "CYP2D6", role: "Moderate Inh" },
      { system: "P-gp", role: "Inh", note: "strong" },
      { system: "UGT", role: "Weak Inh", note: "also affects UGT" },
      { system: "OCT", role: "Moderate Inh", note: "multi-pathway inhibitor" },
    ],
  },
  {
    match: "itraconazole",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A4", role: "Strong Inh" },
      { system: "P-gp", role: "Inh", note: "strong" },
    ],
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
      { system: "CYP2C9", role: "Moderate Inh" },
      { system: "CYP2C19", role: "Strong Inh" },
      { system: "P-gp", role: "Inh", note: "moderate" },
      { system: "UGT", role: "Moderate Inh", note: "mild–moderate UGT effect" },
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
      { system: "NAT2", role: "Weak Ind", note: "weak/indirect" },
      { system: "OAT", role: "Moderate Inh", note: "acute effect before induction" },
    ],
  },
  { match: "rifampicin", annotations: [{ system: "CYP3A4", role: "Strong Ind" }, { system: "OAT", role: "Moderate Inh", note: "acute effect before induction" }] },
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
      { system: "OCT", role: "Strong Inh", note: "prototype; increases metformin level" },
    ],
  },
  {
    match: "warfarin",
    annotations: [{ system: "CYP2C9", role: "Sub" }, { system: "CYP1A2", role: "Sub", note: "minor" }, { system: "Carbonyl reductase", role: "Sub", note: "minor reduction pathway" }],
  },
  { match: "diclofenac", annotations: [{ system: "CYP2C9", role: "Sub" }, { system: "UGT", role: "Moderate Inh", note: "competes for UGT pathways" }] },
  { match: "ibuprofen", annotations: [{ system: "CYP2C9", role: "Sub" }, { system: "OAT", role: "Sub" }, { system: "OAT", role: "Moderate Inh", note: "competes for renal secretion" }] },
  { match: "glyburide", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "glipizide", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "losartan", annotations: [{ system: "CYP2C9", role: "Sub", note: "major" }, { system: "CYP3A4", role: "Sub" }, { system: "OAT", role: "Moderate Inh" }] },
  { match: "celecoxib", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "fluvastatin", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "tolbutamide", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "metronidazole", annotations: [{ system: "CYP2C9", role: "Strong Inh" }, { system: "Nitroreductase", role: "Sub", note: "major, reduction; activated in anaerobic organisms" }] },
  { match: "trimethoprim sulfamethoxazole", annotations: [{ system: "CYP2C9", role: "Strong Inh" }, { system: "NAT2", role: "Sub", note: "major, acetylation" }] },
  { match: "sulfamethoxazole trimethoprim", annotations: [{ system: "CYP2C9", role: "Strong Inh" }, { system: "NAT2", role: "Sub", note: "major, acetylation" }] },
  { match: "valproate", annotations: [{ system: "CYP2C9", role: "Moderate Inh" }, { system: "UGT", role: "Strong Inh", note: "↑ lamotrigine, ↑ SJS risk" }, { system: "OAT", role: "Sub" }] },
  { match: "valproic acid", annotations: [{ system: "CYP2C9", role: "Moderate Inh" }, { system: "UGT", role: "Strong Inh", note: "↑ lamotrigine, ↑ SJS risk" }, { system: "OAT", role: "Sub" }] },
  {
    match: "isoniazid",
    annotations: [{ system: "CYP2C9", role: "Moderate Inh" }, { system: "CYP2C19", role: "Weak Inh" }, { system: "CYP2E1", role: "Strong Ind" }, { system: "NAT2", role: "Sub", note: "major, acetylation; PGx toxicity risk" }],
  },
  { match: "hydralazine", annotations: [{ system: "NAT2", role: "Sub", note: "major, acetylation" }] },
  { match: "procainamide", annotations: [{ system: "NAT2", role: "Sub", note: "major, acetylation" }] },
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
  {
    match: "voriconazole",
    annotations: [
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP2C9", role: "Sub" },
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2C19", role: "Strong Inh" },
      { system: "CYP2C9", role: "Strong Inh" },
      { system: "CYP3A4", role: "Strong Inh" },
    ],
  },
  { match: "proguanil", annotations: [{ system: "CYP2C19", role: "Sub" }] },
  {
    match: "fluvoxamine",
    annotations: [{ system: "CYP2C19", role: "Moderate Inh" }, { system: "CYP1A2", role: "Strong Inh" }],
  },
  { match: "theophylline", annotations: [{ system: "CYP1A2", role: "Sub" }] },
  { match: "caffeine", annotations: [{ system: "CYP1A2", role: "Sub" }] },
  { match: "clozapine", annotations: [{ system: "CYP1A2", role: "Sub" }, { system: "FMO", role: "Sub", note: "major, alternative to CYP oxidation" }] },
  { match: "olanzapine", annotations: [{ system: "CYP1A2", role: "Sub" }] },
  { match: "tizanidine", annotations: [{ system: "CYP1A2", role: "Sub" }] },
  { match: "ropinirole", annotations: [{ system: "CYP1A2", role: "Sub" }] },
  { match: "ketamine", annotations: [{ system: "CYP2B6", role: "Sub" }] },
  { match: "ticlopidine", annotations: [{ system: "CYP2B6", role: "Inh" }] },
  { match: "nicotine", annotations: [{ system: "CYP2A6", role: "Sub" }, { system: "FMO", role: "Sub", note: "major, alternative oxidation pathway" }] },
  { match: "coumarin", annotations: [{ system: "CYP2A6", role: "Sub" }] },
  { match: "methoxsalen", annotations: [{ system: "CYP2A6", role: "Inh" }] },
  { match: "ethanol", annotations: [{ system: "Alcohol dehydrogenase", role: "Sub", note: "major; alcohol → acetaldehyde" }, { system: "CYP2E1", role: "Sub", note: "minor" }] },
  { match: "methanol", annotations: [{ system: "Alcohol dehydrogenase", role: "Sub", note: "major; alcohol → aldehyde" }] },
  { match: "ethylene glycol", annotations: [{ system: "Alcohol dehydrogenase", role: "Sub", note: "major; alcohol → aldehyde" }] },
  { match: "propylene glycol", annotations: [{ system: "Alcohol dehydrogenase", role: "Sub", note: "major; alcohol → aldehyde" }] },
  {
    match: "acetaminophen",
    annotations: [{ system: "CYP2E1", role: "Sub", note: "minor" }, { system: "UGT", role: "Sub", note: "major, glucuronidation" }, { system: "SULT", role: "Sub", note: "major, sulfation" }, { system: "GST", role: "Sub", note: "major, NAPQI detox; depleted in overdose / malnutrition / alcohol" }],
  },
  {
    match: "paracetamol",
    annotations: [{ system: "CYP2E1", role: "Sub", note: "minor" }, { system: "UGT", role: "Sub", note: "major, glucuronidation" }, { system: "SULT", role: "Sub", note: "major, sulfation" }, { system: "GST", role: "Sub", note: "major, NAPQI detox; depleted in overdose / malnutrition / alcohol" }],
  },
  { match: "halothane", annotations: [{ system: "CYP2E1", role: "Sub" }] },
  { match: "disulfiram", annotations: [{ system: "CYP2E1", role: "Inh" }, { system: "Aldehyde dehydrogenase", role: "Inh", note: "target enzyme; causes acetaldehyde accumulation" }] },
  { match: "morphine", annotations: [{ system: "UGT", role: "Sub", note: "major, UGT2B7, active metabolite M6G" }] },
  { match: "lorazepam", annotations: [{ system: "UGT", role: "Sub", note: "major, glucuronidation, safe in liver disease / elderly" }] },
  { match: "lamotrigine", annotations: [{ system: "UGT", role: "Sub", note: "major, UGT1A4, valproate increases level → SJS risk" }] },
  { match: "hydromorphone", annotations: [{ system: "UGT", role: "Sub", note: "major, renal metabolite accumulation" }] },
  { match: "oxymorphone", annotations: [{ system: "UGT", role: "Sub", note: "major, less CYP interaction" }] },
  { match: "oxazepam", annotations: [{ system: "UGT", role: "Sub", note: "major, glucuronidation, no CYP interaction" }] },
  { match: "temazepam", annotations: [{ system: "UGT", role: "Sub", note: "major, glucuronidation, predictable PK" }] },
  { match: "propofol", annotations: [{ system: "CYP2B6", role: "Sub" }, { system: "CYP2C9", role: "Sub" }, { system: "UGT1A9", role: "Sub", note: "major, rapid clearance" }] },
  { match: "cisatracurium", annotations: [{ system: "Hofmann", role: "Sub", note: "primary substrate; Hofmann elimination, more stable than atracurium, less histamine" }] },
  { match: "azathioprine", annotations: [{ system: "TPMT", role: "Sub", note: "major, methylation" }, { system: "Xanthine oxidase", role: "Sub", note: "oxidation metabolism; allopurinol inhibits → ↑ toxicity" }] },
  { match: "6-mercaptopurine", annotations: [{ system: "TPMT", role: "Sub", note: "major, methylation" }, { system: "Xanthine oxidase", role: "Sub", note: "oxidation metabolism; allopurinol inhibits → ↑ toxicity" }] },
  { match: "allopurinol", annotations: [{ system: "Xanthine oxidase", role: "Inh" }] },
  { match: "remifentanil", annotations: [{ system: "Plasma esterase", role: "Sub", note: "non-specific esterase hydrolysis; ultra-short action, rapid offset regardless of liver function" }] },
  { match: "esmolol", annotations: [{ system: "Esterase", role: "Sub", note: "plasma/RBC hydrolysis; very fast, organ-independent" }] },
  { match: "succinylcholine", annotations: [{ system: "Plasma cholinesterase", role: "Sub", note: "depolarizing NMBA; rapid hydrolysis in plasma; prolonged apnea in deficiency" }] },
  { match: "linezolid", annotations: [{ system: "Non-enzymatic oxidation", role: "Sub", note: "spontaneous oxidation of morpholine ring; minimal CYP450 interaction risk" }] },
  { match: "thalidomide", annotations: [{ system: "Non-enzymatic hydrolysis", role: "Sub", note: "spontaneous breakdown in plasma; highly predictable half-life" }] },
  { match: "atracurium", annotations: [{ system: "Hofmann", role: "Sub", note: "primary substrate; Hofmann elimination + esterase hydrolysis; organ-independent" }] },
  { match: "doxacurium", annotations: [{ system: "Hofmann", role: "Sub", note: "minor substrate; mostly renal elimination" }] },
  { match: "mivacurium", annotations: [{ system: "Hofmann", role: "Sub", note: "minor substrate; mainly ester hydrolysis" }, { system: "Plasma cholinesterase", role: "Sub", note: "non-depolarizing NMBA; ester hydrolysis; prolonged in deficiency" }] },
  { match: "tetracaine", annotations: [{ system: "Plasma cholinesterase", role: "Sub", note: "ester local anesthetic; slower hydrolysis → longer acting" }] },
  { match: "cocaine", annotations: [{ system: "Plasma cholinesterase", role: "Sub", note: "ester anesthetic; hydrolyzed in plasma & liver; toxicity if enzyme impaired" }] },
  { match: "heroin", annotations: [{ system: "Plasma cholinesterase", role: "Sub", note: "opioid ester; rapid deacetylation → morphine" }] },
  { match: "procaine", annotations: [{ system: "Plasma cholinesterase", role: "Sub", note: "ester local anesthetic; rapid hydrolysis → short duration" }] },
  { match: "chloroprocaine", annotations: [{ system: "Plasma cholinesterase", role: "Sub", note: "ester local anesthetic; very rapid hydrolysis → ultra-short acting" }] },
  { match: "neostigmine", annotations: [{ system: "Plasma cholinesterase", role: "Inh", note: "moderate; reversible cholinesterase inhibition → prolongs succinylcholine" }] },
  { match: "physostigmine", annotations: [{ system: "Plasma cholinesterase", role: "Inh", note: "moderate; reversible inhibition → similar effect" }] },
  { match: "echothiophate", annotations: [{ system: "Plasma cholinesterase", role: "Inh", note: "strong; irreversible inhibitor → marked prolongation" }] },
  { match: "organophosphates", annotations: [{ system: "Plasma cholinesterase", role: "Inh", note: "strong irreversible; phosphorylate enzyme → severe prolongation of succinylcholine" }] },
  { match: "oral contraceptives", annotations: [{ system: "CYP1A2", role: "Weak Inh" }, { system: "Plasma cholinesterase", role: "Inh", note: "mild; reduce enzyme synthesis → clinically mild effect" }] },
  { match: "aspirin", annotations: [{ system: "Esterase", role: "Rapid hydrolysis" }, { system: "UGT", role: "Sub", note: "major, glycine conjugation + glucuronidation, saturable kinetics" }, { system: "SULT", role: "Inh", note: "salicylates inhibit sulfation; substrate competition at high dose" }, { system: "OAT", role: "Sub" }] },
  { match: "salbutamol", annotations: [{ system: "SULT", role: "Sub", note: "major, sulfation" }] },
  { match: "albuterol", annotations: [{ system: "SULT", role: "Sub", note: "major, sulfation" }] },
  {
    match: "metformin",
    annotations: [{ system: "Renal elim", role: "Major" }, { system: "OCT", role: "Sub", note: "major, renal tubular secretion" }],
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
    annotations: [{ system: "P-gp", role: "Sub" }, { system: "OAT", role: "Sub", note: "most clinically dangerous substrate" }],
  },
  {
    match: "fexofenadine",
    annotations: [{ system: "P-gp", role: "Sub" }],
  },
  {
    match: "ranolazine",
    annotations: [{ system: "P-gp", role: "Inh", note: "moderate" }, { system: "OCT", role: "Strong Inh", note: "increases metformin exposure" }],
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
  { match: "sitagliptin", annotations: [{ system: "CYP3A4", role: "Sub", note: "minor" }, { system: "CYP2C8", role: "Sub" }, { system: "Renal elim", role: "Major" }] },
  { match: "empagliflozin", annotations: [{ system: "UGT", role: "Met" }, { system: "P-gp", role: "Sub" }] },
  { match: "dapagliflozin", annotations: [{ system: "UGT", role: "Met" }] },
  { match: "canagliflozin", annotations: [{ system: "UGT", role: "Met" }, { system: "P-gp", role: "Sub" }] },

  // Statins (non-CYP dominant)
  {
    match: "rosuvastatin",
    annotations: [
      { system: "CYP2C9", role: "Sub", note: "minor" },
      { system: "OAT", role: "Sub", note: "OATP1B1 substrate" },
      { system: "BCRP", role: "Transport" },
    ],
  },
  { match: "pravastatin", annotations: [{ system: "OAT", role: "Sub", note: "OATP1B1 substrate" }] },
  { match: "pitavastatin", annotations: [{ system: "OAT", role: "Sub", note: "OATP1B1 substrate" }, { system: "BCRP", role: "Transport" }] },
  { match: "ezetimibe", annotations: [{ system: "UGT", role: "Sub", note: "major, recycling prolongs effect" }, { system: "P-gp", role: "Sub" }] },

  // Antibiotics and anti-infectives
  { match: "azithromycin", annotations: [{ system: "P-gp", role: "Sub" }] },
  { match: "vancomycin", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "levofloxacin", annotations: [{ system: "Renal elim", role: "Major" }] },

  // Anticonvulsants
  { match: "levetiracetam", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "pregabalin", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "gabapentin", annotations: [{ system: "Renal elim", role: "Major" }] },

  // Diuretics
  { match: "furosemide", annotations: [{ system: "Renal elim", role: "Major" }, { system: "OAT", role: "Sub" }, { system: "OAT", role: "Moderate Inh", note: "substrate and inhibitor" }] },
  { match: "hydrochlorothiazide", annotations: [{ system: "Renal elim", role: "Major" }, { system: "OAT", role: "Sub" }, { system: "OAT", role: "Moderate Inh" }] },
  { match: "spironolactone", annotations: [{ system: "CYP3A4", role: "Sub" }] },

  // Cardiac myosin modulators
  { match: "mavacamten", annotations: [{ system: "CYP2C19", role: "Sub" }, { system: "CYP3A4", role: "Sub", note: "minor" }] },
  { match: "aficamten", annotations: [{ system: "CYP2C19", role: "Sub" }, { system: "CYP3A4", role: "Sub", note: "minor" }] },

  // Uricosurics / gout
  { match: "benzbromarone", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "febuxostat", annotations: [{ system: "Xanthine oxidase", role: "Inh", note: "strong; ↑ 6-MP / azathioprine → myelosuppression risk" }, { system: "UGT", role: "Sub", note: "major" }] },
  { match: "thioguanine", annotations: [{ system: "Xanthine oxidase", role: "Sub", note: "minor pathway" }] },

  // ── A ──
  { match: "abacavir", annotations: [{ system: "ADH", role: "Met" }, { system: "UGT", role: "Met" }] },
  { match: "abemaciclib", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP3A4", role: "Weak Inh" }] },
  { match: "acalabrutinib", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "acebutolol", annotations: [{ system: "CYP2D6", role: "Sub", note: "minor" }, { system: "CYP2D6", role: "Weak Inh" }] },
  {
    match: "acenocoumarol",
    annotations: [
      { system: "CYP2C9", role: "Sub" },
      { system: "CYP1A2", role: "Sub", note: "minor" },
      { system: "CYP2C19", role: "Sub", note: "minor" },
    ],
  },
  { match: "acetazolamide", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "acetylcholine", annotations: [{ system: "Acetylcholinesterase", role: "Sub", note: "synaptic hydrolysis; less drug metabolism relevance" }] },
  {
    match: "acitretin",
    annotations: [
      { system: "CYP2C9", role: "Sub" },
      { system: "CYP2D6", role: "Sub", note: "minor" },
      { system: "CYP3A4", role: "Sub", note: "minor" },
    ],
  },
  { match: "aclidinium", annotations: [{ system: "Esterase", role: "Rapid hydrolysis" }] },
  { match: "adenosine", annotations: [{ system: "Adenosine deaminase", role: "Sub", note: "major, deamination; purine metabolism" }] },
  { match: "alogliptin", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "alfentanil", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "alfuzosin", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "alimemazine", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "aliskiren", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "almotriptan", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2D6", role: "Sub", note: "minor" }] },
  { match: "alpelisib", annotations: [{ system: "CYP3A4", role: "Sub", note: "minor" }] },
  { match: "amantadine", annotations: [{ system: "Renal elim", role: "Major" }] },
  {
    match: "amoxicillin",
    annotations: [
      { system: "Renal elim", role: "Major", note: "dose adjustment in renal impairment" },
      { system: "Esterase", role: "Hydrolysis", note: "β-lactam ring → penicilloic acid; minimal CYP involvement" },
      { system: "UGT", role: "Sub", note: "minor" },
      { system: "OAT", role: "Sub", note: "OAT1 and OAT3 substrate; probenecid blocks → ↑ levels" },
    ],
  },
  { match: "amoxapine", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "amphetamine", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  {
    match: "anastrozole",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2C8", role: "Sub", note: "minor" },
      { system: "CYP2C9", role: "Sub", note: "minor" },
      { system: "CYP1A2", role: "Weak Inh" },
      { system: "CYP2C9", role: "Weak Inh" },
      { system: "CYP3A4", role: "Weak Inh" },
    ],
  },
  {
    match: "asenapine",
    annotations: [
      { system: "CYP1A2", role: "Sub" },
      { system: "CYP3A4", role: "Sub", note: "minor" },
      { system: "CYP2D6", role: "Weak Inh" },
    ],
  },
  {
    match: "atazanavir",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A4", role: "Strong Inh" },
      { system: "CYP2C8", role: "Inh" },
      { system: "CYP2C9", role: "Inh" },
      { system: "UGT1A1", role: "Inh", note: "↑ bilirubin, Gilbert-like" },
    ],
  },
  { match: "atomoxetine", annotations: [{ system: "CYP2D6", role: "Sub" }, { system: "CYP2C19", role: "Sub", note: "minor" }] },
  { match: "avanafil", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2C9", role: "Sub", note: "minor" }] },
  {
    match: "axitinib",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP1A2", role: "Sub", note: "minor" },
      { system: "CYP2C19", role: "Sub", note: "minor" },
    ],
  },
  { match: "azilsartan", annotations: [{ system: "CYP2C9", role: "Sub", note: "major" }] },

  // ── B ──
  { match: "baclofen", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "beclomethasone", annotations: [{ system: "CYP3A4", role: "Sub", note: "minor" }] },
  { match: "bedaquiline", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "benazepril", annotations: [{ system: "Esterase", role: "Prodrug" }, { system: "Renal elim", role: "Major" }] },
  { match: "betaxolol", annotations: [{ system: "CYP2D6", role: "Sub" }, { system: "CYP1A2", role: "Sub", note: "minor" }] },
  { match: "bexarotene", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "bicalutamide", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "boceprevir", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP3A4", role: "Strong Inh" }] },
  {
    match: "bortezomib",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP1A2", role: "Sub", note: "minor" },
      { system: "CYP2D6", role: "Sub", note: "minor" },
      { system: "CYP2C9", role: "Sub", note: "minor" },
    ],
  },
  { match: "bosutinib", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "brexpiprazole", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2D6", role: "Sub" }] },
  { match: "brigatinib", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2C8", role: "Sub", note: "minor" }] },
  { match: "brivaracetam", annotations: [{ system: "CYP2C19", role: "Sub" }] },
  { match: "bromocriptine", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "budesonide", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "butalbital", annotations: [{ system: "CYP2C19", role: "Sub" }, { system: "CYP3A4", role: "Ind" }] },

  // ── C ──
  { match: "cabergoline", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "cabozantinib", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  {
    match: "cannabidiol",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP3A4", role: "Inh" },
      { system: "CYP2C19", role: "Inh" },
      { system: "CYP2D6", role: "Inh" },
    ],
  },
  { match: "candesartan", annotations: [{ system: "CYP2C9", role: "Sub", note: "minor" }] },
  { match: "captopril", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "cariprazine", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2D6", role: "Sub" }] },
  { match: "carisoprodol", annotations: [{ system: "CYP2C19", role: "Sub" }] },
  {
    match: "ceritinib",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A4", role: "Strong Inh" },
      { system: "CYP2C9", role: "Inh" },
    ],
  },
  { match: "cerivastatin", annotations: [{ system: "CYP2C8", role: "Sub" }, { system: "CYP3A4", role: "Sub" }] },
  { match: "cetirizine", annotations: [{ system: "CYP3A4", role: "Sub", note: "minor" }] },
  { match: "chloral hydrate", annotations: [{ system: "ADH", role: "Met" }] },
  { match: "chlorambucil", annotations: [{ system: "Non-CYP", role: "Alkylation" }] },
  { match: "chlordiazepoxide", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "chlorpheniramine", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "chlorpropamide", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "cilostazol", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2C19", role: "Sub" }] },
  { match: "cisapride", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "clindamycin", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "clofibrate", annotations: [{ system: "UGT", role: "Met" }] },
  { match: "clomifene", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "clonazepam", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "clonidine", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "cytarabine", annotations: [{ system: "Cytidine deaminase", role: "Sub", note: "major, deamination; inactivates chemo" }] },

  // ── D ──
  { match: "dacarbazine", annotations: [{ system: "CYP1A2", role: "Sub" }, { system: "CYP2E1", role: "Sub" }] },
  { match: "daclatasvir", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  {
    match: "dacomitinib",
    annotations: [
      { system: "CYP2D6", role: "Sub" },
      { system: "CYP2D6", role: "Inh" },
    ],
  },
  {
    match: "danazol",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A4", role: "Weak Inh" },
    ],
  },
  { match: "dantrolene", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  {
    match: "dapsone",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2C9", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP2E1", role: "Sub" },
      { system: "NAT2", role: "Sub", note: "major, acetylation; hemolysis risk" },
    ],
  },
  { match: "darolutamide", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  {
    match: "darunavir",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A4", role: "Strong Inh" },
      { system: "CYP2D6", role: "Inh" },
    ],
  },
  { match: "dasabuvir", annotations: [{ system: "CYP2C8", role: "Sub" }, { system: "CYP3A4", role: "Sub" }] },
  { match: "dasatinib", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "daunorubicin", annotations: [{ system: "Carbonyl reductase", role: "Met" }] },
  { match: "deflazacort", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "delafloxacin", annotations: [{ system: "UGT", role: "Met" }] },
  {
    match: "delavirdine",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A4", role: "Strong Inh" },
      { system: "CYP2C9", role: "Inh" },
      { system: "CYP2D6", role: "Inh" },
    ],
  },
  { match: "desipramine", annotations: [{ system: "CYP2D6", role: "Sub" }] },
  { match: "desloratadine", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2D6", role: "Sub" }] },
  { match: "desogestrel", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "dexmedetomidine", annotations: [{ system: "CYP2A6", role: "Sub" }, { system: "CYP2D6", role: "Sub" }] },
  { match: "dexmethylphenidate", annotations: [{ system: "CES1", role: "Hydrolysis" }] },
  { match: "dicoumarol", annotations: [{ system: "CYP2C9", role: "Sub" }] },
  { match: "didanosine", annotations: [{ system: "Purine catabolism", role: "Met" }] },
  { match: "dienogest", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "digitoxin", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "dimethyl fumarate", annotations: [{ system: "Esterase", role: "Hydrolysis" }] },
  { match: "disopyramide", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "docetaxel", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "dofetilide", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  {
    match: "dolasetron",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2D6", role: "Sub" },
      { system: "CYP2C9", role: "Sub" },
    ],
  },
  { match: "dolutegravir", annotations: [{ system: "UGT", role: "Sub", note: "major" }, { system: "CYP3A4", role: "Sub", note: "minor" }, { system: "OCT", role: "Strong Inh", note: "inhibits tubular creatinine secretion" }] },
  { match: "donepezil", annotations: [{ system: "CYP2D6", role: "Sub" }, { system: "CYP3A4", role: "Sub" }, { system: "Plasma cholinesterase", role: "Inh", note: "mild–moderate; central AChE inhibitor also affects BuChE → can prolong NM blockade" }] },
  { match: "doravirine", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "doxapram", annotations: [{ system: "CYP2B6", role: "Sub" }, { system: "CYP2C9", role: "Sub" }, { system: "CYP3A4", role: "Sub" }] },
  { match: "doxazosin", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2D6", role: "Sub" }] },
  {
    match: "doxepin",
    annotations: [
      { system: "CYP2D6", role: "Sub" },
      { system: "CYP1A2", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
    ],
  },
  { match: "droperidol", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "drospirenone", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  { match: "dutasteride", annotations: [{ system: "CYP3A4", role: "Sub" }] },
  {
    match: "duvelisib",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A4", role: "Weak Inh" },
    ],
  },

  // ── E ──
  {
    match: "elagolix",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2C19", role: "Weak Inh" },
      { system: "CYP3A4", role: "Weak Ind" },
    ],
  },
  { match: "elbasvir", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "eletriptan", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "elexacaftor", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "elvitegravir",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2C9", role: "Weak Inh" },
    ],
  },
  { match: "emtricitabine", annotations: [{ system: "Renal elim", role: "Major" }] },
  {
    match: "enasidenib",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2C8", role: "Sub" },
      { system: "CYP2D6", role: "Sub" },
      { system: "CYP1A2", role: "Inh" },
      { system: "CYP2B6", role: "Inh" },
      { system: "CYP2C8", role: "Inh" },
      { system: "CYP2C9", role: "Inh" },
      { system: "CYP2C19", role: "Inh" },
      { system: "CYP2D6", role: "Inh" },
      { system: "CYP3A4", role: "Inh" },
      { system: "CYP2B6", role: "Ind" },
      { system: "CYP3A4", role: "Ind" },
    ],
  },
  {
    match: "encorafenib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP2D6", role: "Sub" },
      { system: "CYP3A4", role: "Strong Inh" },
    ],
  },
  { match: "entacapone", annotations: [{ system: "UGT", role: "Met" }] },
  {
    match: "entrectinib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Moderate Inh" },
    ],
  },
  {
    match: "erlotinib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP1A2", role: "Sub", note: "minor" },
    ],
  },
  {
    match: "eslicarbazepine",
    annotations: [
      { system: "CYP2C19", role: "Moderate Inh" },
      { system: "CYP3A4", role: "Moderate Ind" },
    ],
  },
  { match: "estazolam", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "eszopiclone",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2E1", role: "Sub" },
    ],
  },
  { match: "etonogestrel", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "etoposide", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "everolimus", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "exemestane", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "ezogabine", annotations: [{ system: "UGT", role: "Met" }, { system: "NAT", role: "Met" }] },

  // ── F ──
  {
    match: "fedratinib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP3A4", role: "Inh" },
      { system: "CYP2C19", role: "Inh" },
      { system: "CYP2D6", role: "Inh" },
    ],
  },
  { match: "felodipine", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "fenfluramine",
    annotations: [
      { system: "CYP1A2", role: "Sub" },
      { system: "CYP2B6", role: "Sub" },
      { system: "CYP2C9", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP2D6", role: "Sub" },
      { system: "CYP3A4", role: "Sub" },
    ],
  },
  {
    match: "fenofibric acid",
    annotations: [
      { system: "UGT", role: "Met" },
      { system: "CYP2C8", role: "Weak Inh" },
      { system: "CYP2C9", role: "Weak Inh" },
    ],
  },
  { match: "fesoterodine", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2D6", role: "Sub" }] },
  { match: "finasteride", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "fingolimod", annotations: [{ system: "CYP4F2", role: "Sub", note: "major" }] },
  {
    match: "flibanserin",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2C19", role: "Sub", note: "minor" },
    ],
  },
  { match: "fludrocortisone", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "fluphenazine",
    annotations: [
      { system: "CYP2D6", role: "Sub", note: "major" },
      { system: "CYP2D6", role: "Moderate Inh" },
    ],
  },
  { match: "flurazepam", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "flurbiprofen", annotations: [{ system: "CYP2C9", role: "Sub", note: "major" }] },
  { match: "flutamide", annotations: [{ system: "CYP1A2", role: "Sub", note: "major" }] },
  { match: "fluticasone", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "formoterol",
    annotations: [
      { system: "CYP2D6", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP2C9", role: "Sub" },
      { system: "CYP2A6", role: "Sub" },
    ],
  },
  {
    match: "fosamprenavir",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Strong Inh" },
    ],
  },
  { match: "frovatriptan", annotations: [{ system: "CYP1A2", role: "Sub", note: "major" }] },
  { match: "fulvestrant", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },

  // ── G ──
  { match: "galantamine", annotations: [{ system: "CYP2D6", role: "Sub" }, { system: "CYP3A4", role: "Sub" }] },
  { match: "ganciclovir", annotations: [{ system: "Renal elim", role: "Major" }, { system: "OAT", role: "Sub" }] },
  {
    match: "gefitinib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2D6", role: "Sub" },
    ],
  },
  {
    match: "gilteritinib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Weak Inh" },
    ],
  },
  {
    match: "glasdegib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2C8", role: "Sub" },
      { system: "CYP2D6", role: "Sub" },
    ],
  },
  {
    match: "glecaprevir",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "minor" },
      { system: "CYP3A4", role: "Inh" },
      { system: "CYP1A2", role: "Inh" },
      { system: "CYP2C9", role: "Inh" },
      { system: "CYP2C19", role: "Inh" },
    ],
  },
  { match: "granisetron", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP1A1", role: "Sub" }] },
  {
    match: "grazoprevir",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Weak Inh" },
    ],
  },
  { match: "griseofulvin", annotations: [{ system: "CYP3A4", role: "Strong Ind" }] },
  { match: "guanfacine", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },

  // ── H ──
  {
    match: "halofantrine",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2D6", role: "Strong Inh" },
    ],
  },
  {
    match: "hydroxychloroquine",
    annotations: [
      { system: "CYP2D6", role: "Sub" },
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2C8", role: "Sub" },
      { system: "CYP2D6", role: "Moderate Inh" },
    ],
  },
  {
    match: "hydroxyzine",
    annotations: [
      { system: "CYP2D6", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Sub" },
    ],
  },

  // ── I ──
  {
    match: "ibrutinib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Weak Inh" },
      { system: "CYP2B6", role: "Inh" },
    ],
  },
  { match: "iloperidone", annotations: [{ system: "CYP2D6", role: "Sub" }, { system: "CYP3A4", role: "Sub" }] },
  { match: "irbesartan", annotations: [{ system: "CYP2C9", role: "Sub", note: "major" }] },
  {
    match: "imipramine",
    annotations: [
      { system: "CYP2D6", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP1A2", role: "Sub" },
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2D6", role: "Weak Inh" },
    ],
  },
  {
    match: "indinavir",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Strong Inh" },
      { system: "CYP2D6", role: "Inh" },
      { system: "UGT1A1", role: "Inh" },
    ],
  },
  {
    match: "irinotecan",
    annotations: [
      { system: "Carboxylesterase", role: "Sub", note: "major activation; irinotecan → SN-38 (active metabolite)" },
      { system: "CYP3A4", role: "Sub", note: "minor oxidation; irinotecan → APC / NPC (inactive)" },
      { system: "UGT1A1", role: "Sub", note: "major detox; SN-38 → SN-38G (inactive); diarrhea PGx important" },
    ],
  },
  { match: "oseltamivir", annotations: [{ system: "Carboxylesterase", role: "Sub", note: "major, prodrug activation" }] },
  {
    match: "isavuconazonium",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A5", role: "Sub" },
      { system: "CYP3A4", role: "Moderate Inh" },
      { system: "CYP3A4", role: "Ind" },
      { system: "CYP2C8", role: "Ind" },
      { system: "CYP2C9", role: "Ind" },
      { system: "CYP2C19", role: "Ind" },
    ],
  },
  {
    match: "isotretinoin",
    annotations: [
      { system: "CYP2C8", role: "Sub" },
      { system: "CYP2C9", role: "Sub" },
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2B6", role: "Sub" },
    ],
  },
  { match: "isradipine", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "istradefylline",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP1A1", role: "Sub" },
      { system: "CYP3A4", role: "Weak Inh" },
      { system: "CYP1A2", role: "Weak Inh" },
    ],
  },
  {
    match: "ivacaftor",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Weak Inh" },
      { system: "CYP2C9", role: "Weak Inh" },
    ],
  },
  {
    match: "ivosidenib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Ind" },
      { system: "CYP2B6", role: "Ind" },
      { system: "CYP2C8", role: "Ind" },
      { system: "CYP2C9", role: "Ind" },
    ],
  },
  { match: "ixabepilone", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "ixazomib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP1A2", role: "Sub" },
      { system: "CYP2B6", role: "Sub" },
    ],
  },

  // ── K ──
  { match: "ketoprofen", annotations: [{ system: "UGT", role: "Met" }, { system: "OAT", role: "Moderate Inh" }] },
  { match: "ketotifen", annotations: [{ system: "CYP3A4", role: "Sub", note: "minor" }] },

  // ── L ──
  { match: "labetalol", annotations: [{ system: "CYP2D6", role: "Sub" }, { system: "CYP2C19", role: "Sub" }] },
  {
    match: "lacosamide",
    annotations: [
      { system: "CYP2C19", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2C9", role: "Sub" },
    ],
  },
  { match: "lamivudine", annotations: [{ system: "Renal elim", role: "Major" }] },
  {
    match: "lapatinib",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A5", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP3A4", role: "Moderate Inh" },
      { system: "CYP2C8", role: "Inh" },
    ],
  },
  { match: "larotrectinib", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "lasmiditan", annotations: [{ system: "CYP2D6", role: "Weak Inh" }] },
  {
    match: "leflunomide",
    annotations: [
      { system: "CYP2C9", role: "Sub", note: "active met" },
      { system: "CYP2C9", role: "Weak Inh" },
    ],
  },
  {
    match: "lemborexant",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A5", role: "Sub" },
      { system: "CYP2B6", role: "Sub" },
      { system: "CYP2B6", role: "Weak Inh" },
    ],
  },
  { match: "lenalidomide", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "lenvatinib", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "lesinurad", annotations: [{ system: "CYP2C9", role: "Sub", note: "major" }] },
  {
    match: "letermovir",
    annotations: [
      { system: "CYP3A4", role: "Moderate Inh" },
      { system: "CYP2C8", role: "Inh" },
      { system: "CYP2C9", role: "Ind" },
      { system: "CYP2C19", role: "Ind" },
    ],
  },
  { match: "levothyroxine", annotations: [{ system: "Conjugation", role: "Sub", note: "major; long half-life" }] },
  {
    match: "letrozole",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2A6", role: "Sub" },
      { system: "CYP2A6", role: "Strong Inh" },
      { system: "CYP2C19", role: "Inh" },
    ],
  },
  { match: "levacetylmethadol", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "levonorgestrel", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "levorphanol", annotations: [{ system: "UGT", role: "Met" }] },
  { match: "linagliptin", annotations: [{ system: "CYP3A4", role: "Sub", note: "minor" }] },
  {
    match: "lofexidine",
    annotations: [
      { system: "CYP2D6", role: "Sub" },
      { system: "CYP1A2", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
    ],
  },
  {
    match: "lomitapide",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Weak Inh" },
    ],
  },
  {
    match: "lonafarnib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2C8", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP3A4", role: "Strong Inh" },
      { system: "CYP2C9", role: "Inh" },
    ],
  },
  {
    match: "lopinavir",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Strong Inh" },
      { system: "CYP2D6", role: "Inh" },
    ],
  },
  { match: "loratadine", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2D6", role: "Sub" }] },
  {
    match: "loxapine",
    annotations: [
      { system: "CYP1A2", role: "Sub" },
      { system: "CYP2D6", role: "Sub" },
      { system: "CYP3A4", role: "Sub" },
    ],
  },
  {
    match: "lumacaftor",
    annotations: [
      { system: "CYP3A4", role: "Strong Ind" },
      { system: "CYP2B6", role: "Ind" },
      { system: "CYP2C", role: "Ind" },
    ],
  },
  {
    match: "lumateperone",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2C8", role: "Sub" },
      { system: "CYP1A2", role: "Sub" },
    ],
  },
  {
    match: "lumefantrine",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2D6", role: "Strong Inh" },
    ],
  },

  // ── M ──
  {
    match: "macitentan",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2C19", role: "Sub" },
    ],
  },
  { match: "maprotiline", annotations: [{ system: "CYP2D6", role: "Sub", note: "major" }] },
  { match: "maraviroc", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "medroxyprogesterone", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "mefloquine",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2D6", role: "Weak Inh" },
      { system: "CYP3A4", role: "Weak Inh" },
    ],
  },
  { match: "megestrol acetate", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "melatonin",
    annotations: [
      { system: "CYP1A2", role: "Sub", note: "major" },
      { system: "CYP2C19", role: "Sub" },
    ],
  },
  {
    match: "meloxicam",
    annotations: [
      { system: "CYP2C9", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Sub" },
    ],
  },
  {
    match: "meperidine",
    annotations: [
      { system: "CYP2B6", role: "Sub" },
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
    ],
  },
  { match: "mesoridazine", annotations: [{ system: "CYP2D6", role: "Sub", note: "major" }] },
  {
    match: "methylene blue",
    annotations: [
      { system: "CYP1A2", role: "Inh" },
      { system: "CYP2B6", role: "Inh" },
      { system: "CYP2C8", role: "Inh" },
      { system: "CYP2C9", role: "Inh" },
      { system: "CYP2C19", role: "Inh" },
      { system: "CYP2D6", role: "Inh" },
      { system: "CYP3A4", role: "Inh" },
    ],
  },
  { match: "metoclopramide", annotations: [{ system: "CYP2D6", role: "Sub", note: "major" }, { system: "Plasma cholinesterase", role: "Inh", note: "mild; decreases enzyme activity → slight prolongation" }] },
  {
    match: "midostaurin",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Weak Inh" },
    ],
  },
  {
    match: "mifepristone",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Strong Inh" },
      { system: "CYP2C8", role: "Weak Inh" },
      { system: "CYP2C9", role: "Weak Inh" },
    ],
  },
  { match: "minoxidil", annotations: [{ system: "SULT", role: "Sub", note: "major, sulfation; prodrug activation" }] },
  { match: "mycophenolate", annotations: [{ system: "UGT", role: "Sub", note: "major, enterohepatic recycling" }] },

  // ── N ──
  { match: "nabumetone", annotations: [{ system: "CYP1A2", role: "Sub", note: "major" }] },
  { match: "nalbuphine", annotations: [{ system: "UGT", role: "Sub", note: "major" }] },
  { match: "naldemedine", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "nalmefene", annotations: [{ system: "UGT", role: "Sub", note: "major" }] },
  { match: "naloxegol", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "naproxen", annotations: [{ system: "CYP2C9", role: "Sub" }, { system: "CYP1A2", role: "Sub" }, { system: "OAT", role: "Sub" }, { system: "OAT", role: "Moderate Inh", note: "competes for renal secretion" }] },
  {
    match: "nateglinide",
    annotations: [
      { system: "CYP2C9", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Sub" },
    ],
  },
  { match: "nebivolol", annotations: [{ system: "CYP2D6", role: "Sub", note: "major" }] },
  { match: "neratinib", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "nicardipine",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2C8", role: "Sub" },
      { system: "CYP3A4", role: "Weak Inh" },
      { system: "CYP2D6", role: "Inh" },
      { system: "CYP2C19", role: "Inh" },
    ],
  },
  { match: "nimodipine", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "nintedanib", annotations: [{ system: "CYP3A4", role: "Sub", note: "minor" }] },
  { match: "nisoldipine", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "nitroglycerin", annotations: [{ system: "UGT", role: "Sub", note: "major, non-CYP metabolism; rapid clearance" }] },
  { match: "norethisterone", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "norgestimate", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },

  // ── O ──
  {
    match: "olaparib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Weak Inh" },
    ],
  },
  { match: "oliceridine", annotations: [{ system: "CYP2D6", role: "Sub" }, { system: "CYP3A4", role: "Sub" }] },
  { match: "osimertinib", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "ospemifene",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2C9", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
    ],
  },
  {
    match: "oxcarbazepine",
    annotations: [
      { system: "CYP2C19", role: "Moderate Inh" },
      { system: "CYP3A4", role: "Strong Ind" },
    ],
  },
  { match: "oxybutynin", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },

  { match: "ozanimod", annotations: [{ system: "CYP2C8", role: "Sub" }, { system: "CYP3A4", role: "Sub" }] },

  // ── P ──
  {
    match: "paclitaxel",
    annotations: [
      { system: "CYP2C8", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Sub" },
    ],
  },
  { match: "palbociclib", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "palonosetron",
    annotations: [
      { system: "CYP2D6", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Sub" },
    ],
  },
  {
    match: "panobinostat",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2D6", role: "Weak Inh" },
    ],
  },
  {
    match: "pazopanib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Inh" },
      { system: "CYP2C8", role: "Inh" },
      { system: "CYP2D6", role: "Weak Inh" },
    ],
  },
  { match: "perampanel", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "phentermine", annotations: [{ system: "CYP3A4", role: "Sub", note: "minor" }] },
  {
    match: "pimavanserin",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A5", role: "Sub" },
    ],
  },
  {
    match: "pimozide",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2D6", role: "Sub" },
      { system: "CYP1A2", role: "Sub" },
    ],
  },
  { match: "pindolol", annotations: [{ system: "CYP2D6", role: "Sub", note: "major" }] },
  {
    match: "pirfenidone",
    annotations: [
      { system: "CYP1A2", role: "Sub", note: "major" },
      { system: "CYP2C9", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
    ],
  },
  { match: "piroxicam", annotations: [{ system: "CYP2C9", role: "Sub", note: "major" }] },
  {
    match: "pitolisant",
    annotations: [
      { system: "CYP2D6", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2D6", role: "Weak Inh" },
    ],
  },
  { match: "pomalidomide", annotations: [{ system: "CYP1A2", role: "Sub" }, { system: "CYP3A4", role: "Sub" }] },
  { match: "ponatinib", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "pramipexole", annotations: [{ system: "Renal elim", role: "Major" }] },
  {
    match: "primidone",
    annotations: [
      { system: "CYP2C9", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP3A4", role: "Ind" },
      { system: "CYP1A2", role: "Ind" },
      { system: "CYP2C", role: "Ind" },
    ],
  },
  { match: "prochlorperazine", annotations: [{ system: "CYP2D6", role: "Sub", note: "major" }] },
  { match: "progesterone", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "promethazine", annotations: [{ system: "CYP2D6", role: "Sub" }, { system: "CYP2C19", role: "Sub" }] },
  { match: "prucalopride", annotations: [{ system: "CYP3A4", role: "Sub", note: "minor" }] },

  // ── Q ──
  { match: "quazepam", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2C19", role: "Sub" }] },
  {
    match: "quinine",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP2C9", role: "Sub" },
      { system: "CYP2D6", role: "Strong Inh" },
      { system: "CYP3A4", role: "Inh" },
    ],
  },

  // ── R ──
  { match: "raloxifene", annotations: [{ system: "UGT", role: "Sub", note: "major" }] },
  { match: "raltegravir", annotations: [{ system: "UGT", role: "Sub", note: "major, UGT1A1, few CYP interactions" }] },
  {
    match: "ramelteon",
    annotations: [
      { system: "CYP1A2", role: "Sub", note: "major" },
      { system: "CYP2C", role: "Sub" },
      { system: "CYP3A4", role: "Sub" },
    ],
  },
  { match: "rasagiline", annotations: [{ system: "CYP1A2", role: "Sub", note: "major" }] },
  {
    match: "regorafenib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2C8", role: "Inh" },
      { system: "CYP2C9", role: "Inh" },
      { system: "CYP3A4", role: "Weak Inh" },
    ],
  },
  { match: "relugolix", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "repaglinide",
    annotations: [
      { system: "CYP2C8", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Sub" },
    ],
  },
  {
    match: "ribociclib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Strong Inh" },
    ],
  },
  {
    match: "rifaximin",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "minor" },
      { system: "CYP3A4", role: "Weak Ind" },
    ],
  },
  { match: "rilpivirine", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "riluzole", annotations: [{ system: "CYP1A2", role: "Sub", note: "major" }] },
  { match: "rimegepant", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "riociguat",
    annotations: [
      { system: "CYP1A2", role: "Sub" },
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2C8", role: "Sub" },
      { system: "CYP2J2", role: "Sub" },
    ],
  },
  {
    match: "ripretinib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2C8", role: "Inh" },
      { system: "CYP3A4", role: "Ind" },
    ],
  },
  { match: "roflumilast", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP1A2", role: "Sub" }] },
  {
    match: "rosiglitazone",
    annotations: [
      { system: "CYP2C8", role: "Sub", note: "major" },
      { system: "CYP2C9", role: "Sub" },
    ],
  },
  {
    match: "rotigotine",
    annotations: [
      { system: "CYP1A2", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP3A4", role: "Sub" },
    ],
  },
  {
    match: "rucaparib",
    annotations: [
      { system: "CYP2D6", role: "Sub" },
      { system: "CYP1A2", role: "Sub" },
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP1A2", role: "Inh" },
      { system: "CYP2C19", role: "Inh" },
      { system: "CYP3A4", role: "Inh" },
    ],
  },
  {
    match: "ruxolitinib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2C9", role: "Sub" },
    ],
  },

  // ── S ──
  { match: "salmeterol", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "saxagliptin", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }, { system: "CYP3A5", role: "Sub" }] },
  {
    match: "selexipag",
    annotations: [
      { system: "CYP2C8", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Sub" },
    ],
  },
  {
    match: "selpercatinib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2C8", role: "Inh" },
      { system: "CYP3A4", role: "Inh" },
    ],
  },
  {
    match: "selumetinib",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP1A2", role: "Sub" },
    ],
  },
  { match: "sibutramine", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "silodosin", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "simeprevir",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Weak Inh" },
    ],
  },
  {
    match: "siponimod",
    annotations: [
      { system: "CYP2C9", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Sub" },
    ],
  },
  { match: "sirolimus", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "solifenacin", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "sonidegib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Inh" },
      { system: "CYP2C9", role: "Inh" },
    ],
  },
  {
    match: "sorafenib",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "UGT1A9", role: "Met" },
      { system: "CYP2C8", role: "Inh" },
      { system: "CYP2C9", role: "Inh" },
      { system: "CYP2B6", role: "Inh" },
    ],
  },
  { match: "sotalol", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "stavudine", annotations: [{ system: "Renal elim", role: "Major" }] },
  {
    match: "stiripentol",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP2D6", role: "Sub" },
      { system: "CYP2C19", role: "Inh" },
      { system: "CYP3A4", role: "Inh" },
      { system: "CYP2D6", role: "Inh" },
    ],
  },
  { match: "sufentanil", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "sunitinib", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "suvorexant", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },

  // ── T ──
  { match: "tacrine", annotations: [{ system: "CYP1A2", role: "Sub", note: "major" }] },
  { match: "tamsulosin", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2D6", role: "Sub" }] },
  { match: "tapentadol", annotations: [{ system: "UGT", role: "Met" }] },
  { match: "tasimelteon", annotations: [{ system: "CYP1A2", role: "Sub" }, { system: "CYP3A4", role: "Sub" }] },
  {
    match: "telaprevir",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Strong Inh" },
    ],
  },
  {
    match: "telithromycin",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Strong Inh" },
    ],
  },
  {
    match: "telmisartan",
    annotations: [
      { system: "UGT", role: "Sub", note: "major" },
      { system: "OAT", role: "Moderate Inh", note: "same class effect" },
      { system: "CYP2C19", role: "Weak Inh" },
    ],
  },
  { match: "telotristat ethyl", annotations: [{ system: "CYP3A4", role: "Ind" }] },
  { match: "temsirolimus", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "tenofovir", annotations: [{ system: "OAT", role: "Sub" }, { system: "OAT", role: "Moderate Inh", note: "competes at renal transport" }, { system: "Renal elim", role: "Major" }] },
  { match: "terfenadine", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "testosterone", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "tetrabenazine", annotations: [{ system: "CYP2D6", role: "Sub", note: "major" }] },
  {
    match: "thiopental",
    annotations: [
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP2B6", role: "Sub" },
      { system: "CYP3A4", role: "Sub" },
    ],
  },
  { match: "thiothixene", annotations: [{ system: "CYP1A2", role: "Sub", note: "major" }] },
  { match: "tiagabine", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "tinidazole", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "tiotropium", annotations: [{ system: "CYP2D6", role: "Sub" }, { system: "CYP3A4", role: "Sub" }] },
  {
    match: "tipranavir",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Strong Inh" },
      { system: "CYP3A4", role: "Ind" },
    ],
  },
  { match: "tivozanib", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "tolterodine", annotations: [{ system: "CYP2D6", role: "Sub" }, { system: "CYP3A4", role: "Sub" }] },
  { match: "tolvaptan", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "topiramate",
    annotations: [
      { system: "CYP2C19", role: "Inh" },
      { system: "CYP3A4", role: "Weak Ind" },
    ],
  },
  { match: "toremifene", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "trabectedin", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "tranylcypromine",
    annotations: [
      { system: "CYP2C19", role: "Inh" },
      { system: "CYP2D6", role: "Inh" },
      { system: "CYP2C9", role: "Inh" },
    ],
  },
  {
    match: "tretinoin",
    annotations: [
      { system: "CYP2C8", role: "Sub" },
      { system: "CYP26A1", role: "Sub" },
      { system: "CYP3A4", role: "Sub" },
    ],
  },
  { match: "triamcinolone", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "trifluoperazine", annotations: [{ system: "CYP1A2", role: "Sub", note: "major" }] },
  {
    match: "trimipramine",
    annotations: [
      { system: "CYP2D6", role: "Sub" },
      { system: "CYP2C19", role: "Sub" },
      { system: "CYP3A4", role: "Sub" },
    ],
  },

  // ── U ──
  { match: "ubrogepant", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "ulipristal", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "upadacitinib", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },

  // ── V ──
  { match: "valbenazine", annotations: [{ system: "CYP3A4", role: "Sub" }, { system: "CYP2D6", role: "Sub" }] },
  { match: "valsartan", annotations: [{ system: "CYP2C9", role: "Sub", note: "minor" }, { system: "OAT", role: "Moderate Inh", note: "OAT inhibition contributes to interactions" }] },
  {
    match: "sacubitril",
    annotations: [
      { system: "Carboxylesterase", role: "Sub", note: "major, prodrug bioactivation; sacubitril → LBQ657 (active metabolite)" },
      { system: "OAT", role: "Sub", note: "OATP1B1 and OATP1B3 substrate" },
    ],
  },
  { match: "varenicline", annotations: [{ system: "Renal elim", role: "Major" }] },
  {
    match: "velpatasvir",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2C8", role: "Sub" },
      { system: "CYP2B6", role: "Sub" },
    ],
  },
  { match: "venetoclax", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "vigabatrin", annotations: [{ system: "Renal elim", role: "Major" }] },
  { match: "vilazodone", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "vildagliptin", annotations: [{ system: "Hydrolysis", role: "Met" }] },
  { match: "vinblastine", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "vinorelbine", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "vismodegib",
    annotations: [
      { system: "CYP2C9", role: "Sub" },
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP2C8", role: "Inh" },
      { system: "CYP2C9", role: "Weak Inh" },
    ],
  },
  {
    match: "vorapaxar",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2J2", role: "Sub" },
    ],
  },
  { match: "vorinostat", annotations: [{ system: "UGT", role: "Met" }] },
  {
    match: "vortioxetine",
    annotations: [
      { system: "CYP2D6", role: "Sub", note: "major" },
      { system: "CYP3A4", role: "Sub" },
    ],
  },
  { match: "voxilaprevir", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },

  // ── Z ──
  {
    match: "zaleplon",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "minor" },
      { system: "Aldehyde oxidase", role: "Sub" },
    ],
  },
  { match: "zanubrutinib", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  { match: "zidovudine", annotations: [{ system: "UGT", role: "Sub", note: "major, UGT2B7, classic Phase II drug" }] },
  { match: "zolmitriptan", annotations: [{ system: "CYP1A2", role: "Sub", note: "major" }] },
  { match: "zonisamide", annotations: [{ system: "CYP3A4", role: "Sub", note: "major" }] },
  {
    match: "zopiclone",
    annotations: [
      { system: "CYP3A4", role: "Sub", note: "major" },
      { system: "CYP2C8", role: "Sub" },
    ],
  },
  { match: "cidofovir", annotations: [{ system: "OAT", role: "Sub" }] },
  { match: "ceftriaxone", annotations: [{ system: "OAT", role: "Sub" }] },
  { match: "penicillins", annotations: [{ system: "OAT", role: "Sub" }] },
  { match: "uric acid", annotations: [{ system: "OAT", role: "Sub", note: "natural substrate" }] },
  { match: "bumetanide", annotations: [{ system: "OAT", role: "Moderate Inh" }] },
  { match: "cabotegravir", annotations: [{ system: "OAT", role: "Moderate Inh" }] },
  { match: "cloxacillin", annotations: [{ system: "OAT", role: "Moderate Inh" }] },
  { match: "oxacillin", annotations: [{ system: "OAT", role: "Moderate Inh" }] },
  { match: "olmesartan", annotations: [{ system: "OAT", role: "Moderate Inh" }] },
  { match: "sulfasalazine", annotations: [{ system: "OAT", role: "Moderate Inh" }] },
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
  {
    match: "isavuconazole",
    annotations: [
      { system: "CYP3A4", role: "Sub" },
      { system: "CYP3A5", role: "Sub" },
      { system: "CYP3A4", role: "Moderate Inh" },
      { system: "CYP2C8", role: "Weak Ind" },
      { system: "CYP2C9", role: "Weak Ind" },
    ],
  },
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
  { match: "chloramphenicol", annotations: [{ system: "CYP2C19", role: "Moderate Inh" }, { system: "UGT", role: "Sub", note: "major, gray baby syndrome risk" }] },
  { match: "felbamate", annotations: [{ system: "CYP2C19", role: "Moderate Inh" }] },
  { match: "lansoprazole", annotations: [{ system: "CYP2C19", role: "Moderate Inh" }] },
  { match: "rabeprazole", annotations: [{ system: "CYP2C19", role: "Moderate Inh" }] },
  { match: "indomethacin", annotations: [{ system: "CYP2C19", role: "Weak Inh" }, { system: "OAT", role: "Moderate Inh" }] },
  { match: "enoxacin", annotations: [{ system: "CYP1A2", role: "Strong Inh" }] },
  { match: "rofecoxib", annotations: [{ system: "CYP1A2", role: "Strong Inh" }] },
  { match: "norfloxacin", annotations: [{ system: "CYP1A2", role: "Moderate Inh" }] },
  { match: "phenylpropanolamine", annotations: [{ system: "CYP1A2", role: "Moderate Inh" }] },
  { match: "thiabendazole", annotations: [{ system: "CYP1A2", role: "Moderate Inh" }] },
  { match: "zileuton", annotations: [{ system: "CYP1A2", role: "Moderate Inh" }] },
  { match: "vemurafenib", annotations: [{ system: "CYP1A2", role: "Moderate Inh" }] },
  { match: "acyclovir", annotations: [{ system: "CYP1A2", role: "Weak Inh" }, { system: "OAT", role: "Sub" }] },
  { match: "allopurinol", annotations: [{ system: "CYP1A2", role: "Weak Inh" }] },
  { match: "ethinyl estradiol", annotations: [{ system: "CYP1A2", role: "Weak Inh" }, { system: "UGT", role: "Sub", note: "major, glucuronidation + sulfation, enterohepatic recycling" }, { system: "SULT", role: "Sub", note: "major, sulfation" }] },
  { match: "mexiletine", annotations: [{ system: "CYP1A2", role: "Weak Inh" }] },
  { match: "oral contraceptives", annotations: [{ system: "CYP1A2", role: "Weak Inh" }] },
  { match: "cigarette smoking", annotations: [{ system: "CYP1A2", role: "Strong Ind" }] },
  { match: "charbroiled meat", annotations: [{ system: "CYP1A2", role: "Strong Ind" }] },
  { match: "cruciferous vegetables", annotations: [{ system: "CYP1A2", role: "Moderate Ind" }] },
  { match: "insulin", annotations: [{ system: "CYP1A2", role: "Moderate Ind" }, { system: "Protease/Peptidase", role: "Sub", note: "protein breakdown → amino acids; metabolites → renal elimination" }] },
  { match: "glucagon", annotations: [{ system: "Protease/Peptidase", role: "Sub", note: "protein breakdown → amino acids; metabolites → renal elimination" }] },
  { match: "enoxaparin", annotations: [{ system: "Protease/Peptidase", role: "Sub", note: "protein breakdown → amino acids; metabolites → renal elimination" }] },
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
  { match: "fomepizole", annotations: [{ system: "CYP2E1", role: "Strong Inh" }, { system: "Alcohol dehydrogenase", role: "Inh", note: "blocks alcohol → aldehyde in poisoning" }] },
  { match: "clomethiazole", annotations: [{ system: "CYP2E1", role: "Moderate Inh" }] },
  { match: "dimethyl sulfoxide", annotations: [{ system: "CYP2E1", role: "Moderate Inh" }] },
  { match: "watercress", annotations: [{ system: "CYP2E1", role: "Moderate Inh" }] },
  { match: "phenethyl isothiocyanate", annotations: [{ system: "CYP2E1", role: "Weak Inh" }] },
  { match: "diallyl sulfide", annotations: [{ system: "CYP2E1", role: "Weak Inh" }] },
  { match: "thiotepa", annotations: [{ system: "CYP2B6", role: "Strong Inh" }] },
  { match: "prasugrel", annotations: [{ system: "CYP2B6", role: "Strong Inh" }] },
  { match: "nevirapine", annotations: [{ system: "CYP2B6", role: "Strong Ind" }] },
  { match: "cyclophosphamide", annotations: [{ system: "CYP2B6", role: "Moderate Ind" }, { system: "GST", role: "Sub", note: "major, metabolite detoxification" }] },
  { match: "busulfan", annotations: [{ system: "GST", role: "Sub", note: "major, glutathione conjugation" }] },
  { match: "gemfibrozil", annotations: [{ system: "CYP2C8", role: "Strong Inh" }, { system: "UGT", role: "Inh", note: "UGT inhibition contributes to interactions" }, { system: "OAT", role: "Strong Inh", note: "OAT3 inhibitor" }] },
  { match: "probenecid", annotations: [{ system: "UGT", role: "Inh", note: "inhibits glucuronidation + renal secretion" }, { system: "OAT", role: "Strong Inh", note: "prototype; blocks renal secretion" }] },
  { match: "trimethoprim", annotations: [{ system: "CYP2C8", role: "Strong Inh" }, { system: "OCT", role: "Strong Inh", note: "causes pseudo-creatinine rise" }] },
  { match: "deferasirox", annotations: [{ system: "CYP2C8", role: "Strong Inh" }] },
  { match: "quercetin", annotations: [{ system: "CYP2C8", role: "Weak Inh" }] },
  { match: "montelukast", annotations: [{ system: "CYP2C8", role: "Weak Inh" }] },
];

const ALL_METABOLISM_ENTRIES = [...METABOLISM_ENTRIES, ...CYP_REFERENCE_ONLY_ENTRIES];

type NormalizedMetabolismEntry = MetabolismEntry & {
  normalizedMatch: string;
  matchTokens: string[];
};

const NORMALIZED_METABOLISM_ENTRIES: NormalizedMetabolismEntry[] = ALL_METABOLISM_ENTRIES.map((entry) => {
  const normalizedMatch = normalizeDrugName(entry.match);
  return {
    ...entry,
    normalizedMatch,
    matchTokens: normalizedMatch.split(" "),
  };
});

function findTokenSequenceStart(tokens: string[], needle: string[]) {
  if (needle.length === 0 || needle.length > tokens.length) {
    return -1;
  }

  for (let index = 0; index <= tokens.length - needle.length; index += 1) {
    let matched = true;

    for (let needleIndex = 0; needleIndex < needle.length; needleIndex += 1) {
      if (tokens[index + needleIndex] !== needle[needleIndex]) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return index;
    }
  }

  return -1;
}

function getMatchedEntries(name: string): NormalizedMetabolismEntry[] {
  const normalized = normalizeDrugName(name);

  if (!normalized) {
    return [];
  }

  const nameTokens = normalized.split(" ");
  const matchedEntries: Array<NormalizedMetabolismEntry & { start: number }> = [];

  for (const entry of NORMALIZED_METABOLISM_ENTRIES) {
    const start = findTokenSequenceStart(nameTokens, entry.matchTokens);
    if (start === -1) {
      continue;
    }

    matchedEntries.push({ ...entry, start });
  }

  matchedEntries.sort((left, right) => {
    const tokenLengthDifference = right.matchTokens.length - left.matchTokens.length;
    if (tokenLengthDifference !== 0) {
      return tokenLengthDifference;
    }

    return right.normalizedMatch.length - left.normalizedMatch.length;
  });

  const coveredTokenIndexes = new Set<number>();
  const acceptedEntries: NormalizedMetabolismEntry[] = [];

  for (const entry of matchedEntries) {
    let overlapsCoveredTokens = true;

    for (let index = entry.start; index < entry.start + entry.matchTokens.length; index += 1) {
      if (!coveredTokenIndexes.has(index)) {
        overlapsCoveredTokens = false;
        break;
      }
    }

    if (overlapsCoveredTokens) {
      continue;
    }

    acceptedEntries.push(entry);

    for (let index = entry.start; index < entry.start + entry.matchTokens.length; index += 1) {
      coveredTokenIndexes.add(index);
    }
  }

  return acceptedEntries;
}

function formatAnnotation(annotation: MetabolismAnnotation) {
  return `${annotation.system}: ${annotation.role}${annotation.note ? ` (${annotation.note})` : ""}`;
}

function isClickableAnnotation(annotation: MetabolismAnnotation) {
  return annotation.role === "Sub" && (
    annotation.system.startsWith("CYP") ||
    annotation.system === "P-gp" ||
    annotation.system.startsWith("UGT") ||
    annotation.system === "OAT" ||
    annotation.system === "OCT" ||
    annotation.system === "SULT" ||
    annotation.system.startsWith("NAT") ||
    annotation.system === "COMT" ||
    annotation.system === "Alcohol dehydrogenase" ||
    annotation.system === "Aldehyde dehydrogenase" ||
    annotation.system === "Xanthine oxidase" ||
    annotation.system === "Plasma cholinesterase"
  );
}

export function getDrugMetabolismTags(name: string): DrugMetabolismTag[] {
  const seen = new Set<string>();
  const tags: DrugMetabolismTag[] = [];

  for (const entry of getMatchedEntries(name)) {
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

export function getDrugMetabolismAnnotations(name: string): string[] {
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

  for (const entry of ALL_METABOLISM_ENTRIES) {
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
