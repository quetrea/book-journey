import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { buildSessionPathFromSessionId } from "@/features/sessions/lib/inviteLinks";
import { resolveSessionInvitePublic } from "@/features/sessions/server/publicSession";
import {
  buildDefaultOg,
  buildDefaultTwitter,
  toAbsoluteUrl,
} from "@/lib/seo";

type InvitePageProps = {
  params: Promise<{ code: string }>;
};

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
    const data = await resolveSessionInvitePublic(code);

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
  const data = await resolveSessionInvitePublic(code);

  if (!data) {
    notFound();
  }

  redirect(buildSessionPathFromSessionId(data.sessionId));
}
