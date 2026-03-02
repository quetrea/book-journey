"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useThemeGlow } from "@/hooks/useThemeGlow";
import { CreateSessionModal } from "./CreateSessionModal";
import { JoinedSessionsList } from "./JoinedSessionsList";
import { MySessionsList } from "./MySessionsList";

export function SessionsDashboardSection() {
  const { cardShadow } = useThemeGlow();

  return (
    <>
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

      <Card
        className="animate-in fade-in slide-in-from-bottom-3 [animation-delay:160ms] animation-duration-[500ms] fill-mode-[both] border-black/8 bg-white/72 backdrop-blur-xl md:col-span-2 dark:border-white/15 dark:bg-white/[0.07]"
        style={{ boxShadow: cardShadow }}
      >
        <CardHeader>
          <CardTitle>Joined Sessions</CardTitle>
          <CardDescription>Sessions you joined as a reader.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <JoinedSessionsList />
        </CardContent>
      </Card>
    </>
  );
}
