import { NextResponse } from "next/server";

import {
  isSessionParticipantForDiscord,
  listParticipantsForSession,
} from "@/features/participants/server/participantsProxy";
import { getAuthenticatedDiscordId, normalizeError } from "@/features/sessions/server/sessionsProxy";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await getAuthenticatedDiscordId();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const sessionId = id?.trim() ?? "";

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }

  try {
    const [participants, isCurrentUserParticipant] = await Promise.all([
      listParticipantsForSession(sessionId),
      isSessionParticipantForDiscord(auth.discordId, sessionId),
    ]);

    return NextResponse.json({
      participants,
      isCurrentUserParticipant,
    });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json({ error: normalized.message }, { status: normalized.status });
  }
}
