export type PremidStateKind =
  | "join_screen"
  | "loading"
  | "not_found"
  | "active"
  | "ended";

export type PremidPrivacyMode = "public" | "private_hidden";

export type PremidViewerRole =
  | "host"
  | "moderator"
  | "reader"
  | "guest"
  | "anonymous"
  | "unknown";

export type PremidQueueStatus = "reading" | "waiting" | "done" | "not_in_queue";

export type PremidViewerState = {
  role: PremidViewerRole;
  isParticipant: boolean;
  queueStatus: PremidQueueStatus;
  queuePosition?: number;
};

export type PremidQueueState = {
  total: number;
  activeCount: number;
  waitingCount: number;
  currentReaderName?: string;
  currentReaderPosition?: number;
};

export type PremidSessionState = {
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
  viewer: PremidViewerState;
  queue: PremidQueueState;
};
