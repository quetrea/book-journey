"use client";

import type { ReactNode } from "react";

import { WritingTicker } from "@/components/landing/WritingAnimations";
import { Button } from "@/components/ui/button";

type LandingHeroProps = {
  loginButton: ReactNode;
};

export function LandingHero({ loginButton }: LandingHeroProps) {
  function handleScrollToFeatures() {
    const features = document.getElementById("features");
    if (!features) {
      return;
    }

    features.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="mt-12 space-y-8 sm:mt-20">
      <div
        className="animate-in fade-in slide-in-from-bottom-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3.5 py-1.5 animation-duration-[600ms] fill-mode-[both] dark:border-white/15 dark:bg-white/8"
        style={{ animationDelay: "0ms" }}
      >
        <span className="size-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
        <span className="text-[11px] font-medium uppercase tracking-widest text-slate-500 dark:text-white/60">
          Live | Real-time | No refresh
        </span>
      </div>

      <div className="space-y-4">
        <h1
          className="animate-in fade-in slide-in-from-bottom-4 font-display text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 animation-duration-[650ms] fill-mode-[both] sm:text-6xl dark:text-white"
          style={{ animationDelay: "80ms" }}
        >
          Book Club Sessions,
          <br />
          <span className="bg-linear-to-r from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent dark:from-white dark:via-white/90 dark:to-white/60">
            Built for Live Reading.
          </span>
        </h1>

        <p
          className="animate-in fade-in slide-in-from-bottom-3 max-w-lg text-base leading-7 text-slate-500 animation-duration-[650ms] fill-mode-[both] sm:text-lg sm:leading-8 dark:text-white/50"
          style={{ animationDelay: "160ms" }}
        >
          Create a session, share the link, and run queue-based turns with synced elapsed
          time - for everyone, live.
        </p>

        <div
          className="animate-in fade-in slide-in-from-bottom-3 max-w-2xl fill-mode-[both]"
          style={{ animationDelay: "210ms", animationDuration: "700ms" }}
        >
          <div className="relative overflow-hidden rounded-2xl border border-black/12 bg-black/[0.04] p-3.5 shadow-[0_10px_35px_-22px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/12 dark:bg-white/[0.06] dark:shadow-[0_10px_40px_-20px_rgba(2,6,23,0.7)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(99,102,241,0.16),transparent_55%),radial-gradient(circle_at_78%_80%,rgba(56,189,248,0.14),transparent_50%)]" />
            <p className="relative mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/55">
              Live onboarding feed
            </p>
            <WritingTicker
              phrases={[
                "Create room -> set book -> share session link",
                "Readers join queue -> host sees order instantly",
                "Turn changes sync live -> no refresh needed",
                "Push notifications nudge the next reader",
              ]}
              className="relative text-slate-700 dark:text-white/80"
            />
          </div>
        </div>
      </div>

      <div
        className="animate-in fade-in slide-in-from-bottom-3 flex flex-col gap-3 animation-duration-[600ms] fill-mode-[both] sm:flex-row sm:items-center"
        style={{ animationDelay: "240ms" }}
      >
        {loginButton}
        <Button
          type="button"
          variant="outline"
          onClick={handleScrollToFeatures}
          className="border-black/15 bg-black/5 text-slate-700 backdrop-blur-md transition-all hover:bg-black/10 hover:text-slate-900 dark:border-white/15 dark:bg-white/8 dark:text-white/80 dark:hover:bg-white/15 dark:hover:text-white"
        >
          See how it works
        </Button>
      </div>

      <p
        className="animate-in fade-in animation-duration-[800ms] fill-mode-[both] text-xs text-slate-400 dark:text-white/30"
        style={{ animationDelay: "320ms" }}
      >
        Create sessions with Discord or as a guest, then join instantly with a random identity.
      </p>
    </section>
  );
}
