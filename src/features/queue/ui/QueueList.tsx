"use client";

import { memo, useState } from "react";
import {
  CircleCheckBig,
  CircleDot,
  Clock3,
  GripVertical,
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo, getInitials } from "@/lib/formatters";
import type { QueueItem } from "@/features/queue/types";
import { useThemeGlow } from "@/hooks/useThemeGlow";

type QueueListProps = {
  queue: QueueItem[];
  isLoading: boolean;
  errorMessage: string | null;
  canManageQueue?: boolean;
  canReorder?: boolean;
  onRemove?: (userId: string) => void;
  onReorder?: (orderedUserIds: string[]) => void;
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
      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 shadow-sm transition-shadow ${
        item.status === "reading"
          ? "border-emerald-300/60 bg-emerald-50/62 dark:border-emerald-400/35 dark:bg-emerald-500/12"
          : "border-white/35 bg-white/56 dark:border-white/12 dark:bg-white/6"
      } ${isDragging ? "shadow-lg ring-2 ring-indigo-400/30" : ""}`}
    >
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
          <p className="truncate text-sm font-medium text-foreground">
            {item.name}
          </p>
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            {item.status === "reading" ? (
              <>
                <UserRoundCheck className="size-3.5 text-emerald-600" />
                Current reader
              </>
            ) : (
              <>
                <Clock3 className="size-3.5" />
                {formatJoinedAgo(item.joinedAt)}
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

      <div className="flex items-center gap-2">
        {item.status === "reading" ? (
          <CircleDot className="size-4 text-emerald-600" />
        ) : null}
        {item.status === "done" ? (
          <CircleCheckBig className="size-4 text-slate-500" />
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
  );
}

export const QueueList = memo(function QueueList({
  queue,
  isLoading,
  errorMessage,
  canManageQueue,
  canReorder,
  onRemove,
  onReorder,
}: QueueListProps) {
  const { cardShadow } = useThemeGlow();
  const [items, setItems] = useState<QueueItem[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const displayQueue = items ?? queue;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setItems(null);
      return;
    }

    const oldIndex = queue.findIndex((item) => item.userId === active.id);
    const newIndex = queue.findIndex((item) => item.userId === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      setItems(null);
      return;
    }

    const reordered = arrayMove(queue, oldIndex, newIndex);
    setItems(reordered);
    onReorder?.(reordered.map((item) => item.userId));

    // Reset optimistic state after a short delay
    setTimeout(() => setItems(null), 500);
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

  const queueContent = (
    <div className="space-y-2.5">
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
      <CardHeader className="pb-3">
        <CardTitle className="inline-flex items-center gap-2">
          <Radio className="size-4 text-emerald-600" />
          Queue
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Turn order and current reader status.
        </p>
      </CardHeader>
      <CardContent>
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
