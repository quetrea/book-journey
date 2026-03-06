"use client";

import { useQuery } from "convex/react";
import { ArrowRight, BookOpen, Lock, Users } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buildSessionInvitePathFromSessionId } from "@/features/sessions/lib/inviteLinks";
import { getInitials } from "@/lib/formatters";
import { api } from "../../../convex/_generated/api";

export function LiveSessionsSection() {
  const sessions = useQuery(api.sessions.listPublicSessionsServer);

  // Don't render until loaded; hide section entirely if no sessions
  if (!sessions || sessions.length === 0) return null;

  return (
    <section
      className="mt-14 animate-in fade-in slide-in-from-bottom-4 animation-duration-[700ms] fill-mode-[both]"
      style={{ animationDelay: "420ms" }}
    >
      {/* Section header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-white/40">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
          Live Sessions
        </div>
        <span className="rounded-full border border-black/8 bg-black/5 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:border-white/10 dark:bg-white/8 dark:text-white/40">
          {sessions.length} active
        </span>
      </div>

      {/* Sessions grid */}
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
            <div className="relative overflow-hidden rounded-2xl border border-black/8 bg-white/70 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-black/12 hover:bg-white/85 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/6 dark:shadow-[0_4px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:border-white/18 dark:hover:bg-white/9 dark:hover:shadow-[0_14px_44px_-8px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]">

              {/* Top accent strip */}
              <div className="h-0.5 w-full bg-linear-to-r from-indigo-400/60 via-purple-400/40 to-transparent dark:from-indigo-500/50 dark:via-purple-500/30" />

              <div className="p-4">
                {/* Book info */}
                <div className="mb-3 flex items-start gap-2.5">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-black/8 bg-black/5 dark:border-white/12 dark:bg-white/8">
                    <BookOpen className="size-3.5 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-tight text-slate-900 dark:text-white">
                      {session.bookTitle}
                    </p>
                    {session.authorName && (
                      <p className="truncate text-[11px] text-slate-500 dark:text-white/40">
                        {session.authorName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Host row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Avatar className="size-5 ring-1 ring-white/60 dark:ring-white/15">
                      <AvatarImage src={session.hostImage ?? undefined} alt={session.hostName} />
                      <AvatarFallback className="text-[9px]">
                        {getInitials(session.hostName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-[11px] text-slate-500 dark:text-white/40">
                      {session.hostName}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {session.isPasscodeProtected && (
                      <Lock className="size-3 text-slate-400/70 dark:text-white/30" />
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-white/30">
                      <Users className="size-3" />
                      {session.memberCount}
                    </span>
                    <span className="text-[11px] font-medium text-indigo-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-indigo-400">
                      Join
                      <ArrowRight className="ml-0.5 inline size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
