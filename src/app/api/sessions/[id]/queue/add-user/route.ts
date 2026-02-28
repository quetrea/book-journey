import { NextRequest, NextResponse } from "next/server";

import { upsertParticipantProfileForDiscord } from "@/features/participants/server/participantsProxy";
import { addParticipantToQueueForDiscord } from "@/features/queue/server/queueProxy";
import { requireQueueMutationPasscodeGrant } from "@/features/sessions/server/sessionPasscodeGrant";
import {
  getAuthenticatedDiscordProfile,
  normalizeError,
} from "@/features/sessions/server/sessionsProxy";

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
    return NextResponse.json(
      { error: "sessionId is required." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const targetUserId =
    typeof body?.targetUserId === "string" ? body.targetUserId.trim() : "";

  if (!targetUserId) {
    return NextResponse.json(
      { error: "targetUserId is required." },
      { status: 400 }
    );
  }

  try {
    const passcodeGrantError = await requireQueueMutationPasscodeGrant(
      request,
      auth.discordId,
      sessionId
    );

    if (passcodeGrantError) {
      return passcodeGrantError;
    }

    await upsertParticipantProfileForDiscord({
      discordId: auth.discordId,
      name: auth.name,
      image: auth.image,
    });
    await addParticipantToQueueForDiscord(
      auth.discordId,
      sessionId,
      targetUserId
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json(
      { error: normalized.message },
      { status: normalized.status }
    );
  }
}
