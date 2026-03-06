"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hexToRgba, useThemeGlow } from "@/hooks/useThemeGlow";
import { CreateSessionModal } from "./CreateSessionModal";
import { JoinedSessionsList } from "./JoinedSessionsList";
import { MySessionsList } from "./MySessionsList";

type SessionsDashboardSectionProps = {
  /** undefined = profile still loading; false = Discord user; true = guest */
  isGuest: boolean | undefined;
};

export function SessionsDashboardSection({ isGuest }: SessionsDashboardSectionProps) {
  const { cardShadow, orb, isDark } = useThemeGlow();

  return (
    <>
      <Card
        className="animate-in fade-in slide-in-from-bottom-3 [animation-delay:100ms] animation-duration-[500ms] fill-mode-[both] border border-black/8 bg-white/18 backdrop-blur-[24px] md:col-span-2 dark:border-white/12 dark:bg-black/18"
        style={{
          boxShadow: cardShadow,
          backgroundColor: isDark
            ? hexToRgba(orb, 0.12)
            : "rgba(255,255,255,0.22)",
        }}
      >
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>My Sessions</CardTitle>
            <CardDescription>Your hosted rooms in real time.</CardDescription>
          </div>
          <CreateSessionModal />
        </CardHeader>
        <CardContent className="space-y-3">
          {isGuest && (
            <p className="text-xs text-muted-foreground">
              Guest sessions are temporary and all of their data is deleted immediately when you sign out.
            </p>
          )}
          <MySessionsList />
        </CardContent>
      </Card>

      <Card
        className="animate-in fade-in slide-in-from-bottom-3 [animation-delay:160ms] animation-duration-[500ms] fill-mode-[both] border border-black/8 bg-white/18 backdrop-blur-[24px] md:col-span-2 dark:border-white/12 dark:bg-black/18"
        style={{
          boxShadow: cardShadow,
          backgroundColor: isDark
            ? hexToRgba(orb, 0.1)
            : "rgba(255,255,255,0.2)",
        }}
      >
        <CardHeader>
          <div>
            <CardTitle>Joined Sessions</CardTitle>
            <CardDescription>Sessions you joined as a reader.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isGuest && (
            <p className="text-xs text-muted-foreground">
              Joined guest sessions are temporary and all of their data is deleted immediately when you sign out.
            </p>
          )}
          <JoinedSessionsList />
        </CardContent>
      </Card>
    </>
  );
}
