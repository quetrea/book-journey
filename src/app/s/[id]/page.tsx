import { SessionRoomPageClient } from "@/features/sessions/ui/SessionRoomPageClient";

type SessionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;

  return <SessionRoomPageClient sessionId={id} />;
}
