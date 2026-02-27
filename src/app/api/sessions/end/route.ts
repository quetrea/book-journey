import { NextResponse } from "next/server";

import {
  endSessionForDiscord,
  getAuthenticatedDiscordId,
  normalizeError,
} from "@/features/sessions/server/sessionsProxy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await getAuthenticatedDiscordId();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }

  try {
    const endedSessionId = await endSessionForDiscord(auth.discordId, sessionId);
    return NextResponse.json({ sessionId: endedSessionId });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json({ error: normalized.message }, { status: normalized.status });
  }
}
