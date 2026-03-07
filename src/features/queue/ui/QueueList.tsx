"use client";

import { memo, useState } from "react";
import {
  CircleCheckBig,
  CircleDot,
  Clock3,
  GripVertical,
  Plus,
  Radio,
  Tag,
  UserRoundCheck,
  X,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo, getInitials } from "@/lib/formatters";
import type { ParticipantListItem } from "@/features/participants/types";
import type { QueueItem } from "@/features/queue/types";
import { useThemeGlow } from "@/hooks/useThemeGlow";

type QueueListProps = {
  queue: QueueItem[];
  isLoading: boolean;
  errorMessage: string | null;
  hideCompleted?: boolean;
  canManageQueue?: boolean;
  canReorder?: boolean;
  addableParticipants?: ParticipantListItem[];
  onRemove?: (userId: string) => void;
  onReorder?: (orderedUserIds: string[]) => void;
  onAddParticipant?: (userId: string) => Promise<void>;
};

function formatJoinedAgo(joinedAt: number) {
  return `Queued ${formatTimeAgo(joinedAt)}`;
}

function QueueStatusBadge({ status }: { status: QueueItem["status"] }) {
  if (status === "reading") {
    return (
      <Badge className="rounded-full bg-emerald-600/90 px-2.5 text-[11px] text-white hover:bg-emerald-600/90">
        Reading
      </Badge>
    );
  }

  if (status === "waiting") {
    return (
      <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
        Waiting
      </Badge>
    );
  }

  return (
    <Badge className="rounded-full bg-slate-500/90 px-2.5 text-[11px] text-white hover:bg-slate-500/90">
      Done
    </Badge>
  );
}

