const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_LENGTH = 10;

function hashString(input: string, seed: number) {
  let hash = seed >>> 0;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return hash >>> 0;
}

export function buildSessionInviteCodeFromSessionId(sessionId: string) {
  const normalizedSessionId = sessionId.trim();
  let left = hashString(normalizedSessionId, 2166136261) || 0x9e3779b9;
  let right =
    hashString(`${normalizedSessionId}:bookjourney`, 2166136261) || 0x85ebca6b;

  let inviteCode = "";

  for (let index = 0; index < INVITE_CODE_LENGTH; index += 1) {
    left = Math.imul(left ^ (left >>> 15), 2246822519) >>> 0;
    right = Math.imul(right ^ (right >>> 13), 3266489917) >>> 0;
    const alphabetIndex =
      (left + right + index * 17) % INVITE_ALPHABET.length;
    inviteCode += INVITE_ALPHABET[alphabetIndex];
  }

  return inviteCode;
}

export function buildSessionInvitePathFromSessionId(sessionId: string) {
  return `/invite/${buildSessionInviteCodeFromSessionId(sessionId)}`;
}

export function buildSessionPathFromSessionId(sessionId: string) {
  return `/s/${sessionId.trim()}`;
}

export function buildSessionInviteUrl(origin: string, sessionId: string) {
  return `${origin}${buildSessionInvitePathFromSessionId(sessionId)}`;
}

export function buildSessionUrl(origin: string, sessionId: string) {
  return `${origin}${buildSessionPathFromSessionId(sessionId)}`;
}
