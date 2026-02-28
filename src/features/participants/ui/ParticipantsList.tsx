import { Crown, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ParticipantListItem } from "@/features/participants/types";

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
  if (isLoading) {
    return (
      <Card className="border-white/[0.45] bg-white/[0.68] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.08] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
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
      <Card className="border-white/[0.45] bg-white/[0.68] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.08] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
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
      <Card className="border-white/[0.45] bg-white/[0.68] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.08] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
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
    <Card className="border-white/[0.45] bg-white/[0.68] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.08] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
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
                : "border-white/[0.35] bg-white/[0.56] dark:border-white/[0.12] dark:bg-white/[0.06]"
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
