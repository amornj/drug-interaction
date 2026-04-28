export const severityOrder = [
  "Contraindicated",
  "Major",
  "Moderate",
  "Minor",
] as const;

export type InteractionSeverity = (typeof severityOrder)[number];

export type InteractionSource = {
  name: string;
  version: string;
};

export type InteractionConfidence =
  | "pk_confirmed"
  | "pk_plausible"
  | "pd_plausible"
  | "unverified";

export type PkMechanismKind = "sub_inh" | "sub_ind" | "co_sub";

export type PkMechanism = {
  kind: PkMechanismKind;
  system: string;
};

export type InteractionPair = {
  a: { rxcui: string; name: string };
  b: { rxcui: string; name: string };
  severity: InteractionSeverity;
  confidence: InteractionConfidence;
  lowConfidence: boolean;
  pkMechanisms: PkMechanism[];
  verdict: string;
  mechanism_class?: string;
  management?: string;
  sources: InteractionSource[];
};

export type InteractionCheckResponse = {
  pairs: InteractionPair[];
  unknown: string[];
  checkedAt: string;
  dataVersion: string;
};

export function formatSources(sources: InteractionSource[]) {
  return sources
    .map((source) => `${source.name} · ${source.version}`)
    .join(" · ");
}

export function confidenceLabel(confidence: InteractionConfidence) {
  switch (confidence) {
    case "pk_confirmed":
      return "PK";
    case "pk_plausible":
      return "Co-sub";
    case "pd_plausible":
      return "PD";
    case "unverified":
      return "?";
  }
}

export function pkMechanismLabel(kind: PkMechanismKind) {
  switch (kind) {
    case "sub_inh":
      return "SUB-INH";
    case "sub_ind":
      return "SUB-IND";
    case "co_sub":
      return "CO-SUB";
  }
}
