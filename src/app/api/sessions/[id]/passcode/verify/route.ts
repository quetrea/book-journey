import { NextResponse } from "next/server";

import {
  getAuthenticatedDiscordId,
  normalizeError,
  verifySessionPasscodeForDiscord,
} from "@/features/sessions/server/sessionsProxy";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await getAuthenticatedDiscordId();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const sessionId = id?.trim() ?? "";

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode.trim() : "";

  if (!passcode) {
    return NextResponse.json({ error: "Passcode is required." }, { status: 400 });
  }

  try {
    const result = await verifySessionPasscodeForDiscord(
      auth.discordId,
      sessionId,
      passcode,
    );
    return NextResponse.json(result);
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json({ error: normalized.message }, { status: normalized.status });
  }
}
