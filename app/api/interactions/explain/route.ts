import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { z } from "zod";
import {
  buildExplanationPrompt,
  type InteractionPair,
} from "@/lib/interactions";

export const maxDuration = 30;

const pairSchema: z.ZodType<InteractionPair> = z.object({
  a: z.object({
    rxcui: z.string().trim().min(1),
    name: z.string().trim().min(1),
  }),
  b: z.object({
    rxcui: z.string().trim().min(1),
    name: z.string().trim().min(1),
  }),
  severity: z.enum(["Contraindicated", "Major", "Moderate", "Minor"]),
  verdict: z.string().trim().min(1),
  mechanism_class: z.string().trim().min(1).optional(),
  management: z.string().trim().min(1).optional(),
  sources: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        version: z.string().trim().min(1),
      })
    )
    .min(1),
});

const requestSchema = z.object({
  pair: pairSchema,
  dataVersion: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Invalid explanation payload" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: "Explainer unavailable. Anthropic API key is not configured." },
        { status: 503 }
      );
    }

    const result = streamText({
      model: anthropic("claude-sonnet-4-5"),
      temperature: 0,
      maxOutputTokens: 220,
      prompt: buildExplanationPrompt(parsed.data.pair, parsed.data.dataVersion),
      onError({ error }) {
        console.error("Interaction explainer stream failed", error);
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Interaction explainer route failed", error);
    return Response.json(
      { error: "Unable to generate explanation" },
      { status: 500 }
    );
  }
}
