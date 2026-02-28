import { NextResponse } from "next/server";

import {
  getAuthenticatedDiscordId,
  listSessionsForDiscord,
  normalizeError,
} from "@/features/sessions/server/sessionsProxy";

export const runtime = "nodejs";

export async function GET() {
  const auth = await getAuthenticatedDiscordId();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const sessions = await listSessionsForDiscord(auth.discordId);
    return NextResponse.json({ sessions });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json({ error: normalized.message }, { status: normalized.status });
  }
}
