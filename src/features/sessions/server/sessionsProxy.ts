import { ConvexHttpClient } from "convex/browser";

import { getAppSession } from "@/features/auth/server/session";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type AuthDiscordResult =
  | { ok: true; discordId: string }
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
  const serverKey = normalizeServerKey(process.env.SESSIONS_SERVER_KEY);

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

  return { status: 500, message };
}

export async function getAuthenticatedDiscordId(): Promise<AuthDiscordResult> {
  const session = await getAppSession();

  if (!session?.user) {
    return { ok: false, status: 401, error: "Not authenticated" };
  }

  const discordId = session.user.discordId || session.user.id;

  if (!discordId) {
    return { ok: false, status: 400, error: "Missing Discord identity" };
  }

  return { ok: true, discordId };
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
