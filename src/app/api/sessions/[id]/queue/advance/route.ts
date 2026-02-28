import { NextRequest, NextResponse } from "next/server";

import { upsertParticipantProfileForDiscord } from "@/features/participants/server/participantsProxy";
import { advanceQueueForDiscord } from "@/features/queue/server/queueProxy";
import {
  getAuthenticatedDiscordProfile,
  normalizeError,
} from "@/features/sessions/server/sessionsProxy";
import { requireQueueMutationPasscodeGrant } from "@/features/sessions/server/sessionPasscodeGrant";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await getAuthenticatedDiscordProfile();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const sessionId = id?.trim() ?? "";

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }

  try {
    const passcodeGrantError = await requireQueueMutationPasscodeGrant(
      request,
      auth.discordId,
      sessionId,
    );

    if (passcodeGrantError) {
      return passcodeGrantError;
    }

    await upsertParticipantProfileForDiscord({
      discordId: auth.discordId,
      name: auth.name,
      image: auth.image,
    });
    await advanceQueueForDiscord(auth.discordId, sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json({ error: normalized.message }, { status: normalized.status });
  }
}
