import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSessionByIdForAccess } from "@/features/sessions/server/sessionsProxy";

const PASSCODE_GRANT_COOKIE_NAME = "bookjourney.session.passcode_grant";
const PASSCODE_GRANT_TTL_SECONDS = 15 * 60;

type PasscodeGrantPayload = {
  v: 1;
  sid: string;
  did: string;
  exp: number;
  nonce: string;
};

type PasscodeGrantTokenInput = {
  sessionId: string;
  discordId: string;
  ttlSeconds?: number;
};

function normalizeSecret(value: string | undefined) {
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

function getPasscodeGrantSecret() {
  const secret =
    normalizeSecret(process.env.NEXTAUTH_SECRET) ||
    normalizeSecret(process.env.AUTH_SECRET) ||
    normalizeSecret(process.env.SESSIONS_SERVER_KEY) ||
    normalizeSecret(process.env.PARTICIPANTS_SERVER_KEY);

  if (!secret) {
    throw new Error("Passcode grant secret is not configured.");
  }

  return secret;
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url");
}

function getGrantCookiePath(sessionId: string) {
  return `/api/sessions/${sessionId}`;
}

function signPasscodeGrantPayload(encodedPayload: string) {
  return createHmac("sha256", getPasscodeGrantSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createPasscodeGrantToken({
  sessionId,
  discordId,
  ttlSeconds = PASSCODE_GRANT_TTL_SECONDS,
}: PasscodeGrantTokenInput) {
  const payload: PasscodeGrantPayload = {
    v: 1,
    sid: sessionId,
    did: discordId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    nonce: randomBytes(8).toString("hex"),
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPasscodeGrantPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyPasscodeGrantToken(
  token: string,
  sessionId: string,
  discordId: string,
) {
  if (!token || !sessionId || !discordId) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return false;
  }

  const [encodedPayload, providedSignature] = parts;
  let providedSignatureBuffer: Buffer;
  let expectedSignatureBuffer: Buffer;

  try {
    const expectedSignature = signPasscodeGrantPayload(encodedPayload);
    providedSignatureBuffer = base64UrlDecode(providedSignature);
    expectedSignatureBuffer = base64UrlDecode(expectedSignature);
  } catch {
    return false;
  }

  if (providedSignatureBuffer.length !== expectedSignatureBuffer.length) {
    return false;
  }

  if (!timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)) {
    return false;
  }

  let payload: PasscodeGrantPayload;

  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as PasscodeGrantPayload;
  } catch {
    return false;
  }

  if (payload.v !== 1) {
    return false;
  }

  if (payload.sid !== sessionId || payload.did !== discordId) {
    return false;
  }

  if (!Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  return true;
}

export function setPasscodeGrantCookie(
  response: NextResponse,
  sessionId: string,
  token: string,
  maxAgeSeconds = PASSCODE_GRANT_TTL_SECONDS,
) {
  response.cookies.set({
    name: PASSCODE_GRANT_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: getGrantCookiePath(sessionId),
    maxAge: maxAgeSeconds,
  });
}

export function clearPasscodeGrantCookie(response: NextResponse, sessionId: string) {
  response.cookies.set({
    name: PASSCODE_GRANT_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: getGrantCookiePath(sessionId),
    maxAge: 0,
  });
}

export async function requireQueueMutationPasscodeGrant(
  request: NextRequest,
  discordId: string,
  sessionId: string,
) {
  const sessionDetails = await getSessionByIdForAccess(discordId, sessionId);

  if (!sessionDetails) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  if (!sessionDetails.isPasscodeProtected || sessionDetails.isHost) {
    return null;
  }

  const token = request.cookies.get(PASSCODE_GRANT_COOKIE_NAME)?.value ?? "";
  const isValid = verifyPasscodeGrantToken(token, sessionId, discordId);

  if (isValid) {
    return null;
  }

  const unauthorizedResponse = NextResponse.json(
    { error: "Passcode verification required." },
    { status: 401 },
  );
  clearPasscodeGrantCookie(unauthorizedResponse, sessionId);
  return unauthorizedResponse;
}
