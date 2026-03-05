export type QueueItem = {
  queueItemId: string;
  userId: string;
  name: string;
  image?: string;
  position: number;
  status: "waiting" | "reading" | "done";
  isSkipped?: boolean;
  skipReason?: string;
  joinedAt: number;
};
