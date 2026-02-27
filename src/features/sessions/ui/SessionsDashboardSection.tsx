"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../../../convex/_generated/api";
import { CreateSessionCard } from "./CreateSessionCard";
import { MySessionsList } from "./MySessionsList";
import type { UserId } from "../types";

type SessionsDashboardSectionProps = {
  discordId: string;
  name: string;
  image?: string | null;
};

export function SessionsDashboardSection({ discordId, name, image }: SessionsDashboardSectionProps) {
  const upsertCurrentUser = useMutation(api.users.upsertCurrentUser);

  const [userId, setUserId] = useState<UserId | null>(null);
  const [upsertError, setUpsertError] = useState<string | null>(null);
  const upsertStartedRef = useRef(false);

  useEffect(() => {
    if (upsertStartedRef.current) {
      return;
    }

    upsertStartedRef.current = true;

    async function ensureCurrentUser() {
      try {
        const id = await upsertCurrentUser({
          discordId,
          name,
          image: image ?? undefined,
        });

        setUserId(id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to sync user profile.";
        setUpsertError(message);
      }
    }

    void ensureCurrentUser();
  }, [discordId, image, name, upsertCurrentUser]);

  return (
    <>
      <CreateSessionCard userId={userId} />

      <Card className="border-white/[0.45] bg-white/[0.66] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.07] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
        <CardHeader>
          <CardTitle>My Sessions</CardTitle>
          <CardDescription>Your hosted rooms in real time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {upsertError ? <p className="text-xs text-red-500">{upsertError}</p> : null}
          <MySessionsList userId={userId} />
        </CardContent>
      </Card>
    </>
  );
}
