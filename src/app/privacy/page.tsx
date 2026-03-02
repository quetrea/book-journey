import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — BookJourney",
  description: "What data BookJourney collects, how it's used, and how you can delete it.",
};

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/"
          className="mb-8 inline-flex text-sm text-slate-500 underline underline-offset-4 hover:text-slate-800 dark:text-white/40 dark:hover:text-white/70"
        >
          ← Back to home
        </Link>

        <h1 className="mb-2 font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="mb-8 text-sm text-slate-500 dark:text-white/40">
          Last updated: March 2, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-white/70">

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Overview</h2>
            <p>
              BookJourney is a small, open-source tool for managing reading queues in group sessions.
              We collect only the minimum data needed to make the app work. We do not sell, share, or
              monetize your data in any way.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">What we collect</h2>
            <div className="space-y-4">

              <div>
                <h3 className="mb-1 font-medium text-slate-800 dark:text-white/90">From Discord (when you sign in)</h3>
                <ul className="list-inside list-disc space-y-1 text-slate-600 dark:text-white/60">
                  <li>Your Discord username and display name</li>
                  <li>Your Discord profile picture URL</li>
                  <li>An internal Discord user ID (used to identify you across sessions)</li>
                </ul>
                <p className="mt-2 text-slate-500 dark:text-white/40">
                  We do <strong className="text-slate-700 dark:text-white/70">not</strong> receive your email address, password, server memberships, or any messages from Discord.
                </p>
              </div>

              <div>
                <h3 className="mb-1 font-medium text-slate-800 dark:text-white/90">Session data (created by you)</h3>
                <ul className="list-inside list-disc space-y-1 text-slate-600 dark:text-white/60">
                  <li>Book title, author name, session title, and synopsis you enter when creating a session</li>
                  <li>Session passcode (stored as a one-way hash — we cannot read the original)</li>
                  <li>Queue positions and reading status</li>
                  <li>Words and phrases you save during a reading session</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-1 font-medium text-slate-800 dark:text-white/90">Push notification subscription (optional)</h3>
                <ul className="list-inside list-disc space-y-1 text-slate-600 dark:text-white/60">
                  <li>A browser-generated push endpoint and encryption keys</li>
                  <li>Used only to send you turn notifications</li>
                  <li>You can revoke this at any time from the session room or your browser settings</li>
                </ul>
              </div>

            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">What we do NOT collect</h2>
            <ul className="list-inside list-disc space-y-1 text-slate-600 dark:text-white/60">
              <li>Email addresses</li>
              <li>Passwords</li>
              <li>IP addresses or device fingerprints</li>
              <li>Browsing history or analytics events</li>
              <li>Any data from Discord beyond name and avatar</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">How data is used</h2>
            <p>
              Your data is used exclusively to operate BookJourney — displaying your name and avatar in sessions,
              managing reading queues, and sending turn notifications if you opt in. Nothing else.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Data retention and automatic deletion</h2>
            <ul className="list-inside list-disc space-y-1 text-slate-600 dark:text-white/60">
              <li>Ended sessions and all their data (queue, words, participants) are automatically deleted 7 days after the session ends.</li>
              <li>Hosts can manually delete a session at any time from the dashboard — this instantly removes all associated data.</li>
              <li>Push notification subscriptions are deleted when you disable notifications or sign out.</li>
              <li>Your profile (name, avatar) persists as long as you have an account. It is deleted when your account is removed.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Third-party services</h2>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-slate-800 dark:text-white/90">Convex</p>
                <p className="text-slate-500 dark:text-white/40">
                  Our backend and database provider. All data is stored on Convex infrastructure.
                  See <a href="https://www.convex.dev/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-slate-700 dark:hover:text-white/60">Convex&apos;s Privacy Policy</a>.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-white/90">Discord</p>
                <p className="text-slate-500 dark:text-white/40">
                  Used only for sign-in (OAuth). We request the minimum scopes: <code className="rounded bg-black/6 px-1 py-0.5 font-mono text-[12px] dark:bg-white/10">identify</code>.
                  See <a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-slate-700 dark:hover:text-white/60">Discord&apos;s Privacy Policy</a>.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-white/90">Web Push (browser native)</p>
                <p className="text-slate-500 dark:text-white/40">
                  Turn notifications are delivered through your browser&apos;s built-in push infrastructure
                  (e.g. Google FCM for Chrome). We do not control this infrastructure and only send the
                  notification payload.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Your rights</h2>
            <p>
              You can request deletion of your account and all associated data at any time by contacting
              us via the{" "}
              <a
                href="https://github.com/quetrea/book-journey/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-slate-700 dark:hover:text-white/60"
              >
                GitHub issue tracker
              </a>
              . We will process the request within 7 days.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Open source</h2>
            <p>
              BookJourney is fully open source. You can review exactly what data is collected and how
              it is handled in the{" "}
              <a
                href="https://github.com/quetrea/book-journey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-slate-700 dark:hover:text-white/60"
              >
                source code on GitHub
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Changes to this policy</h2>
            <p>
              If this policy changes, the &ldquo;Last updated&rdquo; date above will be updated.
              We will not make changes that reduce your privacy without a clear notice.
            </p>
          </section>

        </div>

        <div className="mt-12 border-t border-black/8 pt-6 text-xs text-slate-400 dark:border-white/10 dark:text-white/25">
          <Link
            href="/"
            className="underline-offset-4 hover:text-slate-600 hover:underline dark:hover:text-white/50"
          >
            ← Back to BookJourney
          </Link>
        </div>
      </main>
    </div>
  );
}
