import Link from "next/link";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingTopBar } from "@/components/landing/LandingTopBar";
import { Separator } from "@/components/ui/separator";
import { LoginButton } from "@/features/auth/ui/LoginButton";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <LandingTopBar />
        <LandingHero loginButton={<LoginButton />} />
        <LandingFeatures />

        <Separator className="mt-10 bg-black/10 dark:bg-white/10" />

        <footer className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-400 dark:text-white/30">
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
