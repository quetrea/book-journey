import type { QueueItem } from "@/features/queue/types";
import type { SessionDetailsPayload } from "@/features/sessions/types";

import type {
  PremidQueueStatus,
  PremidSessionState,
  PremidViewerRole,
} from "./types";

type BuildPremidSessionStateInput = {
  routePath: string;
  sessionId: string;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  isDataLoading: boolean;
  sessionDetails: SessionDetailsPayload | null | undefined;
  queue: QueueItem[] | undefined;
  participantsCount: number;
  isCurrentUserParticipant: boolean;
};

function resolveViewerRole(
  isAuthenticated: boolean,
  sessionDetails: SessionDetailsPayload | null | undefined,
): PremidViewerRole {
  if (!isAuthenticated) {
    return "anonymous";
  }

  if (sessionDetails?.viewerRole) {
    return sessionDetails.viewerRole;
  }

  if (sessionDetails?.viewerIsGuest) {
    return "guest";
  }

  return "unknown";
}

function resolveQueueStatus(viewerQueueItem: QueueItem | undefined): PremidQueueStatus {
  if (!viewerQueueItem) {
    return "not_in_queue";
  }

  return viewerQueueItem.status;
}

export function buildPremidSessionState({
  routePath,
  sessionId,
  isAuthLoading,
  isAuthenticated,
  isDataLoading,
  sessionDetails,
  queue,
  participantsCount,
  isCurrentUserParticipant,
}: BuildPremidSessionStateInput): PremidSessionState {
  const queueItems = queue ?? [];
  const currentReader = queueItems.find((item) => item.status === "reading");
  const viewerQueueItem = sessionDetails?.viewerUserId
    ? queueItems.find((item) => item.userId === sessionDetails.viewerUserId)
    : undefined;

  const isPrivateSession = Boolean(sessionDetails?.session.isPrivate);
  const isPasscodeProtected = Boolean(sessionDetails?.isPasscodeProtected);
  const privacyMode = isPrivateSession || isPasscodeProtected ? "private_hidden" : "public";

  const baseState: PremidSessionState = {
    stateVersion: 1,
    routePath,
    sessionId,
    stateKind: "loading",
    privacyMode,
    generatedAt: Date.now(),
    sessionStatus: sessionDetails?.session.status,
    sessionStartedAt: sessionDetails?.session.createdAt,
    sessionEndedAt: sessionDetails?.session.endedAt,
    isPrivateSession,
    isPasscodeProtected,
    memberCount: participantsCount,
    viewer: {
      role: resolveViewerRole(isAuthenticated, sessionDetails),
      isParticipant: isCurrentUserParticipant,
      queueStatus: resolveQueueStatus(viewerQueueItem),
      queuePosition: viewerQueueItem ? viewerQueueItem.position + 1 : undefined,
    },
    queue: {
      total: queueItems.length,
      activeCount: queueItems.filter((item) => item.status !== "done").length,
      waitingCount: queueItems.filter((item) => item.status === "waiting").length,
      currentReaderName:
        privacyMode === "public" ? currentReader?.name : undefined,
      currentReaderPosition: currentReader ? currentReader.position + 1 : undefined,
    },
  };

  if (isAuthLoading || isDataLoading || (isAuthenticated && sessionDetails === undefined)) {
    return baseState;
  }

  if (!isAuthenticated) {
    return {
      ...baseState,
      stateKind: "join_screen",
      privacyMode: "private_hidden",
      viewer: {
        ...baseState.viewer,
        role: "anonymous",
        isParticipant: false,
        queueStatus: "not_in_queue",
        queuePosition: undefined,
      },
      bookTitle: undefined,
      authorName: undefined,
      sessionTitle: undefined,
      currentReaderName: undefined,
    };
  }

  if (sessionDetails === null) {
    return {
      ...baseState,
      stateKind: "not_found",
      bookTitle: undefined,
      authorName: undefined,
      sessionTitle: undefined,
      currentReaderName: undefined,
    };
  }

  if (!sessionDetails) {
    return baseState;
  }

  const stateKind = sessionDetails.session.status === "ended" ? "ended" : "active";

  return {
    ...baseState,
    stateKind,
    sessionStatus: sessionDetails.session.status,
    sessionStartedAt: sessionDetails.session.createdAt,
    sessionEndedAt: sessionDetails.session.endedAt,
    bookTitle: privacyMode === "public" ? sessionDetails.session.bookTitle : undefined,
    authorName: privacyMode === "public" ? sessionDetails.session.authorName : undefined,
    sessionTitle: privacyMode === "public" ? sessionDetails.session.title : undefined,
    currentReaderName: privacyMode === "public" ? currentReader?.name : undefined,
  };
}
