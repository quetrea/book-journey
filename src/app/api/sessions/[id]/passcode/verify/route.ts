import { NextRequest, NextResponse } from "next/server";

import {
  getAuthenticatedDiscordId,
  normalizeError,
  verifySessionPasscodeForDiscord,
} from "@/features/sessions/server/sessionsProxy";
import {
  clearPasscodeGrantCookie,
  createPasscodeGrantToken,
  setPasscodeGrantCookie,
} from "@/features/sessions/server/sessionPasscodeGrant";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
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
    const response = NextResponse.json(result);

    if (result.verified && result.isPasscodeProtected) {
      const grantToken = createPasscodeGrantToken({
        sessionId,
        discordId: auth.discordId,
      });
      setPasscodeGrantCookie(response, sessionId, grantToken);
    } else {
      clearPasscodeGrantCookie(response, sessionId);
    }

    return response;
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json({ error: normalized.message }, { status: normalized.status });
  }
}
