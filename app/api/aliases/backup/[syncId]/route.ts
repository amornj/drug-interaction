import { get, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

function blobPath(syncId: string) {
  return `aliases/${syncId}.json`;
}

function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function validateSyncId(syncId: string) {
  return /^[a-zA-Z0-9_-]{8,}$/.test(syncId);
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Unexpected alias backup storage error.";
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ syncId: string }> }
) {
  try {
    if (!isBlobConfigured()) {
      return NextResponse.json(
        { error: "Alias backup storage is not configured." },
        { status: 503 }
      );
    }

    const { syncId } = await context.params;
    if (!validateSyncId(syncId)) {
      return NextResponse.json({ error: "Invalid sync identifier." }, { status: 400 });
    }

    const blob = await get(blobPath(syncId), {
      access: "private",
      useCache: false,
    });

    if (!blob) {
      return NextResponse.json({ error: "Alias backup not found." }, { status: 404 });
    }

    if (blob.statusCode !== 200) {
      return NextResponse.json(
        { error: "Could not fetch alias backup payload." },
        { status: 502 }
      );
    }

    const text = await new Response(blob.stream).text();
    const json = JSON.parse(text);
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      { error: `Alias backup fetch failed: ${errorMessage(error)}` },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ syncId: string }> }
) {
  try {
    if (!isBlobConfigured()) {
      return NextResponse.json(
        { error: "Alias backup storage is not configured." },
        { status: 503 }
      );
    }

    const { syncId } = await context.params;
    if (!validateSyncId(syncId)) {
      return NextResponse.json({ error: "Invalid sync identifier." }, { status: 400 });
    }

    const payload = await request.text();
    const uploaded = await put(blobPath(syncId), payload, {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
      allowOverwrite: true,
    });

    return NextResponse.json({
      url: uploaded.url,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Alias backup upload failed: ${errorMessage(error)}` },
      { status: 500 }
    );
  }
}
