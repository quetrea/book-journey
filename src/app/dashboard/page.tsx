"use client";

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
import { ThemePicker } from "@/components/background/ThemePicker";
import { LoginButton } from "@/features/auth/ui/LoginButton";
import { ThemeToggle } from "@/features/dashboard/ui/ThemeToggle";
import { SessionsDashboardSection } from "@/features/sessions/ui/SessionsDashboardSection";
import { Separator } from "@/components/ui/separator";
import { useSignOutAction } from "@/features/auth/hooks/useSignOutAction";
import { api } from "../../../convex/_generated/api";

export default function DashboardPage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const upsertCurrentUser = useMutation(api.users.upsertCurrentUser);
  const { signOutCurrentUser } = useSignOutAction();
  const profile = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip"
  );
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
      await signOutCurrentUser();
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isLoading) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-10">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-4xl items-center justify-center rounded-3xl border border-black/10 bg-white/60 p-6 text-sm text-slate-400 backdrop-blur-xl dark:border-white/15 dark:bg-black/40 dark:text-white/50">
          Loading dashboard...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-10">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-4xl flex-col items-center justify-center gap-3 rounded-3xl border border-black/10 bg-white/60 p-6 text-center backdrop-blur-xl dark:border-white/15 dark:bg-black/40">
          <p className="text-sm text-slate-500 dark:text-white/60">
            You are not signed in.
          </p>
          <LoginButton />
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 underline underline-offset-4 hover:text-slate-800 dark:text-white/50 dark:hover:text-white/80"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const userName = (profile?.displayName || profile?.name) ?? "reader";
  const initials = userName.slice(0, 1).toUpperCase();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section
          className="animate-in fade-in zoom-in-95 rounded-[2rem] border border-cyan-200/45 bg-[rgba(226,255,252,0.38)] p-5 shadow-[0_18px_45px_rgba(6,182,212,0.10),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-3xl duration-500 sm:p-7 dark:border-cyan-300/18 dark:bg-[rgba(8,32,40,0.50)] dark:shadow-[0_22px_55px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)]"
        >
          <header className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-500 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-white/50">
                Your sessions and queue access
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ThemePicker />
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
              <Link
                href="/settings"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-200/55 bg-[rgba(236,255,252,0.54)] px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl transition-colors hover:bg-[rgba(245,255,254,0.72)] dark:border-cyan-300/16 dark:bg-[rgba(255,255,255,0.08)] dark:hover:bg-[rgba(255,255,255,0.12)]"
              >
                <Avatar
                  size="sm"
                  className="ring-1 ring-white/70 dark:ring-white/20"
                >
                  <AvatarImage
                    src={profile?.image ?? undefined}
                    alt={userName}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="max-w-36 truncate text-sm font-medium text-foreground">
                  {userName}
                </span>
                <Badge
                  variant="secondary"
                  className="hidden sm:inline-flex rounded-full px-2 py-0 text-[11px]"
                >
                  {profile?.isGuest ? "Guest" : "Discord"}
                </Badge>
              </Link>
            </div>
          </header>

          <Separator className="my-5 bg-cyan-200/45 dark:bg-cyan-300/12" />

          <div className="grid gap-4 md:grid-cols-2">
            <SessionsDashboardSection isGuest={profile === undefined ? undefined : Boolean(profile?.isGuest)} />

            <Card
              className="animate-in fade-in slide-in-from-bottom-3 [animation-delay:200ms] animation-duration-[500ms] fill-mode-[both] border-cyan-200/45 bg-[rgba(232,255,251,0.44)] shadow-[0_14px_35px_rgba(20,184,166,0.10),inset_0_1px_0_rgba(255,255,255,0.68)] backdrop-blur-2xl transition-transform duration-200 hover:-translate-y-0.5 md:col-span-2 dark:border-cyan-300/14 dark:bg-[rgba(255,255,255,0.06)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Share the link to invite readers instantly.</li>
                  <li>
                    Queue updates live while everyone tracks progress together.
                  </li>
                  <li>Sessions auto-delete in 7 days by default.</li>
                </ul>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                {profileSyncError
                  ? `Profile sync warning: ${profileSyncError}`
                  : "Realtime sync active"}
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
