"use client";

import { LlmPromptPanel } from "@/components/LlmPromptPanel";
import type { InteractionPair } from "@/lib/interactions";

export function InteractionExplanation({
  pair,
}: {
  pair: InteractionPair;
}) {
  const copyPrompt = `Check drug interaction between ${pair.a.name} and ${pair.b.name}. Explain the mechanism, the clinical significance, and how to interpret this interaction in practice.`;

  return (
    <LlmPromptPanel
      blurb="Copy a prompt for another chat app. Deterministic result above remains authoritative."
      prompts={[
        {
          id: `${pair.a.rxcui}-${pair.b.rxcui}`,
          label: `${pair.a.name} + ${pair.b.name}`,
          prompt: copyPrompt,
        },
      ]}
    />
  );
}
