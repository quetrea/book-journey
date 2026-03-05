import {
  Bell,
  BookOpen,
  EyeOff,
  Link2,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";

import { OnboardingWritingSequence } from "@/components/landing/WritingAnimations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    number: "01",
    title: "Create a session",
    description:
      "Name your book and you are ready. Paste a Goodreads or OpenLibrary link to auto-fill title and author. Add a passcode or keep it private.",
  },
  {
    number: "02",
    title: "Share the link",
    description:
      "Send the session URL to your group. Anyone can join as a guest with a name only - no account, no download, no friction.",
  },
  {
    number: "03",
    title: "Read together, live",
    description:
      "Participants join the queue and take turns. Elapsed time stays synced for everyone. Hosts can skip or advance instantly.",
  },
];

const onboardingScript = [
  "Step 1: Create room + choose your book",
  "Step 2: Invite readers with one link",
  "Step 3: Queue and turn timer sync in real time",
  "Step 4: Save words and keep the flow",
];

const extras = [
  {
    icon: Users,
    title: "Guest join",
    description: "No account needed. Anyone joins with only a name.",
  },
  {
    icon: BookOpen,
    title: "Word collection",
    description: "Save useful words and share them with the whole room.",
  },
  {
    icon: Bell,
    title: "Turn notifications",
    description: "Get a browser push when it is your turn.",
  },
  {
    icon: Link2,
    title: "Book import",
    description:
      "Paste Goodreads, OpenLibrary, or Google Books URL to fill title and author.",
  },
  {
    icon: EyeOff,
    title: "Private sessions",
    description: "Hide session from public list and share only by direct link.",
  },
  {
    icon: ShieldCheck,
    title: "Host passcode",
    description: "Protect queue controls with a host passcode.",
  },
  {
    icon: Zap,
    title: "Instant sync",
    description: "Queue moves and timer updates propagate instantly via Convex.",
  },
];

export function LandingHowItWorks() {
  return (
    <div className="mt-16 space-y-16">
      <section>
        <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_0.9fr] lg:items-end">
          <div
            className="animate-in fade-in slide-in-from-bottom-3 space-y-2 fill-mode-[both]"
            style={{ animationDelay: "0ms", animationDuration: "600ms" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30">
              How it works
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              From zero to reading together
              <br />
              <span className="text-slate-400 dark:text-white/40">in seconds.</span>
            </h2>
          </div>

          <div
            className="animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-black/10 bg-white/70 p-3.5 shadow-[0_10px_34px_-24px_rgba(15,23,42,0.5)] backdrop-blur-xl fill-mode-[both] dark:border-white/12 dark:bg-white/6 dark:shadow-[0_12px_38px_-22px_rgba(2,6,23,0.65)]"
            style={{ animationDelay: "120ms", animationDuration: "700ms" }}
          >
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">
              Onboarding timeline
            </p>
            <OnboardingWritingSequence lines={onboardingScript} />
          </div>
        </div>

        <div className="relative space-y-0">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="animate-in fade-in slide-in-from-bottom-4 relative flex gap-5 fill-mode-[both]"
              style={{
                animationDelay: `${80 + index * 100}ms`,
                animationDuration: "600ms",
              }}
            >
              <div className="flex flex-col items-center">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-linear-to-br from-slate-100 to-slate-200 text-[11px] font-bold tabular-nums text-slate-500 shadow-sm dark:border-white/15 dark:from-white/10 dark:to-white/5 dark:text-white/50">
                  {step.number}
                </div>
                {index < steps.length - 1 ? (
                  <div className="mt-1 h-full w-px bg-linear-to-b from-black/10 to-transparent dark:from-white/10" />
                ) : null}
              </div>

              <div className={`pb-8 ${index === steps.length - 1 ? "pb-0" : ""}`}>
                <h3 className="mb-1.5 text-sm font-semibold text-slate-800 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-6 text-slate-500 dark:text-white/50">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div
          className="animate-in fade-in slide-in-from-bottom-3 mb-6 space-y-1 fill-mode-[both]"
          style={{ animationDelay: "0ms", animationDuration: "600ms" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30">
            Everything included
          </p>
          <p className="text-sm text-slate-500 dark:text-white/40">
            All the tools your reading group needs in one place.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {extras.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="group relative animate-in fade-in slide-in-from-bottom-4 border-black/8 bg-white/70 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl fill-mode-[both] transition-all duration-300 hover:-translate-y-1 hover:border-black/12 hover:bg-white/85 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/6 dark:shadow-[0_4px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]"
                style={{
                  animationDelay: `${80 + index * 60}ms`,
                  animationDuration: "600ms",
                }}
              >
                <div className="pointer-events-none absolute inset-px rounded-[calc(var(--radius)-1px)] border border-black/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:border-white/20" />

                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="flex items-center gap-3 text-sm font-semibold tracking-tight text-slate-800 dark:text-white">
                    <span className="inline-flex size-9 items-center justify-center rounded-xl border border-black/10 bg-black/5 transition-all duration-300 group-hover:border-black/15 group-hover:bg-black/8 dark:border-white/15 dark:bg-white/10 dark:group-hover:border-white/25 dark:group-hover:bg-white/15">
                      <Icon className="size-4 text-slate-500 transition-colors group-hover:text-slate-800 dark:text-white/70 dark:group-hover:text-white" />
                    </span>
                    {item.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-4 pb-5 pt-0">
                  <p className="text-sm leading-6 text-slate-500 dark:text-white/50">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

