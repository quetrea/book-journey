import { Info } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type LandingHeroProps = {
  loginButton: ReactNode;
};

export function LandingHero({ loginButton }: LandingHeroProps) {
  return (
    <section className="mt-10 space-y-5 sm:mt-14 sm:space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl leading-tight font-semibold tracking-tight text-foreground sm:text-5xl">
          Live Reading Sessions, Discord-style.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Create a session in seconds, share the link, and run queue-based live
          turns with synced elapsed time and no page refresh.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          {loginButton}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Discord auth info"
                className="inline-flex size-9 items-center justify-center rounded-md border border-white/20 bg-white/20 text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground dark:border-white/10 dark:bg-white/10"
              >
                <Info className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-center">
              Discord login is required to create or join reading sessions.
            </TooltipContent>
          </Tooltip>
        </div>

        <Button
          asChild
          variant="outline"
          className="border-white/25 bg-white/20 text-foreground backdrop-blur-md hover:bg-white/30 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20"
        >
          <a href="#features">See how it works</a>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Discord login is required to join sessions.
      </p>
    </section>
  );
}
