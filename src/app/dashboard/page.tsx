"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginButton } from "@/features/auth/ui/LoginButton";
import { ParticlesBackground } from "@/features/dashboard/ui/ParticlesBackground";
import { ThemeToggle } from "@/features/dashboard/ui/ThemeToggle";
import { SessionsDashboardSection } from "@/features/sessions/ui/SessionsDashboardSection";
import { Separator } from "@/components/ui/separator";
import { api } from "../../../convex/_generated/api";

export default function DashboardPage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const upsertCurrentUser = useMutation(api.users.upsertCurrentUser);
  const profile = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const [profileSyncError, setProfileSyncError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const syncStartedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      syncStartedRef.current = false;
      setProfileSyncError(null);
      return;
    }

    if (syncStartedRef.current) {
      return;
    }

    syncStartedRef.current = true;

    async function syncProfile() {
      try {
        await upsertCurrentUser({});
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to sync profile.";
        setProfileSyncError(message);
      }
    }

    void syncProfile();
  }, [isAuthenticated, upsertCurrentUser]);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isLoading) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-10">
        <ParticlesBackground />
        <div className="fixed inset-0 -z-20 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(88,101,242,0.45),transparent_70%),linear-gradient(145deg,rgba(30,41,59,0.65),rgba(56,72,148,0.42)_45%,rgba(111,76,155,0.3))]" />
        <div className="mx-auto flex min-h-[80vh] w-full max-w-4xl items-center justify-center rounded-3xl border border-white/[0.15] bg-[#0d1222]/[0.58] p-6 text-sm text-muted-foreground shadow-[0_35px_110px_-35px_rgba(37,99,235,0.45)] backdrop-blur-xl">
          Loading dashboard...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-10">
        <ParticlesBackground />
        <div className="fixed inset-0 -z-20 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(88,101,242,0.45),transparent_70%),linear-gradient(145deg,rgba(30,41,59,0.65),rgba(56,72,148,0.42)_45%,rgba(111,76,155,0.3))]" />
        <div className="mx-auto flex min-h-[80vh] w-full max-w-4xl flex-col items-center justify-center gap-3 rounded-3xl border border-white/[0.15] bg-[#0d1222]/[0.58] p-6 text-center shadow-[0_35px_110px_-35px_rgba(37,99,235,0.45)] backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">You are not signed in.</p>
          <LoginButton />
          <Link href="/" className="text-sm font-medium underline">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const userName = profile?.name ?? "reader";
  const initials = userName.slice(0, 1).toUpperCase();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticlesBackground />
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(70%_48%_at_50%_0%,rgba(88,101,242,0.34),transparent_72%),linear-gradient(145deg,rgba(165,180,252,0.24),rgba(147,197,253,0.16)_45%,rgba(244,114,182,0.12))] dark:bg-[radial-gradient(70%_50%_at_50%_0%,rgba(88,101,242,0.5),transparent_72%),linear-gradient(145deg,rgba(15,23,42,0.75),rgba(49,46,129,0.48)_45%,rgba(76,29,149,0.36))]" />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="rounded-3xl border border-white/[0.45] bg-white/[0.56] p-5 shadow-[0_30px_90px_-35px_rgba(79,70,229,0.55)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500 sm:p-7 dark:border-white/[0.15] dark:bg-[#0d1222]/[0.58] dark:shadow-[0_35px_110px_-35px_rgba(37,99,235,0.45)]">
          <header className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-500 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your sessions and queue access
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                type="button"
                variant="outline"
                disabled={isSigningOut}
                onClick={() => {
                  void handleSignOut();
                }}
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/55 bg-white/70 px-2.5 py-1.5 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/10">
                <Avatar size="sm" className="ring-1 ring-white/70 dark:ring-white/20">
                  <AvatarImage src={profile?.image ?? undefined} alt={userName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="max-w-36 truncate text-sm font-medium text-foreground">
                  {userName}
                </span>
                <Badge variant="secondary" className="rounded-full px-2 py-0 text-[11px]">
                  Discord
                </Badge>
              </div>
            </div>
          </header>

          <Separator className="my-5 bg-white/55 dark:bg-white/10" />

          <div className="grid gap-4 md:grid-cols-2">
            <SessionsDashboardSection />

            <Card className="border-white/[0.45] bg-white/[0.66] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md transition-transform duration-200 hover:-translate-y-0.5 md:col-span-2 dark:border-white/[0.15] dark:bg-white/[0.07] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Share the link to invite readers instantly.</li>
                  <li>Queue updates live while everyone tracks progress together.</li>
                  <li>Sessions auto-delete in 7 days by default.</li>
                </ul>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                {profileSyncError ? `Profile sync warning: ${profileSyncError}` : "Realtime sync active"}
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
