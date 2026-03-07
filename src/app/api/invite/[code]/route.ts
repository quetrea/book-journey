import { NextResponse } from "next/server";

import {
  buildSessionPathFromSessionId,
} from "@/features/sessions/lib/inviteLinks";
import { resolveSessionInvitePublic } from "@/features/sessions/server/publicSession";

type InviteRouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_: Request, { params }: InviteRouteContext) {
  const { code } = await params;
  const session = await resolveSessionInvitePublic(code);

  if (!session) {
    return NextResponse.json(
      { error: "Invite not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ...session,
    sessionPath: buildSessionPathFromSessionId(session.sessionId),
  });
}
