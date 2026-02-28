import { NextResponse } from "next/server";

import { getQueueForSession } from "@/features/queue/server/queueProxy";
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
    const queue = await getQueueForSession(sessionId);
    return NextResponse.json({ queue });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json({ error: normalized.message }, { status: normalized.status });
  }
}
