type PremidStateKind =
  | "join_screen"
  | "loading"
  | "not_found"
  | "active"
  | "ended";

type PremidPrivacyMode = "public" | "private_hidden";
type PremidViewerRole =
  | "host"
  | "moderator"
  | "reader"
  | "guest"
  | "anonymous"
  | "unknown";
type PremidQueueStatus = "reading" | "waiting" | "done" | "not_in_queue";

type PremidSessionState = {
  stateVersion: 1;
  routePath: string;
  sessionId: string;
  stateKind: PremidStateKind;
  privacyMode: PremidPrivacyMode;
  generatedAt: number;
  sessionStatus?: "active" | "ended";
  sessionStartedAt?: number;
  sessionEndedAt?: number;
  isPrivateSession: boolean;
  isPasscodeProtected: boolean;
  memberCount: number;
  bookTitle?: string;
  authorName?: string;
  sessionTitle?: string;
  currentReaderName?: string;
  viewer: {
    role: PremidViewerRole;
    isParticipant: boolean;
    queueStatus: PremidQueueStatus;
    queuePosition?: number;
  };
  queue: {
    total: number;
    activeCount: number;
    waitingCount: number;
    currentReaderName?: string;
    currentReaderPosition?: number;
  };
};

type PresenceButton = {
  label: string;
  url: string;
};

type PresenceData = {
  name?: string;
  type?: number;
  details?: string;
  state?: string;
  startTimestamp?: number;
  endTimestamp?: number;
  largeImageKey?: string;
  smallImageKey?: string;
  smallImageText?: string;
  buttons?: PresenceButton[];
};

interface PresenceInstance {
  on(eventName: "UpdateData", listener: () => void | Promise<void>): void;
  setActivity(data: PresenceData): void;
  clearActivity(): void;
}

interface PresenceConstructor {
  new (options: { clientId: string }): PresenceInstance;
}

declare const Presence: PresenceConstructor;

const SCRIPT_ID = "bookjourney-premid-state";
const SESSION_PREFIX = "/invite/";
const LOGO_URL = "https://bookreading.space/logo.png";
const CLIENT_ID = "1476980926025044010";
const SITE_URL = "https://bookreading.space";
const ACTIVITY_NAME = "BookJourney";
const ACTIVITY_TYPE_WATCHING = 3;

const presence = new Presence({ clientId: CLIENT_ID });

function buildInviteCodeFromSessionId(sessionId: string) {
  const inviteAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  function hashString(input: string, seed: number) {
    let hash = seed >>> 0;

    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619) >>> 0;
    }

    return hash >>> 0;
  }

  let left = hashString(sessionId, 2166136261) || 0x9e3779b9;
  let right =
    hashString(`${sessionId}:bookjourney`, 2166136261) || 0x85ebca6b;
  let inviteCode = "";

  for (let index = 0; index < 10; index += 1) {
    left = Math.imul(left ^ (left >>> 15), 2246822519) >>> 0;
    right = Math.imul(right ^ (right >>> 13), 3266489917) >>> 0;
    inviteCode += inviteAlphabet[(left + right + index * 17) % inviteAlphabet.length];
  }

  return inviteCode;
}

function buildButtons(sessionId: string): PresenceButton[] {
  const inviteCode = buildInviteCodeFromSessionId(sessionId);

  return [
    {
      label: "Join Session",
      url: `${SITE_URL}/invite/${inviteCode}`,
    },
    {
      label: "Open BookJourney",
      url: SITE_URL,
    },
  ];
}

function asUnixSeconds(timestampMs: number | undefined): number | undefined {
  if (!timestampMs || Number.isNaN(timestampMs)) {
    return undefined;
  }

  return Math.floor(timestampMs / 1000);
}

function readPremidState(): PremidSessionState | null {
  const script = document.getElementById(SCRIPT_ID);

  if (!script || !script.textContent) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      script.textContent
    ) as Partial<PremidSessionState>;

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.stateKind !== "string" ||
      typeof parsed.routePath !== "string"
    ) {
      return null;
    }

    return parsed as PremidSessionState;
  } catch {
    return null;
  }
}

function buildPresenceData(state: PremidSessionState): PresenceData | null {
  const startedAt = asUnixSeconds(state.sessionStartedAt);
  const buttons = buildButtons(state.sessionId);
  const baseActivity = {
    name: ACTIVITY_NAME,
    type: ACTIVITY_TYPE_WATCHING,
  };

  if (state.privacyMode === "private_hidden") {
    return {
      ...baseActivity,
      details: "In a private reading session",
      state: "BookJourney",
      startTimestamp: startedAt,
      largeImageKey: LOGO_URL,
      buttons,
    };
  }

  if (state.stateKind === "join_screen") {
    return {
      ...baseActivity,
      details: "Joining a reading session",
      state: "BookJourney",
      largeImageKey: LOGO_URL,
      buttons,
    };
  }

  if (state.stateKind === "loading") {
    return {
      ...baseActivity,
      details: "Loading session",
      state: "BookJourney",
      largeImageKey: LOGO_URL,
      buttons,
    };
  }

  if (state.stateKind === "not_found") {
    return null;
  }

  if (state.stateKind === "ended") {
    const endedState = state.bookTitle
      ? `Book: ${state.bookTitle}`
      : "BookJourney";

    return {
      ...baseActivity,
      details: "Viewing an ended session",
      state: endedState,
      startTimestamp: startedAt,
      largeImageKey: LOGO_URL,
      buttons,
    };
  }

  let details = "In a reading session";
  if (state.viewer.role === "host" || state.viewer.role === "moderator") {
    details = "Hosting a reading session";
  }

  let stateLine = "Live now";
  if (state.viewer.queueStatus === "reading") {
    stateLine = "Currently reading";
  } else if (
    state.viewer.queueStatus === "waiting" &&
    typeof state.viewer.queuePosition === "number"
  ) {
    stateLine = `In queue (#${state.viewer.queuePosition})`;
  } else if (state.currentReaderName) {
    stateLine = `Current reader: ${state.currentReaderName}`;
  }

  if (state.bookTitle) {
    stateLine = `${stateLine} | ${state.bookTitle}`;
  }

  return {
    ...baseActivity,
    details,
    state: stateLine,
    startTimestamp: startedAt,
    largeImageKey: LOGO_URL,
    buttons,
  };
}

presence.on("UpdateData", () => {
  if (!document.location.pathname.startsWith(SESSION_PREFIX)) {
    presence.clearActivity();
    return;
  }

  const state = readPremidState();

  if (!state) {
    presence.clearActivity();
    return;
  }

  const activity = buildPresenceData(state);

  if (!activity) {
    presence.clearActivity();
    return;
  }

  presence.setActivity(activity);
});
