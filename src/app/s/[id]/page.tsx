import { redirect } from "next/navigation";

import { buildSessionInvitePathFromSessionId } from "@/features/sessions/lib/inviteLinks";

type SessionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;

  redirect(buildSessionInvitePathFromSessionId(id));
}
