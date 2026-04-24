"use client";

import { useState } from "react";

export type LlmPromptOption = {
  id: string;
  label: string;
  prompt: string;
  subtitle?: string;
};

export function LlmPromptPanel({
  prompts,
  blurb,
  variant = "list",
}: {
  prompts: LlmPromptOption[];
  blurb: string;
  variant?: "list" | "button";
}) {
  const [copyLabels, setCopyLabels] = useState<Record<string, string>>({});

  async function copyPrompt(id: string, prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyLabels((labels) => ({ ...labels, [id]: "Copied ✓" }));
      window.setTimeout(
        () =>
          setCopyLabels((labels) => ({
            ...labels,
            [id]: "Copy prompt",
          })),
        1600
      );
    } catch {
      setCopyLabels((labels) => ({ ...labels, [id]: "Copy failed" }));
      window.setTimeout(
        () =>
          setCopyLabels((labels) => ({
            ...labels,
            [id]: "Copy prompt",
          })),
        1600
      );
    }
  }

  if (variant === "button" && prompts.length === 1) {
    const option = prompts[0];
    return (
      <div className="mt-3 flex items-start justify-between gap-3 border border-rule bg-paper-raised p-3">
        <div>
          <p className="eyebrow">Ask LLM Chat</p>
          <p className="mt-0.5 text-[11px] italic text-ink-mute">{blurb}</p>
        </div>
        <button
          type="button"
          onClick={() => copyPrompt(option.id, option.prompt)}
          className="min-h-9 shrink-0 border border-rule px-3 text-[11.5px] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-rule-strong hover:text-ink"
          title={option.prompt}
        >
          {copyLabels[option.id] ?? "Copy prompt"}
        </button>
      </div>
    );
  }

  return (
    <details className="mt-4 border border-rule bg-paper-raised p-3">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Ask LLM Chat</p>
          <p className="mt-0.5 text-[11px] italic text-ink-mute">{blurb}</p>
        </div>
        <span className="min-h-9 shrink-0 border border-rule px-3 py-2 text-[11.5px] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-rule-strong hover:text-ink">
          Prompt list
        </span>
      </summary>

      <div className="mt-3 space-y-3 border-t border-rule pt-3">
        {prompts.map((option) => (
          <div key={option.id} className="border border-rule bg-surface/50 p-3">
            <p className="eyebrow">{option.label}</p>
            {option.subtitle ? (
              <p className="mt-1 text-[12px] italic text-ink-mute">{option.subtitle}</p>
            ) : null}
            <p className="mt-2 text-[13px] leading-snug text-ink-soft">{option.prompt}</p>
            <button
              type="button"
              onClick={() => copyPrompt(option.id, option.prompt)}
              className="mt-3 min-h-9 border border-rule px-3 text-[11.5px] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-rule-strong hover:text-ink"
              title={option.prompt}
            >
              {copyLabels[option.id] ?? "Copy prompt"}
            </button>
          </div>
        ))}
      </div>
    </details>
  );
}
