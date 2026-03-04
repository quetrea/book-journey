import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function useSessionToasts(
  participants: Array<{ userId: string; name: string; role?: string }> | undefined,
  queue: Array<{ userId: string; name: string; status: string }> | undefined,
  viewerUserId: string | null | undefined,
) {
  const prevParticipantIds = useRef<Set<string> | null>(null);
  const prevReaderId = useRef<string | null | undefined>(undefined);
  const prevViewerRole = useRef<string | null>(null);
  const isInitialLoad = useRef(true);

  // Detect new participants
  useEffect(() => {
    if (participants === undefined) return;
    const currentIds = new Set(participants.map((p) => p.userId));

    if (prevParticipantIds.current === null) {
      prevParticipantIds.current = currentIds;
      return;
    }

    const prevIds = prevParticipantIds.current;
    const newJoiners = participants.filter((p) => !prevIds.has(p.userId));
    for (const joiner of newJoiners) {
      if (joiner.userId !== viewerUserId) {
        toast(`${joiner.name} joined the session`);
      }
    }
    prevParticipantIds.current = currentIds;
  }, [participants, viewerUserId]);

  // Detect viewer role change (promote/demote)
  useEffect(() => {
    if (participants === undefined || !viewerUserId) return;
    const viewer = participants.find((p) => p.userId === viewerUserId);
    const currentRole = viewer?.role ?? null;

    if (prevViewerRole.current !== null && currentRole !== null && currentRole !== prevViewerRole.current) {
      if (currentRole === "moderator") {
        toast.success("You've been promoted to Moderator");
      } else if (currentRole === "reader" && prevViewerRole.current === "moderator") {
        toast("Your role has been changed to Reader");
      }
    }
    prevViewerRole.current = currentRole;
  }, [participants, viewerUserId]);

  // Detect reader change
  useEffect(() => {
    if (queue === undefined) return;
    const currentReader = queue.find((item) => item.status === "reading");
    const currentReaderId = currentReader?.userId ?? null;

    if (isInitialLoad.current) {
      prevReaderId.current = currentReaderId;
      isInitialLoad.current = false;
      return;
    }

    if (currentReaderId !== prevReaderId.current && currentReader) {
      if (currentReader.userId === viewerUserId) {
        toast("It's your turn to read!");
      } else {
        toast(`${currentReader.name} is now reading`);
      }
    }
    prevReaderId.current = currentReaderId;
  }, [queue, viewerUserId]);
}
