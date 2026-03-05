export type SessionListItem = {
  _id: string;
  _creationTime: number;
  bookTitle: string;
  authorName?: string;
  bookCoverUrl?: string;
  title?: string;
  synopsis?: string;
  createdBy: string;
  createdAt: number;
  status: "active" | "ended";
  endedAt?: number;
  accessType?: "public" | "passcode" | "private";
  isRepeatEnabled?: boolean;
  isPrivate?: boolean;
  hostName?: string;
  hostImage?: string;
};

export type SessionDetailsPayload = {
  session: SessionListItem;
  hostName?: string;
  hostImage?: string;
  viewerUserId?: string;
  viewerIsGuest?: boolean;
  isHost: boolean;
  isModerator: boolean;
  viewerRole: "host" | "moderator" | "reader" | null;
  accessType: "public" | "passcode" | "private";
  isPasscodeProtected: boolean;
  hasPasscodeAccess: boolean;
  viewerJoinRequestStatus: "pending" | "approved" | "rejected" | null;
};
