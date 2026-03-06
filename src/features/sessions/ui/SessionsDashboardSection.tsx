"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateSessionModal } from "./CreateSessionModal";
import { JoinedSessionsList } from "./JoinedSessionsList";
import { MySessionsList } from "./MySessionsList";

type SessionsDashboardSectionProps = {
  /** undefined = profile still loading; false = Discord user; true = guest */
  isGuest: boolean | undefined;
};

export function SessionsDashboardSection({ isGuest }: SessionsDashboardSectionProps) {
  return (
    <>
      <Card
        className="animate-in fade-in slide-in-from-bottom-3 [animation-delay:100ms] animation-duration-[500ms] fill-mode-[both] border-cyan-200/40 bg-[rgba(237,255,253,0.42)] shadow-[0_14px_36px_rgba(6,182,212,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-2xl md:col-span-2 dark:border-cyan-300/14 dark:bg-[rgba(255,255,255,0.05)] dark:shadow-[0_16px_42px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.05)]"
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
        className="animate-in fade-in slide-in-from-bottom-3 [animation-delay:160ms] animation-duration-[500ms] fill-mode-[both] border-emerald-200/40 bg-[rgba(235,255,249,0.40)] shadow-[0_14px_36px_rgba(16,185,129,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-2xl md:col-span-2 dark:border-emerald-300/14 dark:bg-[rgba(255,255,255,0.05)] dark:shadow-[0_16px_42px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.05)]"
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
              Joined sessions stay available during your guest session until you sign out.
            </p>
          )}
          <JoinedSessionsList />
        </CardContent>
      </Card>
    </>
  );
}
