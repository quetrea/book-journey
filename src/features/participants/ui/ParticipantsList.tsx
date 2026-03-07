"use client";

import { ChevronUp, Crown, MoreVertical, Shield, UserMinus, Users } from "lucide-react";
import { memo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo, getInitials } from "@/lib/formatters";
import type { ParticipantListItem } from "@/features/participants/types";
import { useThemeGlow } from "@/hooks/useThemeGlow";

const MAX_VISIBLE_AVATARS = 10;

type ParticipantsListProps = {
  participants: ParticipantListItem[];
  isLoading: boolean;
  errorMessage: string | null;
  isExpanded?: boolean;
  onExpandedChange?: (isExpanded: boolean) => void;
  isHost?: boolean;
  isModerator?: boolean;
  viewerUserId?: string;
  isSessionEnded?: boolean;
  onSetRole?: (targetUserId: string, newRole: "moderator" | "reader") => void;
  onKick?: (targetUserId: string) => void;
};

function formatJoinedAgo(joinedAt: number) {
  return `Joined ${formatTimeAgo(joinedAt)}`;
}

function RoleBadge({ role }: { role: ParticipantListItem["role"] }) {
  if (role === "host") {
    return (
      <Badge className="rounded-full bg-indigo-500/90 px-2.5 text-[11px] text-white hover:bg-indigo-500/90">
        <Crown className="mr-1 size-3" />
        Host
      </Badge>
    );
  }

  if (role === "moderator") {
    return (
      <Badge className="rounded-full bg-amber-500/90 px-2.5 text-[11px] text-white hover:bg-amber-500/90">
        <Shield className="mr-1 size-3" />
        Mod
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
      Reader
    </Badge>
  );
}

export const ParticipantsList = memo(function ParticipantsList({
  participants,
  isLoading,
  errorMessage,
  isExpanded: controlledExpanded,
  onExpandedChange,
  isHost,
  isModerator,
  viewerUserId,
  isSessionEnded,
  onSetRole,
  onKick,
}: ParticipantsListProps) {
  const { cardShadow } = useThemeGlow();
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(true);
  const [kickTarget, setKickTarget] = useState<{ userId: string; name: string } | null>(null);
  const isExpanded = controlledExpanded ?? uncontrolledExpanded;

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

  const visibleAvatars = participants.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = participants.length - MAX_VISIBLE_AVATARS;

  function canShowMenu(participant: ParticipantListItem) {
    if (isSessionEnded) return false;
    if (participant.userId === viewerUserId) return false;
    if (participant.role === "host") return false;
    if (isHost) return true;
    if (isModerator && participant.role === "reader") return true;
    return false;
  }

  function handleExpandedChange(nextExpanded: boolean) {
    onExpandedChange?.(nextExpanded);
    if (controlledExpanded === undefined) {
      setUncontrolledExpanded(nextExpanded);
    }
  }

  return (
    <Card className={cardClass} style={{ boxShadow: cardShadow }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="inline-flex items-center gap-2">
            <Users className="size-4 text-indigo-500" />
            Participants
            <span className="text-sm font-normal text-muted-foreground">
              ({participants.length})
            </span>
          </CardTitle>
          <button
            type="button"
            onClick={() => handleExpandedChange(!isExpanded)}
            aria-label={isExpanded ? "Collapse participants" : "Expand participants"}
            className="rounded-full p-1 text-muted-foreground/50 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
          >
            <ChevronUp
              className={`size-4 transition-transform duration-200 ${isExpanded ? "" : "rotate-180"}`}
            />
          </button>
        </div>

        {/* Collapsed avatar stack */}
        {!isExpanded && (
          <div className="mt-1 flex items-center">
            <div className="flex items-center -space-x-2">
              {visibleAvatars.map((p) => (
                <Avatar
                  key={p.userId}
                  size="default"
                  title={`${p.name}${p.role === "host" ? " (Host)" : p.role === "moderator" ? " (Mod)" : ""}`}
                  className={`ring-2 ${
                    p.role === "moderator"
                      ? "ring-amber-400/60 dark:ring-amber-500/40"
                      : "ring-white/90 dark:ring-black/50"
                  }`}
                >
                  <AvatarImage src={p.image ?? undefined} alt={p.name} />
                  <AvatarFallback className="text-[11px]">{getInitials(p.name)}</AvatarFallback>
                </Avatar>
              ))}
              {overflowCount > 0 && (
                <div className="flex size-8 items-center justify-center rounded-full border border-black/10 bg-white/80 text-[11px] font-semibold text-muted-foreground ring-2 ring-white/90 dark:border-white/15 dark:bg-white/15 dark:ring-black/50">
                  +{overflowCount}
                </div>
              )}
            </div>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-2.5">
          {participants.map((participant, index) => (
            <div
              key={participant.userId}
              className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
                participant.role === "host"
                  ? "border-indigo-300/60 bg-indigo-50/60 dark:border-indigo-400/35 dark:bg-indigo-500/10"
                  : participant.role === "moderator"
                    ? "border-amber-300/60 bg-amber-50/60 dark:border-amber-400/35 dark:bg-amber-500/10"
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

              <div className="flex items-center gap-1.5">
                <RoleBadge role={participant.role} />

                {canShowMenu(participant) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 rounded-full text-muted-foreground/40 hover:text-foreground"
                      >
                        <MoreVertical className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {isHost && onSetRole && (
                        <>
                          {participant.role === "reader" && (
                            <DropdownMenuItem
                              onClick={() => onSetRole(participant.userId, "moderator")}
                            >
                              <Shield className="mr-2 size-4 text-amber-500" />
                              Promote to Moderator
                            </DropdownMenuItem>
                          )}
                          {participant.role === "moderator" && (
                            <DropdownMenuItem
                              onClick={() => onSetRole(participant.userId, "reader")}
                            >
                              <Users className="mr-2 size-4" />
                              Demote to Reader
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {onKick && (
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                          onClick={() =>
                            setKickTarget({
                              userId: participant.userId,
                              name: participant.name,
                            })
                          }
                        >
                          <UserMinus className="mr-2 size-4" />
                          Kick from session
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      )}

      {/* Kick confirmation dialog */}
      <AlertDialog
        open={kickTarget !== null}
        onOpenChange={(open) => {
          if (!open) setKickTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kick {kickTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove them from the session and the reading queue. They
              can rejoin via the invite link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (kickTarget && onKick) {
                  onKick(kickTarget.userId);
                }
                setKickTarget(null);
              }}
            >
              Kick
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
});
