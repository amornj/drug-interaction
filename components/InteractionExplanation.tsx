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
  const sections = parseExplanationText(text);
  const citationLine = formatSources(pair.sources);

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

  return (
    <div className="mt-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Optional explainer
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            AI prose only. Deterministic result above remains authoritative.
          </p>
        </div>
        <button
          type="button"
          onClick={explain}
          disabled={loading}
          className={[
            "min-h-11 rounded-xl px-3 text-sm font-medium transition-colors",
            loading
              ? "bg-zinc-300 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
              : "bg-zinc-900 text-white active:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:active:bg-zinc-200",
          ].join(" ")}
        >
          {loading ? "Explaining…" : text ? "Re-explain" : "Explain"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-900 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {loading || text ? (
        <div className="mt-3 space-y-3">
          {Object.keys(sections).length > 0 ? (
            explanationLabels.map((label) =>
              sections[label] ? (
                <div
                  key={`${pairKey(pair)}-${label}`}
                  className="rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/70"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    {label}
                  </p>
                  <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                    {sections[label]}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Sources: {citationLine}
                  </p>
                </div>
              ) : null
            )
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/70">
              <p className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
                {text || "Starting stream…"}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Sources: {citationLine}
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
