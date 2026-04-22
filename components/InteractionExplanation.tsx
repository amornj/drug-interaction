"use client";

import { useState } from "react";
import {
  explanationLabels,
  formatSources,
  pairKey,
  parseExplanationText,
  type InteractionPair,
} from "@/lib/interactions";

export function InteractionExplanation({
  pair,
  dataVersion,
}: {
  pair: InteractionPair;
  dataVersion: string;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy prompt");
  const sections = parseExplanationText(text);
  const citationLine = formatSources(pair.sources);
  const copyPrompt = `Check drug interaction between ${pair.a.name} and ${pair.b.name}`;

  async function explain() {
    setLoading(true);
    setError(null);
    setText("");

    try {
      const response = await fetch("/api/interactions/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pair, dataVersion }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Unable to stream explanation");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Missing response stream");
      }

      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        setText((current) => current + decoder.decode(value, { stream: true }));
      }

      setText((current) => current + decoder.decode());
    } catch (streamError) {
      setError(
        streamError instanceof Error
          ? streamError.message
          : "Unable to stream explanation"
      );
      setText("");
    } finally {
      setLoading(false);
    }
  }

  async function copyPromptToClipboard() {
    try {
      await navigator.clipboard.writeText(copyPrompt);
      setCopyLabel("Copied ✓");
      setError(null);
      window.setTimeout(() => setCopyLabel("Copy prompt"), 1600);
    } catch {
      setCopyLabel("Copy failed");
      window.setTimeout(() => setCopyLabel("Copy prompt"), 1600);
    }
  }

  return (
    <div className="mt-4 border border-rule bg-paper-raised p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Optional Explainer</p>
          <p className="mt-0.5 text-[11px] italic text-ink-mute">
            AI prose only. Deterministic result above remains authoritative.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={explain}
            disabled={loading}
            className={[
              "min-h-9 border px-3 text-[11.5px] uppercase tracking-[0.12em] transition-colors",
              loading
                ? "border-rule text-ink-mute"
                : "border-accent bg-accent text-paper hover:bg-accent/90",
            ].join(" ")}
          >
            {loading ? "…" : text ? "Re-explain" : "Explain"}
          </button>
          <button
            type="button"
            onClick={copyPromptToClipboard}
            className="min-h-9 border border-rule px-3 text-[11.5px] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-rule-strong hover:text-ink"
            title={copyPrompt}
          >
            {copyLabel}
          </button>
        </div>
      </div>

      {error ? (
        <div
          className="mt-3 border border-rule border-l-2 bg-warn-soft px-3 py-2 text-[13px] text-ink"
          style={{ borderLeftColor: "var(--sev-contra)" }}
        >
          {error}
        </div>
      ) : null}

      {loading || text ? (
        <div className="mt-3 space-y-2">
          {Object.keys(sections).length > 0 ? (
            explanationLabels.map((label) =>
              sections[label] ? (
                <div
                  key={`${pairKey(pair)}-${label}`}
                  className="border border-rule border-l-2 border-l-rule-strong bg-paper px-3 py-2"
                >
                  <p className="eyebrow">{label}</p>
                  <p className="mt-1 text-[13.5px] leading-snug text-ink">
                    {sections[label]}
                  </p>
                  <p className="stamp mt-2">Sources · {citationLine}</p>
                </div>
              ) : null
            )
          ) : (
            <div className="border border-rule bg-paper px-3 py-2">
              <p className="whitespace-pre-wrap text-[13.5px] leading-snug text-ink">
                {text || "Starting stream…"}
              </p>
              <p className="stamp mt-2">Sources · {citationLine}</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
