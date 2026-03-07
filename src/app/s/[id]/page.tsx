import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SessionRoomPageClient } from "@/features/sessions/ui/SessionRoomPageClient";
import { getSessionMetadataPublic } from "@/features/sessions/server/publicSession";
import { buildDefaultOg, buildDefaultTwitter, toAbsoluteUrl } from "@/lib/seo";

type SessionPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: SessionPageProps): Promise<Metadata> {
  const { id } = await params;
  const sessionPath = `/s/${id}`;
  const data = await getSessionMetadataPublic(id);

  if (!data) {
    return {
      title: "Session not found",
      description: "This BookJourney session does not exist or is no longer available.",
      alternates: {
        canonical: sessionPath,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const isProtected =
    data.accessType === "private" ||
    data.accessType === "passcode" ||
    Boolean(data.isPasscodeProtected);

  if (isProtected) {
    const title = "Protected session";
    const description = "Join this protected reading session on BookJourney.";

    return {
      title,
      description,
      alternates: {
        canonical: sessionPath,
      },
      openGraph: buildDefaultOg({
        url: toAbsoluteUrl(sessionPath),
        title,
        description,
      }),
      twitter: buildDefaultTwitter({
        card: "summary_large_image",
        title,
        description,
      }),
    };
  }

  const sessionName = data.title?.trim() || data.bookTitle;
  const statusLabel = data.status === "active" ? "Active" : "Ended";
  const parts = [
    data.authorName ? `by ${data.authorName}` : null,
    `${statusLabel} | ${data.memberCount} member${data.memberCount !== 1 ? "s" : ""}`,
    data.hostName ? `Host: ${data.hostName}` : null,
  ].filter(Boolean);
  const description = `${data.bookTitle}${parts.length ? ` - ${parts.join(" | ")}` : ""}`;

  return {
    title: sessionName,
    description,
    alternates: {
      canonical: sessionPath,
    },
    openGraph: buildDefaultOg({
      url: toAbsoluteUrl(sessionPath),
      title: sessionName,
      description,
    }),
    twitter: buildDefaultTwitter({
      card: "summary_large_image",
      title: sessionName,
      description,
    }),
  };
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;
  const data = await getSessionMetadataPublic(id);

  if (!data) {
    notFound();
  }

  return <SessionRoomPageClient sessionId={id} />;
}
