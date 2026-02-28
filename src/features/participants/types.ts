export type ParticipantListItem = {
  userId: string;
  name: string;
  image?: string;
  role: "host" | "reader";
  joinedAt: number;
};
