import { ConvexHttpClient } from "convex/browser";

import type { ParticipantListItem } from "@/features/participants/types";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

function normalizeServerKey(value: string | undefined) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function getServerConfig() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const serverKey =
    normalizeServerKey(process.env.SESSIONS_SERVER_KEY) ||
    normalizeServerKey(process.env.PARTICIPANTS_SERVER_KEY);

  if (!convexUrl || !serverKey) {
    throw new Error("Server session proxy is not configured.");
  }

  return { convexUrl, serverKey };
}

function createClient(convexUrl: string) {
  return new ConvexHttpClient(convexUrl);
}

type UpsertParticipantProfilePayload = {
  discordId: string;
  name: string;
  image?: string | null;
};

export async function upsertParticipantProfileForDiscord(
  payload: UpsertParticipantProfilePayload,
) {
  const { convexUrl } = getServerConfig();
  const client = createClient(convexUrl);

  return client.mutation(api.users.upsertCurrentUser, {
    discordId: payload.discordId,
    name: payload.name,
    image: payload.image ?? undefined,
  });
}

export async function joinSessionForDiscord(discordId: string, sessionId: string) {
  const { convexUrl, serverKey } = getServerConfig();
  const client = createClient(convexUrl);

  return client.mutation(api.sessions.joinSessionServer, {
    serverKey,
    discordId,
    sessionId: sessionId as Id<"sessions">,
  });
}

export async function listParticipantsForSession(sessionId: string) {
  const { convexUrl, serverKey } = getServerConfig();
  const client = createClient(convexUrl);

  return client.query(api.sessions.listParticipantsServer, {
    serverKey,
    sessionId: sessionId as Id<"sessions">,
  }) as Promise<ParticipantListItem[]>;
}

export async function isSessionParticipantForDiscord(
  discordId: string,
  sessionId: string,
) {
  const { convexUrl, serverKey } = getServerConfig();
  const client = createClient(convexUrl);

  return client.query(api.sessions.isParticipantServer, {
    serverKey,
    discordId,
    sessionId: sessionId as Id<"sessions">,
  });
}
