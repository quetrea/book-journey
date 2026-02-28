import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

import type { QueueItem } from "@/features/queue/types";
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
    normalizeServerKey(process.env.PARTICIPANTS_SERVER_KEY) ||
    normalizeServerKey(process.env.QUEUE_SERVER_KEY);

  if (!convexUrl || !serverKey) {
    throw new Error("Server session proxy is not configured.");
  }

  return { convexUrl, serverKey };
}

function createClient(convexUrl: string) {
  return new ConvexHttpClient(convexUrl);
}

export async function getQueueForSession(sessionId: string) {
  const { convexUrl, serverKey } = getServerConfig();
  const client = createClient(convexUrl);

  return client.query(api.queue.getQueueServer, {
    serverKey,
    sessionId: sessionId as Id<"sessions">,
  }) as Promise<QueueItem[]>;
}

export async function joinQueueForDiscord(discordId: string, sessionId: string) {
  const { convexUrl, serverKey } = getServerConfig();
  const client = createClient(convexUrl);

  return client.mutation(api.queue.joinQueueServer, {
    serverKey,
    discordId,
    sessionId: sessionId as Id<"sessions">,
  });
}

export async function leaveQueueForDiscord(discordId: string, sessionId: string) {
  const { convexUrl, serverKey } = getServerConfig();
  const client = createClient(convexUrl);

  return client.mutation(api.queue.leaveQueueServer, {
    serverKey,
    discordId,
    sessionId: sessionId as Id<"sessions">,
  });
}

export async function skipMyTurnForDiscord(discordId: string, sessionId: string) {
  const { convexUrl, serverKey } = getServerConfig();
  const client = createClient(convexUrl);

  return client.mutation(api.queue.skipMyTurnServer, {
    serverKey,
    discordId,
    sessionId: sessionId as Id<"sessions">,
  });
}

export async function advanceQueueForDiscord(discordId: string, sessionId: string) {
  const { convexUrl, serverKey } = getServerConfig();
  const client = createClient(convexUrl);

  return client.mutation(api.queue.advanceQueueServer, {
    serverKey,
    discordId,
    sessionId: sessionId as Id<"sessions">,
  });
}

export async function addParticipantToQueueForDiscord(
  discordId: string,
  sessionId: string,
  targetUserId: string,
) {
  const { convexUrl, serverKey } = getServerConfig();
  const client = createClient(convexUrl);

  return client.mutation(makeFunctionReference<"mutation">("queue:addUserToQueueServer"), {
    serverKey,
    discordId,
    sessionId: sessionId as Id<"sessions">,
    targetUserId: targetUserId as Id<"users">,
  });
}
