import { NextResponse } from "next/server";

import {
  createSessionForDiscord,
  ensureHostParticipantOnCreateForDiscord,
  getAuthenticatedDiscordId,
  normalizeError,
} from "@/features/sessions/server/sessionsProxy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await getAuthenticatedDiscordId();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);

  const bookTitle = typeof body?.bookTitle === "string" ? body.bookTitle : "";
  const authorName = typeof body?.authorName === "string" ? body.authorName : undefined;
  const title = typeof body?.title === "string" ? body.title : undefined;
  const synopsis = typeof body?.synopsis === "string" ? body.synopsis : undefined;

  if (!bookTitle.trim()) {
    return NextResponse.json({ error: "Book title is required." }, { status: 400 });
  }

  try {
    const sessionId = await createSessionForDiscord(auth.discordId, {
      bookTitle,
      authorName,
      title,
      synopsis,
    });
    await ensureHostParticipantOnCreateForDiscord(auth.discordId, sessionId);

    return NextResponse.json({ sessionId });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json({ error: normalized.message }, { status: normalized.status });
  }
}
