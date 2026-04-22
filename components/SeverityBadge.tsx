import type { InteractionSeverity } from "@/lib/interactions";

const labels: Record<InteractionSeverity, string> = {
  Contraindicated: "Contra",
  Major: "Major",
  Moderate: "Mod",
  Minor: "Minor",
};

const markColor: Record<InteractionSeverity, string> = {
  Contraindicated: "var(--sev-contra)",
  Major: "var(--sev-major)",
  Moderate: "var(--sev-moderate)",
  Minor: "var(--sev-minor)",
};

export function SeverityBadge({
  severity,
  pulse = false,
}: {
  severity: InteractionSeverity;
  pulse?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-soft"
      aria-label={`Severity: ${severity}`}
    >
      <span
        className={`sev-mark ${pulse ? "breath" : ""}`}
        style={{ background: markColor[severity] }}
        aria-hidden
      />
      {labels[severity]}
    </span>
  );
}
