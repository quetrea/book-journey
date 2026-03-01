import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type LandingHeroProps = {
  loginButton: ReactNode;
};

export function LandingHero({ loginButton }: LandingHeroProps) {
  return (
    <section className="mt-12 space-y-8 sm:mt-20">
      {/* Eyebrow */}
      <div
        className="animate-in fade-in slide-in-from-bottom-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3.5 py-1.5 [animation-duration:600ms] [animation-fill-mode:both] dark:border-white/15 dark:bg-white/8"
        style={{ animationDelay: "0ms" }}
      >
        <span className="size-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
        <span className="text-[11px] font-medium uppercase tracking-widest text-slate-500 dark:text-white/60">
          Live · Real-time · No refresh
        </span>
      </div>

      {/* Heading */}
      <div className="space-y-4">
        <h1
          className="animate-in fade-in slide-in-from-bottom-4 font-display text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 animation-duration-[650ms] fill-mode-[both] sm:text-6xl dark:text-white"
          style={{ animationDelay: "80ms" }}
        >
          Book Club Sessions,
          <br />
          <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent dark:from-white dark:via-white/90 dark:to-white/60">
            Built for Live Reading.
          </span>
        </h1>

        <p
          className="animate-in fade-in slide-in-from-bottom-3 max-w-lg text-base leading-7 text-slate-500 animation-duration-[650ms] fill-mode-[both] sm:text-lg sm:leading-8 dark:text-white/50"
          style={{ animationDelay: "160ms" }}
        >
          Create a session, share the link, and run queue-based turns with
          synced elapsed time — for everyone, live.
        </p>
      </div>

      {/* CTA row */}
      <div
        className="animate-in fade-in slide-in-from-bottom-3 flex flex-col gap-3 [animation-duration:600ms] [animation-fill-mode:both] sm:flex-row sm:items-center"
        style={{ animationDelay: "240ms" }}
      >
        {loginButton}
        <Button
          asChild
          variant="outline"
          className="border-black/15 bg-black/5 text-slate-700 backdrop-blur-md transition-all hover:bg-black/10 hover:text-slate-900 dark:border-white/15 dark:bg-white/8 dark:text-white/80 dark:hover:bg-white/15 dark:hover:text-white"
        >
          <a href="#features">See how it works</a>
        </Button>
      </div>

      {/* Disclaimer */}
      <p
        className="animate-in fade-in [animation-duration:800ms] [animation-fill-mode:both] text-xs text-slate-400 dark:text-white/30"
        style={{ animationDelay: "320ms" }}
      >
        A Discord account is required to create or join sessions.
      </p>
    </section>
  );
}
