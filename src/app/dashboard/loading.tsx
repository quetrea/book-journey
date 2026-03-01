"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ParticlesBackground } from "@/features/dashboard/ui/ParticlesBackground";
import { useThemeGlow } from "@/hooks/useThemeGlow";

function SessionsSkeletonCard({ cardShadow }: { cardShadow: string }) {
  return (
    <Card className="border-white/45 bg-white/66 backdrop-blur-md dark:border-white/15 dark:bg-white/7" style={{ boxShadow: cardShadow }}>
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`dashboard-session-skeleton-${index}`}
            className="space-y-2 rounded-xl border border-white/[0.35] bg-white/[0.45] p-3 dark:border-white/[0.12] dark:bg-white/[0.05]"
          >
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function DashboardLoading() {
  const { sectionShadow, cardShadow } = useThemeGlow();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticlesBackground />
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(70%_48%_at_50%_0%,rgba(88,101,242,0.34),transparent_72%),linear-gradient(145deg,rgba(165,180,252,0.24),rgba(147,197,253,0.16)_45%,rgba(244,114,182,0.12))] dark:bg-[radial-gradient(70%_50%_at_50%_0%,rgba(88,101,242,0.5),transparent_72%),linear-gradient(145deg,rgba(15,23,42,0.75),rgba(49,46,129,0.48)_45%,rgba(76,29,149,0.36))]" />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="rounded-3xl border border-white/45 bg-white/56 p-5 backdrop-blur-xl animate-in fade-in duration-300 sm:p-7 dark:border-white/15 dark:bg-[#0d1222]/58" style={{ boxShadow: sectionShadow }}>
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-32 rounded-full" />
            </div>
          </header>

          <Separator className="my-5 bg-white/55 dark:bg-white/10" />

          <div className="grid gap-4 md:grid-cols-2">
            <SessionsSkeletonCard cardShadow={cardShadow} />
            <Card className="border-white/45 bg-white/66 backdrop-blur-md md:col-span-2 dark:border-white/15 dark:bg-white/7" style={{ boxShadow: cardShadow }}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-28" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-10/12" />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
