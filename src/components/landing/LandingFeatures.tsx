import {
  Clock3,
  ListOrdered,
  Smartphone,
  Trash2,
} from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    title: "Realtime queue",
    icon: ListOrdered,
    description: "The speaking order updates live for everyone in the room.",
    meta: "You always see who speaks next and when.",
  },
  {
    title: "Elapsed time (no refresh)",
    icon: Clock3,
    description: "Session time runs in real time without page refresh.",
    meta: "No timing drift while turns are in progress.",
  },
  {
    title: "Mobile-friendly",
    icon: Smartphone,
    description: "Queue, status, and summary cards stay readable on phones.",
    meta: "Participants can follow the flow with minimal taps.",
  },
  {
    title: "Auto-delete after 7 days",
    icon: Trash2,
    description: "Old sessions are automatically cleaned up after 7 days.",
    meta: "No stale logs piling up over time.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="mt-8 scroll-mt-16">
      <div className="grid gap-3 sm:grid-cols-2">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <Card
              key={feature.title}
              className="border-white/20 bg-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_24px_-22px_rgba(88,101,242,0.65)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/35 dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_-22px_rgba(88,101,242,0.55)] dark:hover:bg-white/10"
            >
              <CardHeader className="rounded-t-xl border-b border-white/25 bg-white/35 px-4 py-3 dark:border-white/10 dark:bg-white/10">
                <CardTitle className="flex items-center gap-3 text-sm font-semibold tracking-tight">
                  <span className="inline-flex size-8 items-center justify-center rounded-md border border-white/30 bg-white/45 dark:border-white/10 dark:bg-white/10">
                    <Icon className="size-4 text-[#5865F2]" />
                  </span>
                  {feature.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="px-4 py-3">
                <p className="text-sm leading-5 text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>

              <Separator className="bg-white/30 dark:bg-white/10" />

              <CardFooter className="px-4 py-3">
                <p className="text-xs text-muted-foreground/90">{feature.meta}</p>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
