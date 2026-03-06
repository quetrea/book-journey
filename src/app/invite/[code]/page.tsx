import { ConvexHttpClient } from "convex/browser";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SessionRoomPageClient } from "@/features/sessions/ui/SessionRoomPageClient";
import {
  buildDefaultOg,
  buildDefaultTwitter,
  toAbsoluteUrl,
} from "@/lib/seo";
import { api } from "../../../../convex/_generated/api";

type InvitePageProps = {
  params: Promise<{ code: string }>;
};

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function buildNoIndexMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: buildDefaultOg({
      url: toAbsoluteUrl(path),
      title,
      description,
    }),
    twitter: buildDefaultTwitter({
      title,
      description,
    }),
  };
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { code } = await params;
  const invitePath = `/invite/${code}`;

  try {
    const data = await convex.query(api.sessions.resolveSessionInvitePublic, {
      inviteCode: code,
    });

    if (!data) {
      return buildNoIndexMetadata(
        "Session not found",
        "This BookJourney invite link does not exist or is no longer available.",
        invitePath,
      );
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
          canonical: invitePath,
        },
        openGraph: buildDefaultOg({
          url: toAbsoluteUrl(invitePath),
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
        canonical: invitePath,
      },
      openGraph: buildDefaultOg({
        url: toAbsoluteUrl(invitePath),
        title: sessionName,
        description,
      }),
      twitter: buildDefaultTwitter({
        card: "summary_large_image",
        title: sessionName,
        description,
      }),
    };
  } catch {
    return buildNoIndexMetadata(
      "BookJourney session",
      "Session metadata is temporarily unavailable.",
      invitePath,
    );
  }
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;
  const data = await convex.query(api.sessions.resolveSessionInvitePublic, {
    inviteCode: code,
  });

  if (!data) {
    notFound();
  }

  return <SessionRoomPageClient sessionId={data.sessionId} />;
}
