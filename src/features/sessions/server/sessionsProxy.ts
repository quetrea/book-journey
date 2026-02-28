import { ConvexHttpClient } from "convex/browser";

import { getAppSession } from "@/features/auth/server/session";
import type { SessionDetailsPayload } from "@/features/sessions/types";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type AuthDiscordResult =
  | { ok: true; discordId: string }
  | { ok: false; status: number; error: string };

type AuthDiscordProfileResult =
  | {
      ok: true;
      discordId: string;
      name: string;
      image?: string | null;
    }
  | { ok: false; status: number; error: string };

type CreateSessionPayload = {
  bookTitle: string;
  authorName?: string;
  title?: string;
  synopsis?: string;
};

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

export function normalizeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal Server Error";

  if (message === "Server session proxy is not configured.") {
    return { status: 500, message };
  }

  if (message === "Forbidden") {
    return { status: 403, message };
  }

  if (message === "Not authenticated") {
    return { status: 401, message };
  }

  if (message === "User not found. Refresh the dashboard and try again.") {
    return { status: 404, message };
  }

  if (message === "Session not found.") {
    return { status: 404, message };
  }

  if (message === "You can only end your own session.") {
    return { status: 403, message };
  }

  if (message === "Only the session creator can be host.") {
    return { status: 403, message };
  }

  return { status: 500, message };
}

export async function getAuthenticatedDiscordId(): Promise<AuthDiscordResult> {
  const profile = await getAuthenticatedDiscordProfile();

  if (!profile.ok) {
    return profile;
  }

  return { ok: true, discordId: profile.discordId };
}

export async function getAuthenticatedDiscordProfile(): Promise<AuthDiscordProfileResult> {
  const session = await getAppSession();

  if (!session?.user) {
    return { ok: false, status: 401, error: "Not authenticated" };
  }

  const discordId = session.user.discordId || session.user.id;

  if (!discordId) {
    return { ok: false, status: 400, error: "Missing Discord identity" };
  }

  return {
    ok: true,
    discordId,
    name: session.user.name?.trim() || "Reader",
    image: session.user.image,
  };
}

export async function createSessionForDiscord(
  discordId: string,
  payload: CreateSessionPayload,
) {
  const { convexUrl, serverKey } = getServerConfig();
  const client = createClient(convexUrl);

  return client.mutation(api.sessions.createSessionServer, {
    serverKey,
    discordId,
    ...payload,
  });
}

export async function listSessionsForDiscord(discordId: string) {
  const { convexUrl, serverKey } = getServerConfig();
  const client = createClient(convexUrl);

  return client.query(api.sessions.listMySessionsServer, {
    serverKey,
    discordId,
  });
}

export async function endSessionForDiscord(discordId: string, sessionId: string) {
  const { convexUrl, serverKey } = getServerConfig();
  const client = createClient(convexUrl);

  return client.mutation(api.sessions.endSessionServer, {
    serverKey,
    discordId,
    sessionId: sessionId as Id<"sessions">,
  });
}

export async function ensureHostParticipantOnCreateForDiscord(
  discordId: string,
  sessionId: string,
) {
  const { convexUrl, serverKey } = getServerConfig();
  const client = createClient(convexUrl);

  return client.mutation(api.sessions.ensureHostParticipantOnCreateServer, {
    serverKey,
    discordId,
    sessionId: sessionId as Id<"sessions">,
  });
}

export async function getSessionByIdForAccess(sessionId: string) {
  const { convexUrl, serverKey } = getServerConfig();
  const client = createClient(convexUrl);

  return client.query(api.sessions.getSessionByIdServer, {
    serverKey,
    sessionId: sessionId as Id<"sessions">,
  }) as Promise<SessionDetailsPayload | null>;
}
