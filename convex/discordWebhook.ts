import { invalidateSessions } from "@convex-dev/auth/server";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const DISCORD_PING_TYPE = 0;
const DISCORD_EVENT_TYPE = 1;
const DISCORD_DEAUTHORIZED_TYPE = "APPLICATION_DEAUTHORIZED";

type DiscordWebhookPayload = {
  type?: unknown;
  event?: {
    type?: unknown;
    data?: {
      user?: {
        id?: unknown;
      };
    };
  };
};

function noContentResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function unauthorizedResponse() {
  return new Response("Unauthorized", { status: 401 });
}

function isHexString(value: string): boolean {
  return /^[0-9a-fA-F]+$/.test(value);
}

function hexToBytes(hex: string): Uint8Array {
  if (!hex || hex.length % 2 !== 0 || !isHexString(hex)) {
    throw new Error("Invalid hex string.");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function verifyDiscordRequestSignature(
  signatureHex: string,
  timestamp: string,
  rawBody: string,
  publicKeyHex: string,
) {
  const signatureBytes = hexToBytes(signatureHex);
  const payloadBytes = new TextEncoder().encode(timestamp + rawBody);
  const publicKeyBytes = hexToBytes(publicKeyHex);

  const publicKey = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(publicKeyBytes),
    { name: "Ed25519" },
    false,
    ["verify"],
  );

  return crypto.subtle.verify(
    "Ed25519",
    publicKey,
    toArrayBuffer(signatureBytes),
    toArrayBuffer(payloadBytes),
  );
}

export const discordWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const publicKeyHex = process.env.DISCORD_APPLICATION_PUBLIC_KEY?.trim();

  if (!signature || !timestamp || !publicKeyHex) {
    return unauthorizedResponse();
  }

  const timestampSeconds = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(timestampSeconds)) {
    return unauthorizedResponse();
  }

  const now = Date.now();
  const timestampMs = timestampSeconds * 1000;
  if (Math.abs(now - timestampMs) > FIVE_MINUTES_MS) {
    return unauthorizedResponse();
  }

  const rawBody = await request.text();

  let signatureValid = false;
  try {
    signatureValid = await verifyDiscordRequestSignature(
      signature,
      timestamp,
      rawBody,
      publicKeyHex,
    );
  } catch {
    signatureValid = false;
  }

  if (!signatureValid) {
    return unauthorizedResponse();
  }

  let payload: DiscordWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as DiscordWebhookPayload;
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  if (payload.type === DISCORD_PING_TYPE) {
    return noContentResponse();
  }

  if (payload.type !== DISCORD_EVENT_TYPE) {
    return noContentResponse();
  }

  if (payload.event?.type !== DISCORD_DEAUTHORIZED_TYPE) {
    return noContentResponse();
  }

  const discordUserId = payload.event?.data?.user?.id;

  if (typeof discordUserId !== "string" || !discordUserId.trim()) {
    return noContentResponse();
  }

  const authUserId = await ctx.runQuery(
    internal.users.getAuthUserIdByDiscordAccountIdInternal,
    {
      discordUserId,
    },
  );

  if (authUserId) {
    await invalidateSessions(ctx, { userId: authUserId });
  }

  return noContentResponse();
});
