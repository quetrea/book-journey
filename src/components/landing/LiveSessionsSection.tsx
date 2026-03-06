"use client";

import { useQuery } from "convex/react";
import { ArrowRight, Lock, Users } from "lucide-react";
import Link from "next/link";

import { buildSessionInvitePathFromSessionId } from "@/features/sessions/lib/inviteLinks";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";

export function LiveSessionsSection() {
  const sessions = useQuery(api.sessions.listPublicSessionsServer);

  if (!sessions || sessions.length === 0) return null;

  return (
    <section
      className="mt-14 animate-in fade-in slide-in-from-bottom-4 animation-duration-[700ms] fill-mode-[both]"
      style={{ animationDelay: "420ms" }}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-white/40">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
          Live Sessions
        </div>
        <span className="rounded-full border border-black/8 bg-black/5 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:border-white/10 dark:bg-white/8 dark:text-white/40">
          {sessions.length} active
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {sessions.slice(0, 6).map((session, index) => (
          <Link
            key={session.id}
            href={buildSessionInvitePathFromSessionId(session.id)}
            className="group animate-in fade-in slide-in-from-bottom-4 fill-mode-[both]"
            style={{
              animationDelay: `${480 + index * 70}ms`,
              animationDuration: "600ms",
            }}
          >
            <div className="overflow-hidden rounded-[26px] border border-black/8 bg-white/70 p-3 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-black/12 hover:bg-white/85 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/6 dark:shadow-[0_4px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:border-white/18 dark:hover:bg-white/9 dark:hover:shadow-[0_14px_44px_-8px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div
                className={cn(
                  "relative aspect-[8/5] overflow-hidden rounded-[22px] border border-black/8 bg-linear-to-br from-slate-100 via-white to-slate-300 dark:border-white/10 dark:from-white/12 dark:via-white/6 dark:to-black/30",
                  session.bookCoverUrl ? "bg-cover bg-center" : "",
                )}
                style={session.bookCoverUrl ? { backgroundImage: `url(${session.bookCoverUrl})` } : undefined}
              >
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/24 to-transparent" />
                <div className="absolute left-3 top-3 flex items-center gap-2">
                  {session.isPasscodeProtected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/36 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                      <Lock className="size-3" />
                      Passcode
                    </span>
                  ) : null}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="line-clamp-2 text-lg font-semibold leading-tight text-white">
                    {session.title ?? session.bookTitle}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm text-white/80">
                    {session.authorName ? `by ${session.authorName}` : session.bookTitle}
                  </p>
                  <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.22em] text-white/62">
                    Open from cover
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-black/8 bg-white/42 px-3.5 py-3 dark:border-white/10 dark:bg-white/8">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium text-slate-900 dark:text-white">
                    {session.hostName}
                  </p>
                  <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-white/45">
                    <Users className="size-3.5" />
                    {session.memberCount} in room
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-700 transition-colors group-hover:text-slate-950 dark:text-white/70 dark:group-hover:text-white">
                  Join
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
