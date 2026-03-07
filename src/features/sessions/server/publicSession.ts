import "server-only";

import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function resolveSessionInvitePublic(inviteCode: string) {
  return convex.query(api.sessions.resolveSessionInvitePublic, {
    inviteCode,
  });
}

export async function getSessionMetadataPublic(sessionId: string) {
  return convex.query(api.sessions.getSessionMetadataPublic, {
    sessionId: sessionId as Id<"sessions">,
  });
}
