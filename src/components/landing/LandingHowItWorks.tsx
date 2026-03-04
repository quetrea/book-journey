import {
  Bell,
  BookOpen,
  EyeOff,
  Link2,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    number: "01",
    title: "Create a session",
    description:
      "Name your book and you're ready. Paste a Goodreads or OpenLibrary link to auto-fill the title and author instantly. Set a host passcode or keep it private — your call.",
  },
  {
    number: "02",
    title: "Share the link",
    description:
      "Send the session URL to your group. Anyone can join as a guest with just their name — no account, no download, no friction.",
  },
  {
    number: "03",
    title: "Read together, live",
    description:
      "Participants join the queue and take turns. Elapsed time syncs in real time across every screen. Skip, advance, or manage turns as the host.",
  },
];

const extras = [
  {
    icon: Users,
    title: "Guest join",
    description:
      "No account needed. Anyone joins with just a name — no Discord, no sign-up, no barriers.",
  },
  {
    icon: BookOpen,
    title: "Word collection",
    description:
      "Save interesting words or vocabulary during a session. The whole group sees them and can copy to clipboard.",
  },
  {
    icon: Bell,
    title: "Turn notifications",
    description:
      "Get a browser push notification when it's your turn — even if you've switched to another tab.",
  },
  {
    icon: Link2,
    title: "Book import",
    description:
      "Paste a Goodreads, OpenLibrary, or Google Books link to auto-fill the book title and author in one click.",
  },
  {
    icon: EyeOff,
    title: "Private sessions",
    description:
      "Keep your session off the public listing while still shareable via direct link.",
  },
  {
    icon: ShieldCheck,
    title: "Host passcode",
    description:
      "Protect host controls with a passcode so only trusted members can manage the queue.",
  },
  {
    icon: Zap,
    title: "Instant sync",
    description:
      "Every queue move, turn change, and timer update propagates via Convex in real time — zero polling, zero refresh.",
  },
];

export function LandingHowItWorks() {
  return (
    <div className="mt-16 space-y-16">
      {/* ── Part 1: How it works ── */}
      <section>
        {/* Header */}
        <div
          className="animate-in fade-in slide-in-from-bottom-3 mb-8 space-y-2 [animation-fill-mode:both]"
          style={{ animationDelay: "0ms", animationDuration: "600ms" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30">
            How it works
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            From zero to reading together
            <br />
            <span className="text-slate-400 dark:text-white/40">
              in seconds.
            </span>
          </h2>
        </div>

        {/* Steps */}
        <div className="relative space-y-0">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="animate-in fade-in slide-in-from-bottom-4 relative flex gap-5 [animation-fill-mode:both]"
              style={{
                animationDelay: `${80 + index * 100}ms`,
                animationDuration: "600ms",
              }}
            >
              {/* Left column: number badge + connector */}
              <div className="flex flex-col items-center">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-gradient-to-br from-slate-100 to-slate-200 text-[11px] font-bold tabular-nums text-slate-500 shadow-sm dark:border-white/15 dark:from-white/10 dark:to-white/5 dark:text-white/50">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="mt-1 h-full w-px bg-gradient-to-b from-black/10 to-transparent dark:from-white/10" />
                )}
              </div>

              {/* Right column: content */}
              <div
                className={`pb-8 ${index === steps.length - 1 ? "pb-0" : ""}`}
              >
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

      {/* ── Part 2: Everything included ── */}
      <section>
        {/* Header */}
        <div
          className="animate-in fade-in slide-in-from-bottom-3 mb-6 space-y-1 [animation-fill-mode:both]"
          style={{ animationDelay: "0ms", animationDuration: "600ms" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30">
            Everything included
          </p>
          <p className="text-sm text-slate-500 dark:text-white/40">
            All the tools your reading group needs, ready out of the box.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {extras.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="group relative animate-in fade-in slide-in-from-bottom-4 border-black/8 bg-white/70 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl [animation-fill-mode:both] transition-all duration-300 hover:-translate-y-1 hover:border-black/12 hover:bg-white/85 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_4px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]"
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
