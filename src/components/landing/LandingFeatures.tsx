import {
  Clock3,
  ListOrdered,
  Smartphone,
  Trash2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Realtime queue",
    icon: ListOrdered,
    description:
      "The speaking order updates live for everyone in the room. You always see who speaks next and when.",
  },
  {
    title: "Elapsed time",
    icon: Clock3,
    description:
      "Session time runs in real time without page refresh. No timing drift while turns are in progress.",
  },
  {
    title: "Mobile-friendly",
    icon: Smartphone,
    description:
      "Queue, status, and summary cards stay readable on phones. Follow the flow with minimal taps.",
  },
  {
    title: "Auto-delete after 7 days",
    icon: Trash2,
    description:
      "Old sessions are automatically cleaned up after 7 days. No stale logs piling up over time.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="mt-10 scroll-mt-16">
      <div className="grid gap-3 sm:grid-cols-2">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <Card
              key={feature.title}
              className="group relative animate-in fade-in slide-in-from-bottom-4 border-black/8 bg-white/70 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl [animation-fill-mode:both] transition-all duration-300 hover:-translate-y-1 hover:border-black/12 hover:bg-white/85 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_4px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]"
              style={{
                animationDelay: `${360 + index * 80}ms`,
                animationDuration: "600ms",
              }}
            >
              <div className="pointer-events-none absolute inset-px rounded-[calc(var(--radius)-1px)] border border-black/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:border-white/20" />

              <CardHeader className="pb-2 pt-4">
                <CardTitle className="flex items-center gap-3 text-sm font-semibold tracking-tight text-slate-800 dark:text-white">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl border border-black/10 bg-black/5 transition-all duration-300 group-hover:border-black/15 group-hover:bg-black/8 dark:border-white/15 dark:bg-white/10 dark:group-hover:border-white/25 dark:group-hover:bg-white/15">
                    <Icon className="size-4 text-slate-500 transition-colors group-hover:text-slate-800 dark:text-white/70 dark:group-hover:text-white" />
                  </span>
                  {feature.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="px-4 pb-5 pt-0">
                <p className="text-sm leading-6 text-slate-500 dark:text-white/50">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
