import { ConvexHttpClient } from "convex/browser";
import type { Metadata } from "next";

import { SessionRoomPageClient } from "@/features/sessions/ui/SessionRoomPageClient";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type SessionPageProps = {
  params: Promise<{ id: string }>;
};

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function generateMetadata({ params }: SessionPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const data = await convex.query(api.sessions.getSessionMetadataPublic, {
      sessionId: id as Id<"sessions">,
    });

    if (!data) {
      return { title: "Session not found" };
    }

    const sessionName = data.title ?? data.bookTitle;
    const statusLabel = data.status === "active" ? "🟢 Active" : "⚪ Ended";
    const parts = [
      data.authorName ? `by ${data.authorName}` : null,
      `${statusLabel} · ${data.memberCount} member${data.memberCount !== 1 ? "s" : ""}`,
      data.hostName ? `Host: ${data.hostName}` : null,
    ].filter(Boolean);

    const description = `📚 ${data.bookTitle}${parts.length ? " — " + parts.join(" · ") : ""}`;

    return {
      title: sessionName,
      description,
      openGraph: {
        title: `📚 ${sessionName}`,
        description,
        type: "website",
        siteName: "BookJourney",
      },
      twitter: {
        card: "summary",
        title: `📚 ${sessionName}`,
        description,
      },
    };
  } catch {
    return { title: "BookJourney Session" };
  }
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;

  return <SessionRoomPageClient sessionId={id} />;
}
