export type ParticipantListItem = {
  userId: string;
  name: string;
  image?: string;
  role: "host" | "moderator" | "reader";
  joinedAt: number;
};
