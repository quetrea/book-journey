import { LandingDemoCard } from "@/components/landing/LandingDemoCard";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingTopBar } from "@/components/landing/LandingTopBar";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(90%_50%_at_50%_0%,rgba(88,101,242,0.14),transparent_70%),linear-gradient(180deg,#f4f6fb_0%,#e9edf5_100%)] text-foreground dark:bg-[radial-gradient(90%_50%_at_50%_0%,rgba(88,101,242,0.2),transparent_70%),linear-gradient(180deg,#11141d_0%,#0a0d15_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(255,255,255,0.3),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(88,101,242,0.18),transparent_32%)] dark:bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.07),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(88,101,242,0.26),transparent_36%)]" />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <LandingTopBar />
        <LandingHero />
        <LandingDemoCard />
        <LandingFeatures />

        <Separator className="mt-10 bg-white/40 dark:bg-white/10" />

        <footer className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>No bots. No logs. Just the session.</p>
          <a
            href="#"
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            GitHub (soon)
          </a>
        </footer>
      </main>
    </div>
  );
}
