"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function AuthPageClient() {
  const { signIn } = useAuthActions();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();

  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  async function handleDiscordSignIn() {
    setIsWorking(true);
    setErrorMessage(null);
    try {
      await signIn("discord");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to sign in."
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function handleGuestSignIn() {
    setIsWorking(true);
    setErrorMessage(null);
    try {
      await signIn("anonymous");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to sign in as guest."
      );
    } finally {
      setIsWorking(false);
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
              No account needed &mdash; get a random guest identity instantly
            </p>
          </div>

          <Button
            type="button"
            onClick={() => void handleGuestSignIn()}
            disabled={isWorking}
            className="w-full"
          >
            {isWorking ? "Generating guest..." : "Continue as Guest"}
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
              onClick={() => void handleDiscordSignIn()}
              disabled={isWorking}
              className="w-full gap-2 border-[#5865F2]/30 bg-[#5865F2]/5 text-[#5865F2] hover:bg-[#5865F2]/10 hover:text-[#4752c4] dark:border-[#5865F2]/25 dark:bg-[#5865F2]/10 dark:text-[#8b9aff] dark:hover:bg-[#5865F2]/20"
            >
              {isWorking ? (
                "Redirecting..."
              ) : (
                <>
                  <DiscordIcon className="size-4" />
                  Continue with Discord
                </>
              )}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground/60">
              Use Discord for a persistent profile and identity
            </p>
          </div>

          {errorMessage && (
            <p className="text-center text-xs text-red-500">{errorMessage}</p>
          )}

          {/* Privacy & scope notice */}
          <div className="space-y-2 rounded-xl border border-emerald-200/50 bg-emerald-50/40 px-3.5 py-3 dark:border-emerald-500/15 dark:bg-emerald-500/5">
            <div className="flex items-center gap-1.5">
              <ShieldIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                Privacy
              </span>
            </div>
            <ul className="space-y-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/70">
              <li>
                We only request Discord <strong>identify</strong> &mdash; no
                email, no servers, no messages.
              </li>
              <li>
                OAuth redirects only to{" "}
                <code className="rounded bg-emerald-100/60 px-1 py-0.5 font-mono text-[10px] dark:bg-emerald-500/15">
                  bookreading.space/api/auth/callback/discord
                </code>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="underline underline-offset-2 hover:text-emerald-800 dark:hover:text-emerald-300"
                >
                  Full privacy policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
