import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkInteractions, type InteractionCheckResponse } from "@/lib/interactions";

export const runtime = "nodejs";

const requestSchema = z.object({
  rxcuis: z.array(z.string().trim().min(1)).min(2),
});

const responseCache = new Map<string, InteractionCheckResponse>();

function cacheKey(rxcuis: string[]) {
  return [...new Set(rxcuis)].sort((left, right) => left.localeCompare(right)).join("|");
}

export async function POST(request: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const key = cacheKey(parsed.data.rxcuis);
    const cached = responseCache.get(key);
    if (cached) {
      return NextResponse.json(cached);
    }

    const result = checkInteractions(parsed.data.rxcuis);
    responseCache.set(key, result);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Unable to check interactions" },
      { status: 500 }
    );
  }
}
