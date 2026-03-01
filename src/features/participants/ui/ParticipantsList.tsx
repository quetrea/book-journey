"use client";

import { Crown, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ParticipantListItem } from "@/features/participants/types";
import { useThemeGlow } from "@/hooks/useThemeGlow";

type ParticipantsListProps = {
  participants: ParticipantListItem[];
  isLoading: boolean;
  errorMessage: string | null;
};

function getInitials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

function formatJoinedAgo(joinedAt: number) {
  const diffMs = Date.now() - joinedAt;
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (minutes < 1) {
    return "Joined just now";
  }

  if (minutes < 60) {
    return `Joined ${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  return `Joined ${hours}h ago`;
}

export function ParticipantsList({
  participants,
  isLoading,
  errorMessage,
}: ParticipantsListProps) {
  const { cardShadow } = useThemeGlow();

  const cardClass = "border-white/45 bg-white/68 backdrop-blur-md dark:border-white/15 dark:bg-white/8";

  if (isLoading) {
    return (
      <Card className={cardClass} style={{ boxShadow: cardShadow }}>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Users className="size-4 text-indigo-500" />
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card className={cardClass} style={{ boxShadow: cardShadow }}>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Users className="size-4 text-indigo-500" />
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (participants.length === 0) {
    return (
      <Card className={cardClass} style={{ boxShadow: cardShadow }}>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Users className="size-4 text-indigo-500" />
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No members yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClass} style={{ boxShadow: cardShadow }}>
      <CardHeader className="pb-3">
        <CardTitle className="inline-flex items-center gap-2">
          <Users className="size-4 text-indigo-500" />
          Participants
        </CardTitle>
        <p className="text-xs text-muted-foreground">{participants.length} member(s) in this room.</p>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {participants.map((participant, index) => (
          <div
            key={participant.userId}
            className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
              participant.role === "host"
                ? "border-indigo-300/60 bg-indigo-50/60 dark:border-indigo-400/35 dark:bg-indigo-500/10"
                : "border-white/35 bg-white/56 dark:border-white/12 dark:bg-white/6"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-white/65 bg-white/75 text-[11px] font-semibold text-muted-foreground dark:border-white/15 dark:bg-white/12">
                {index + 1}
              </div>
              <Avatar className="ring-1 ring-white/70 dark:ring-white/20">
                <AvatarImage src={participant.image ?? undefined} alt={participant.name} />
                <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{participant.name}</p>
                <p className="text-xs text-muted-foreground">{formatJoinedAgo(participant.joinedAt)}</p>
              </div>
            </div>

            {participant.role === "host" ? (
              <Badge className="rounded-full bg-indigo-500/90 px-2.5 text-[11px] text-white hover:bg-indigo-500/90">
                <Crown className="mr-1 size-3" />
                Host
              </Badge>
            ) : (
              <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
                Reader
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