function SortableQueueItem({
  item,
  canManageQueue,
  canReorder,
  onRemove,
}: {
  item: QueueItem;
  canManageQueue?: boolean;
  canReorder?: boolean;
  onRemove?: (userId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.userId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border px-3 py-2 shadow-sm transition-shadow ${
        item.status === "reading"
          ? "border-emerald-300/70 bg-emerald-50/80 dark:border-emerald-400/35 dark:bg-emerald-500/14"
          : "border-white/35 bg-white/70 dark:border-white/12 dark:bg-white/6"
      } ${isDragging ? "shadow-lg ring-2 ring-indigo-400/30" : ""}`}
    >
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          {canReorder && (
            <button
              type="button"
              className="cursor-grab touch-none text-muted-foreground/40 transition-colors hover:text-muted-foreground active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-4" />
            </button>
          )}
          <div className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-white/65 bg-white/75 text-[11px] font-semibold text-muted-foreground dark:border-white/15 dark:bg-white/12">
            {item.position}
          </div>
          <Avatar className="ring-1 ring-white/70 dark:ring-white/20">
            <AvatarImage src={item.image ?? undefined} alt={item.name} />
            <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p
              className={`truncate text-sm text-foreground ${
                item.status === "reading" ? "font-semibold" : "font-medium"
              }`}
            >
              {item.name}
            </p>
            <div className="inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground">
              {item.status === "reading" ? (
                <>
                  <UserRoundCheck className="size-3.5 shrink-0 text-emerald-600" />
                  <span className="truncate">Current reader</span>
                </>
              ) : (
                <>
                  <Clock3 className="size-3.5 shrink-0" />
                  <span className="truncate">{formatJoinedAgo(item.joinedAt)}</span>
                </>
              )}
            </div>
            {item.isSkipped ? (
              <p className="mt-0.5 line-clamp-2 text-[11px] text-amber-700 dark:text-amber-400">
                {item.skipReason ? `Skip reason: ${item.skipReason}` : "Skip tagged"}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:max-w-[46%] sm:justify-end">
          {item.status === "reading" ? (
            <CircleDot className="size-4 shrink-0 text-emerald-600" />
          ) : null}
          {item.status === "done" ? (
            <CircleCheckBig className="size-4 shrink-0 text-slate-500" />
          ) : null}
          {item.isSkipped ? (
            <Badge className="rounded-full bg-amber-500/90 px-2.5 text-[11px] text-white hover:bg-amber-500/90">
              <Tag className="mr-1 size-3" />
              Skip
            </Badge>
          ) : null}
          <QueueStatusBadge status={item.status} />
          {canManageQueue && onRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 rounded-full text-muted-foreground/50 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
              onClick={() => onRemove(item.userId)}
            >
              <X className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const QueueList = memo(function QueueList({
  queue,
  isLoading,
  errorMessage,
  hideCompleted = true,
  canManageQueue,
  canReorder,
  addableParticipants = [],
  onRemove,
  onReorder,
  onAddParticipant,
}: QueueListProps) {
  const { cardShadow } = useThemeGlow();
  const [items, setItems] = useState<QueueItem[] | null>(null);
  const [isAddPopoverOpen, setIsAddPopoverOpen] = useState(false);
  const [selectedParticipantUserId, setSelectedParticipantUserId] = useState("");
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [addParticipantError, setAddParticipantError] = useState<string | null>(null);
  const visibleQueue = hideCompleted
    ? queue.filter((item) => item.status !== "done")
    : queue;
  const hiddenQueue = hideCompleted
    ? queue.filter((item) => item.status === "done")
    : [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const displayQueue = items ?? visibleQueue;
  const canAddParticipant = Boolean(canManageQueue && onAddParticipant);
  const hasAddableParticipants = addableParticipants.length > 0;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setItems(null);
      return;
    }

    const oldIndex = visibleQueue.findIndex((item) => item.userId === active.id);
    const newIndex = visibleQueue.findIndex((item) => item.userId === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      setItems(null);
      return;
    }

    const reordered = arrayMove(visibleQueue, oldIndex, newIndex);
    setItems(reordered);
    onReorder?.([
      ...reordered.map((item) => item.userId),
      ...hiddenQueue.map((item) => item.userId),
    ]);

    // Reset optimistic state after a short delay
    setTimeout(() => setItems(null), 500);
  }

  async function handleAddParticipant() {
    if (!selectedParticipantUserId || !onAddParticipant) {
      setAddParticipantError("Select a participant first.");
      return;
    }

    setIsAddingParticipant(true);
    setAddParticipantError(null);
    try {
      await onAddParticipant(selectedParticipantUserId);
      setSelectedParticipantUserId("");
      setIsAddPopoverOpen(false);
    } catch (error) {
      setAddParticipantError(
        error instanceof Error ? error.message : "Failed to add participant to queue.",
      );
    } finally {
      setIsAddingParticipant(false);
    }
  }

  const cardClass =
    "border-white/45 bg-white/68 backdrop-blur-md dark:border-white/15 dark:bg-white/8";

  if (isLoading) {
    return (
      <Card className={cardClass} style={{ boxShadow: cardShadow }}>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Radio className="size-4 text-emerald-600" />
            Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card className={cardClass} style={{ boxShadow: cardShadow }}>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Radio className="size-4 text-emerald-600" />
            Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (queue.length === 0) {
    return (
      <Card className={cardClass} style={{ boxShadow: cardShadow }}>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Radio className="size-4 text-emerald-600" />
            Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No one in queue yet.</p>
        </CardContent>
      </Card>
    );
  }

  if (displayQueue.length === 0) {
    return (
      <Card className={cardClass} style={{ boxShadow: cardShadow }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="inline-flex items-center gap-2">
              <Radio className="size-4 text-emerald-600" />
              Queue
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
                0 active
              </Badge>
              {canAddParticipant ? (
                <Popover open={isAddPopoverOpen} onOpenChange={setIsAddPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-7 rounded-full"
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-72 space-y-3 border-white/30 bg-white/92 p-3 backdrop-blur-xl dark:border-white/12 dark:bg-[#0d1222]/92"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Add participant to queue
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pick someone already in the room.
                      </p>
                    </div>
                    {hasAddableParticipants ? (
                      <>
                        <Select
                          value={selectedParticipantUserId}
                          onValueChange={setSelectedParticipantUserId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select participant" />
                          </SelectTrigger>
                          <SelectContent>
                            {addableParticipants.map((participant) => (
                              <SelectItem
                                key={participant.userId}
                                value={participant.userId}
                              >
                                {participant.name}
                                {participant.role === "host"
                                  ? " (Host)"
                                  : participant.role === "moderator"
                                    ? " (Mod)"
                                    : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          onClick={() => {
                            void handleAddParticipant();
                          }}
                          disabled={isAddingParticipant}
                          className="w-full"
                        >
                          {isAddingParticipant ? "Adding..." : "Add to queue"}
                        </Button>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Every participant is already in queue.
                      </p>
                    )}
                    {addParticipantError ? (
                      <p className="text-xs text-red-500">{addParticipantError}</p>
                    ) : null}
                  </PopoverContent>
                </Popover>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            No active readers or waiting turns right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  const queueContent = (
    <div className="space-y-2">
      {displayQueue.map((item) => (
        <SortableQueueItem
          key={item.userId}
          item={item}
          canManageQueue={canManageQueue}
          canReorder={canReorder}
          onRemove={onRemove}
        />
      ))}
    </div>
  );

  return (
    <Card className={cardClass} style={{ boxShadow: cardShadow }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="inline-flex items-center gap-2">
            <Radio className="size-4 text-emerald-600" />
            Queue
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
              {displayQueue.length} active
            </Badge>
            {canAddParticipant ? (
              <Popover open={isAddPopoverOpen} onOpenChange={setIsAddPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-7 rounded-full"
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-72 space-y-3 border-white/30 bg-white/92 p-3 backdrop-blur-xl dark:border-white/12 dark:bg-[#0d1222]/92"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Add participant to queue
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pick someone already in the room.
                    </p>
                  </div>
                  {hasAddableParticipants ? (
                    <>
                      <Select
                        value={selectedParticipantUserId}
                        onValueChange={setSelectedParticipantUserId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select participant" />
                        </SelectTrigger>
                        <SelectContent>
                          {addableParticipants.map((participant) => (
                            <SelectItem
                              key={participant.userId}
                              value={participant.userId}
                            >
                              {participant.name}
                              {participant.role === "host"
                                ? " (Host)"
                                : participant.role === "moderator"
                                  ? " (Mod)"
                                  : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={() => {
                          void handleAddParticipant();
                        }}
                        disabled={isAddingParticipant}
                        className="w-full"
                      >
                        {isAddingParticipant ? "Adding..." : "Add to queue"}
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Every participant is already in queue.
                    </p>
                  )}
                  {addParticipantError ? (
                    <p className="text-xs text-red-500">{addParticipantError}</p>
                  ) : null}
                </PopoverContent>
              </Popover>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {canReorder && onReorder ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayQueue.map((item) => item.userId)}
              strategy={verticalListSortingStrategy}
            >
              {queueContent}
            </SortableContext>
          </DndContext>
        ) : (
          queueContent
        )}
      </CardContent>
    </Card>
  );
});
