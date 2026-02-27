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
};
