export type SessionListItem = {
  _id: string;
  _creationTime: number;
  bookTitle: string;
  authorName?: string;
  title?: string;
  synopsis?: string;
  createdBy: string;
  createdAt: number;
  status: "active" | "ended";
  endedAt?: number;
  hostName?: string;
  hostImage?: string;
};

export type SessionDetailsPayload = {
  session: SessionListItem;
  hostName?: string;
  hostImage?: string;
  viewerUserId?: string;
  isHost: boolean;
  isPasscodeProtected: boolean;
  hasPasscodeAccess: boolean;
};
