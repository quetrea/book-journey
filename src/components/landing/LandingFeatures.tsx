import {
  Clock3,
  ListOrdered,
  Smartphone,
  Trash2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "Realtime queue",
    icon: ListOrdered,
  },
  {
    title: "Elapsed time (no refresh)",
    icon: Clock3,
  },
  {
    title: "Mobile-friendly",
    icon: Smartphone,
  },
  {
    title: "Auto-delete after 7 days",
    icon: Trash2,
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
              <CardContent className="flex items-center gap-3 px-4 py-4">
                <span className="inline-flex size-8 items-center justify-center rounded-md border border-white/25 bg-white/35 dark:border-white/10 dark:bg-white/10">
                  <Icon className="size-4 text-[#5865F2]" />
                </span>
                <p className="text-sm font-medium tracking-tight">
                  {feature.title}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
