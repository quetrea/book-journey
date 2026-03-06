"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.12.11 18.18.12 18.24a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export default function AuthPageClient() {
  const { signIn } = useAuthActions();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();

  const [activeMethod, setActiveMethod] = useState<"guest" | "discord" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  async function handleDiscordSignIn() {
    setActiveMethod("discord");
    setErrorMessage(null);
    try {
      await signIn("discord");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to sign in."
      );
    } finally {
      setActiveMethod(null);
    }
  }

  async function handleGuestSignIn() {
    setActiveMethod("guest");
    setErrorMessage(null);
    try {
      await signIn("anonymous");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to sign in as guest."
      );
    } finally {
      setActiveMethod(null);
    }
  }

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-sm flex-col items-center justify-center px-4 py-10">
        <Link
          href="/"
          className="mb-8 text-sm text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline dark:text-white/40 dark:hover:text-white/70"
        >
          &larr; Back to home
        </Link>

        <div className="w-full space-y-5 rounded-2xl border border-white/45 bg-white/68 p-6 shadow-lg backdrop-blur-md dark:border-white/15 dark:bg-white/8">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Sign in to BookJourney
            </h1>
            <p className="text-sm text-muted-foreground">
              Start instantly as a guest, or use Discord for a persistent profile.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => void handleGuestSignIn()}
            disabled={activeMethod !== null}
            className="h-11 w-full"
          >
            {activeMethod === "guest" ? "Generating guest..." : "Continue as Guest"}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground/60">
            We generate a random name and avatar for you automatically.
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          </div>

          {/* Discord login */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDiscordModalOpen(true)}
              disabled={activeMethod !== null}
              className="w-full gap-2 border-black/10 bg-white/60 text-slate-700 hover:bg-white/80 hover:text-slate-900 dark:border-white/12 dark:bg-white/6 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <DiscordIcon className="size-4" />
              Continue with Discord
            </Button>
            <p className="text-center text-[11px] text-muted-foreground/60">
              Optional: keep a persistent identity across sessions.
            </p>
          </div>

          {errorMessage && (
            <p className="text-center text-xs text-red-500">{errorMessage}</p>
          )}
          <p className="text-center text-[11px] text-muted-foreground/60">
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Read the privacy policy
            </Link>
          </p>
        </div>
      </main>

      <Dialog open={isDiscordModalOpen} onOpenChange={setIsDiscordModalOpen}>
        <DialogContent className="border-white/35 bg-white/78 shadow-2xl backdrop-blur-2xl dark:border-white/12 dark:bg-[#0d1222]/86">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DiscordIcon className="size-5 text-[#5865F2]" />
              Continue with Discord
            </DialogTitle>
            <DialogDescription>
              Discord is optional. Use it if you want a persistent profile instead of a temporary guest identity.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl border border-emerald-200/50 bg-emerald-50/50 px-4 py-3 dark:border-emerald-500/15 dark:bg-emerald-500/5">
              <p className="font-medium text-foreground">Requested Discord scope</p>
              <p className="mt-1">
                We only request <strong className="text-foreground">identify</strong>.
                No email, no servers, no messages.
              </p>
            </div>

            <ul className="space-y-2 rounded-xl border border-black/8 bg-black/3 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <li>Your Discord name and avatar become your persistent BookJourney identity.</li>
              <li>Your guest data is temporary, but Discord sign-in keeps your identity across sessions.</li>
              <li>
                OAuth returns only through{" "}
                <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-[11px] dark:bg-white/10">
                  bookreading.space/api/auth/callback/discord
                </code>
                .
              </li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDiscordModalOpen(false)}
              disabled={activeMethod === "discord"}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleDiscordSignIn()}
              disabled={activeMethod !== null}
              className="gap-2 bg-[#5865F2] text-white hover:bg-[#4752c4]"
            >
              <DiscordIcon className="size-4" />
              {activeMethod === "discord" ? "Redirecting..." : "Continue with Discord"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
