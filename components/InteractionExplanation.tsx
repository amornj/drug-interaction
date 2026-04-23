"use client";

import { useState } from "react";
import type { InteractionPair } from "@/lib/interactions";

export function InteractionExplanation({
  pair,
}: {
  pair: InteractionPair;
}) {
  const [copyLabel, setCopyLabel] = useState("Copy prompt");
  const copyPrompt = `Check drug interaction between ${pair.a.name} and ${pair.b.name}`;

  async function copyPromptToClipboard() {
    try {
      await navigator.clipboard.writeText(copyPrompt);
      setCopyLabel("Copied ✓");
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
          <p className="eyebrow">Ask LLM Chat</p>
          <p className="mt-0.5 text-[11px] italic text-ink-mute">
            Copy a prompt for another chat app. Deterministic result above remains authoritative.
          </p>
        </div>
        <button
          type="button"
          onClick={copyPromptToClipboard}
          className="min-h-9 shrink-0 border border-rule px-3 text-[11.5px] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-rule-strong hover:text-ink"
          title={copyPrompt}
        >
          {copyLabel}
        </button>
      </div>
    </div>
  );
}
