"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useThemeGlow } from "@/hooks/useThemeGlow";
import { CreateSessionModal } from "./CreateSessionModal";
import { JoinedSessionsList } from "./JoinedSessionsList";
import { MySessionsList } from "./MySessionsList";

type SessionsDashboardSectionProps = {
  isGuest?: boolean;
};

export function SessionsDashboardSection({ isGuest }: SessionsDashboardSectionProps) {
  const { cardShadow } = useThemeGlow();
  const { signIn } = useAuthActions();
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handleDiscordSignIn() {
    setIsSigningIn(true);
    try {
      await signIn("discord");
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <>
      {!isGuest && (
        <Card
          className="animate-in fade-in slide-in-from-bottom-3 [animation-delay:100ms] animation-duration-[500ms] fill-mode-[both] border-black/8 bg-white/72 backdrop-blur-xl md:col-span-2 dark:border-white/15 dark:bg-white/[0.07]"
          style={{ boxShadow: cardShadow }}
        >
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>My Sessions</CardTitle>
              <CardDescription>Your hosted rooms in real time.</CardDescription>
            </div>
            <CreateSessionModal />
          </CardHeader>
          <CardContent className="space-y-3">
            <MySessionsList />
          </CardContent>
        </Card>
      )}

      <Card
        className="animate-in fade-in slide-in-from-bottom-3 [animation-delay:160ms] animation-duration-[500ms] fill-mode-[both] border-black/8 bg-white/72 backdrop-blur-xl md:col-span-2 dark:border-white/15 dark:bg-white/[0.07]"
        style={{ boxShadow: cardShadow }}
      >
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Joined Sessions</CardTitle>
            <CardDescription>Sessions you joined as a reader.</CardDescription>
          </div>
          {isGuest && (
            <Button
              type="button"
              size="sm"
              onClick={() => void handleDiscordSignIn()}
              disabled={isSigningIn}
              className="w-full gap-2 bg-[#5865F2] text-white hover:bg-[#4752c4] sm:w-auto"
            >
              {isSigningIn ? "Redirecting..." : "Sign in with Discord"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {isGuest && (
            <p className="text-xs text-muted-foreground">
              Sign in with Discord to create and host your own sessions.
            </p>
          )}
          <JoinedSessionsList />
        </CardContent>
      </Card>
    </>
  );
}
