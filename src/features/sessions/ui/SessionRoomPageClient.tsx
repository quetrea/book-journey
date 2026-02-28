"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JoinSessionButton } from "@/features/participants/ui/JoinSessionButton";
import { ParticipantsList } from "@/features/participants/ui/ParticipantsList";
import type { ParticipantListItem } from "@/features/participants/types";
import { ParticlesBackground } from "@/features/dashboard/ui/ParticlesBackground";
import type { SessionDetailsPayload } from "@/features/sessions/types";
import { SessionHeaderCard } from "./SessionHeaderCard";

type SessionRoomPageClientProps = {
  sessionId: string;
};

function normalizeApiError(message: unknown) {
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  return "Request failed.";
}

export function SessionRoomPageClient({ sessionId }: SessionRoomPageClientProps) {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<SessionDetailsPayload | null>(null);
  const [sessionErrorMessage, setSessionErrorMessage] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantListItem[]>([]);
  const [isParticipantsLoading, setIsParticipantsLoading] = useState(true);
  const [participantsErrorMessage, setParticipantsErrorMessage] = useState<string | null>(null);
  const [isCurrentUserParticipant, setIsCurrentUserParticipant] = useState(false);

  const refreshSession = useCallback(async () => {
    const response = await fetch(`/api/sessions/${sessionId}`, {
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);

    if (response.status === 404) {
      setNotFound(true);
      setSessionDetails(null);
      return null;
    }

    if (!response.ok) {
      const message =
        response.status === 401
          ? "Please sign in again."
          : normalizeApiError(body?.error ?? "Failed to load session.");
      throw new Error(message);
    }

    setNotFound(false);
    const details = body as SessionDetailsPayload;
    setSessionDetails(details);
    return details;
  }, [sessionId]);

  const refreshParticipants = useCallback(
    async (showLoadingState: boolean) => {
      if (showLoadingState) {
        setIsParticipantsLoading(true);
      }

      try {
        const response = await fetch(`/api/sessions/${sessionId}/participants`, {
          cache: "no-store",
        });
        const body = await response.json().catch(() => null);

        if (response.status === 404) {
          setNotFound(true);
          setParticipants([]);
          setIsCurrentUserParticipant(false);
          return;
        }

        if (!response.ok) {
          const message =
            response.status === 401
              ? "Please sign in again."
              : normalizeApiError(body?.error ?? "Failed to load participants.");
          throw new Error(message);
        }

        const loadedParticipants = Array.isArray(body?.participants)
          ? (body.participants as ParticipantListItem[])
          : [];

        setParticipants(loadedParticipants);
        setIsCurrentUserParticipant(Boolean(body?.isCurrentUserParticipant));
        setParticipantsErrorMessage(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load participants.";
        setParticipantsErrorMessage(message);
      } finally {
        if (showLoadingState) {
          setIsParticipantsLoading(false);
        }
      }
    },
    [sessionId],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setIsInitialLoading(true);
      setSessionErrorMessage(null);
      setParticipantsErrorMessage(null);

      try {
        const details = await refreshSession();

        if (!details || cancelled) {
          return;
        }

        await refreshParticipants(true);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : "Failed to load session.";
        setSessionErrorMessage(message);
      } finally {
        if (!cancelled) {
          setIsInitialLoading(false);
        }
      }
    }

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, [refreshParticipants, refreshSession]);

  const sessionStatus = sessionDetails?.session.status;

  useEffect(() => {
    if (sessionStatus !== "active") {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const intervalMs = reducedMotion ? 10_000 : 7_000;

    const intervalId = window.setInterval(() => {
      void refreshSession();
      void refreshParticipants(false);
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshParticipants, refreshSession, sessionStatus]);

  async function handleJoined() {
    setIsCurrentUserParticipant(true);
    await refreshParticipants(true);
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticlesBackground />
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(70%_48%_at_50%_0%,rgba(88,101,242,0.34),transparent_72%),linear-gradient(145deg,rgba(165,180,252,0.24),rgba(147,197,253,0.16)_45%,rgba(244,114,182,0.12))] dark:bg-[radial-gradient(70%_50%_at_50%_0%,rgba(88,101,242,0.5),transparent_72%),linear-gradient(145deg,rgba(15,23,42,0.75),rgba(49,46,129,0.48)_45%,rgba(76,29,149,0.36))]" />
      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {isInitialLoading ? (
          <Card className="border-white/[0.45] bg-white/[0.66] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.07]">
            <CardHeader>
              <CardTitle>Loading session...</CardTitle>
            </CardHeader>
          </Card>
        ) : null}

        {!isInitialLoading && notFound ? (
          <Card className="border-white/[0.45] bg-white/[0.66] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.07]">
            <CardHeader>
              <CardTitle>Session not found</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard" className="text-sm font-medium underline">
                Back to dashboard
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {!isInitialLoading && !notFound && sessionErrorMessage ? (
          <Card className="border-white/[0.45] bg-white/[0.66] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.07]">
            <CardHeader>
              <CardTitle>Could not load session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-red-500">{sessionErrorMessage}</p>
              <Link href="/dashboard" className="text-sm font-medium underline">
                Back to dashboard
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {!isInitialLoading && !notFound && !sessionErrorMessage && sessionDetails ? (
          <section className="space-y-4">
            <SessionHeaderCard
              session={sessionDetails.session}
              hostName={sessionDetails.hostName}
              hostImage={sessionDetails.hostImage}
              memberCount={participants.length}
            />

            <JoinSessionButton
              sessionId={sessionId}
              isParticipant={isCurrentUserParticipant}
              isSessionEnded={sessionDetails.session.status === "ended"}
              onJoined={handleJoined}
            />

            <ParticipantsList
              participants={participants}
              isLoading={isParticipantsLoading}
              errorMessage={participantsErrorMessage}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}
