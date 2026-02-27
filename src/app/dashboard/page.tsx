import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getAppSession } from "@/features/auth/server/session";
import { MySessionsList } from "@/features/dashboard/ui/MySessionsList";
import { ParticlesBackground } from "@/features/dashboard/ui/ParticlesBackground";
import { ThemeToggle } from "@/features/dashboard/ui/ThemeToggle";

export default async function DashboardPage() {
  const session = await getAppSession();

  if (!session?.user) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-10">
        <ParticlesBackground />
        <div className="fixed inset-0 -z-20 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(88,101,242,0.33),transparent_70%),linear-gradient(145deg,rgba(147,197,253,0.14),rgba(99,102,241,0.12)_40%,rgba(236,72,153,0.08))] dark:bg-[radial-gradient(70%_50%_at_50%_0%,rgba(88,101,242,0.45),transparent_70%),linear-gradient(145deg,rgba(30,41,59,0.65),rgba(56,72,148,0.42)_45%,rgba(111,76,155,0.3))]" />
        <div className="mx-auto flex min-h-[80vh] w-full max-w-4xl items-center justify-center rounded-3xl border border-white/[0.45] bg-white/[0.58] p-6 shadow-[0_30px_90px_-35px_rgba(79,70,229,0.55)] backdrop-blur-xl dark:border-white/[0.15] dark:bg-[#0d1222]/[0.58] dark:shadow-[0_35px_110px_-35px_rgba(37,99,235,0.45)]">
          <p className="text-sm text-muted-foreground">
            You are not signed in.
          </p>
          <Link href="/" className="mt-3 inline-block text-sm font-medium underline">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const userName = session.user.name ?? "reader";
  const userId = session.user.id ?? "unknown";
  const initials = userName.slice(0, 1).toUpperCase();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticlesBackground />
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(70%_48%_at_50%_0%,rgba(88,101,242,0.34),transparent_72%),linear-gradient(145deg,rgba(165,180,252,0.24),rgba(147,197,253,0.16)_45%,rgba(244,114,182,0.12))] dark:bg-[radial-gradient(70%_50%_at_50%_0%,rgba(88,101,242,0.5),transparent_72%),linear-gradient(145deg,rgba(15,23,42,0.75),rgba(49,46,129,0.48)_45%,rgba(76,29,149,0.36))]" />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="rounded-3xl border border-white/[0.45] bg-white/[0.56] p-5 shadow-[0_30px_90px_-35px_rgba(79,70,229,0.55)] backdrop-blur-xl sm:p-7 dark:border-white/[0.15] dark:bg-[#0d1222]/[0.58] dark:shadow-[0_35px_110px_-35px_rgba(37,99,235,0.45)]">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your sessions and queue access
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/55 bg-white/70 px-2.5 py-1.5 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/10">
                <Avatar size="sm" className="ring-1 ring-white/70 dark:ring-white/20">
                  <AvatarImage src={session.user.image ?? undefined} alt={userName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="max-w-36 truncate text-sm font-medium text-foreground">
                  {userName}
                </span>
                <Badge variant="secondary" className="rounded-full px-2 py-0 text-[11px]">
                  Discord
                </Badge>
              </div>
            </div>
          </header>

          <Separator className="my-5 bg-white/55 dark:bg-white/10" />

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-white/[0.45] bg-white/[0.66] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.07] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
              <CardHeader>
                <CardTitle>Create Session</CardTitle>
                <CardDescription>
                  Start a live room for your reading group.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Host controls and queue setup are coming in the next milestone.
                </p>
              </CardContent>
              <CardFooter>
                <Button disabled className="w-full sm:w-auto">
                  Coming next
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-white/[0.45] bg-white/[0.66] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.07] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
              <CardHeader>
                <CardTitle>My Sessions</CardTitle>
                <CardDescription>Your hosted and joined rooms.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <MySessionsList sessions={[]} />
              </CardContent>
            </Card>

            <Card className="border-white/[0.45] bg-white/[0.66] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md md:col-span-2 dark:border-white/[0.15] dark:bg-white/[0.07] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Share the link to invite readers instantly.</li>
                  <li>Queue updates live while everyone tracks progress together.</li>
                  <li>Sessions auto-delete in 7 days by default.</li>
                </ul>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Discord ID: {userId}
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
