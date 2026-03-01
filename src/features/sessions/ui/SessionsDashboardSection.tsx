"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateSessionModal } from "./CreateSessionModal";
import { MySessionsList } from "./MySessionsList";

export function SessionsDashboardSection() {
  return (
    <>
      <Card className="border-black/8 bg-white/72 shadow-[0_18px_50px_-28px_rgba(79,70,229,0.22),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500 md:col-span-2 dark:border-white/15 dark:bg-white/[0.07] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]">
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
    </>
  );
}
