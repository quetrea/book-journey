import Link from "next/link";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingFeedback } from "@/components/landing/LandingFeedback";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { MouseSpotlight } from "@/components/landing/MouseSpotlight";
import { LandingTopBar } from "@/components/landing/LandingTopBar";
import { LiveSessionsSection } from "@/components/landing/LiveSessionsSection";
import { Separator } from "@/components/ui/separator";
import { LoginButton } from "@/features/auth/ui/LoginButton";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_14%_6%,rgba(99,102,241,0.12),transparent_38%),radial-gradient(circle_at_86%_18%,rgba(56,189,248,0.11),transparent_42%),radial-gradient(circle_at_80%_88%,rgba(129,140,248,0.08),transparent_42%)] text-foreground">
      <MouseSpotlight />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="landing-aurora landing-aurora-one" />
        <div className="landing-aurora landing-aurora-two" />
        <div className="landing-grid-fade" />
      </div>
      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <LandingTopBar />
        <LandingHero loginButton={<LoginButton />} />
        <LiveSessionsSection />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingFeedback />

        <Separator className="mt-10 animate-in fade-in slide-in-from-bottom-2 [animation-delay:580ms] animation-duration-[700ms] fill-mode-[both] bg-black/10 dark:bg-white/10" />

        <footer className="mt-4 flex animate-in fade-in slide-in-from-bottom-2 [animation-delay:620ms] animation-duration-[700ms] fill-mode-[both] items-center justify-between gap-3 text-xs text-slate-400 dark:text-white/30">
          <p>No bots. No logs. Just the session.</p>
          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="underline-offset-4 transition-colors hover:text-slate-600 hover:underline dark:hover:text-white/60"
            >
              Privacy Policy
            </Link>
            <a
              href="https://github.com/quetrea/book-journey"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 transition-colors hover:text-slate-600 hover:underline dark:hover:text-white/60"
            >
              GitHub
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
