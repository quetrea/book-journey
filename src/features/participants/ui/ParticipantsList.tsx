import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParticipantListItem } from "@/features/participants/types";

type ParticipantsListProps = {
  participants: ParticipantListItem[];
  isLoading: boolean;
  errorMessage: string | null;
};

function getInitials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

export function ParticipantsList({
  participants,
  isLoading,
  errorMessage,
}: ParticipantsListProps) {
  if (isLoading) {
    return (
      <Card className="border-white/[0.45] bg-white/[0.66] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.07] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
        <CardHeader>
          <CardTitle>Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading participants...</p>
        </CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card className="border-white/[0.45] bg-white/[0.66] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.07] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
        <CardHeader>
          <CardTitle>Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (participants.length === 0) {
    return (
      <Card className="border-white/[0.45] bg-white/[0.66] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.07] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
        <CardHeader>
          <CardTitle>Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No members yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/[0.45] bg-white/[0.66] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.07] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
      <CardHeader>
        <CardTitle>Participants</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {participants.map((participant) => (
          <div
            key={participant.userId}
            className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.35] bg-white/[0.52] px-3 py-2.5 dark:border-white/[0.12] dark:bg-white/[0.05]"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar size="sm" className="ring-1 ring-white/70 dark:ring-white/20">
                <AvatarImage src={participant.image ?? undefined} alt={participant.name} />
                <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
              </Avatar>
              <p className="truncate text-sm font-medium text-foreground">{participant.name}</p>
            </div>

            {participant.role === "host" ? (
              <Badge className="rounded-full bg-indigo-500/90 px-2.5 text-[11px] text-white hover:bg-indigo-500/90">
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
