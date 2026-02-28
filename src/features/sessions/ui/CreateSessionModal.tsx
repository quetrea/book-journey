"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CreateSessionModalProps = {
  isReady: boolean;
  onCreated: () => void;
};

function normalizeOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function CreateSessionModal({ isReady, onCreated }: CreateSessionModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [hostPasscode, setHostPasscode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDisabled = useMemo(
    () => !isReady || isSubmitting || bookTitle.trim().length === 0,
    [bookTitle, isReady, isSubmitting],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const normalizedBookTitle = bookTitle.trim();

    if (!normalizedBookTitle) {
      setErrorMessage("Book title is required.");
      return;
    }

    if (!isReady) {
      setErrorMessage("Preparing account...");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/sessions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookTitle: normalizedBookTitle,
          authorName: normalizeOptional(authorName),
          title: normalizeOptional(title),
          synopsis: normalizeOptional(synopsis),
          hostPasscode: normalizeOptional(hostPasscode),
        }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof body?.error === "string" ? body.error : "Failed to create session.";
        throw new Error(message);
      }

      const createdSessionId =
        typeof body?.sessionId === "string"
          ? body.sessionId
          : typeof body?.session?._id === "string"
            ? body.session._id
            : null;

      if (!createdSessionId) {
        throw new Error("Session created but no sessionId was returned.");
      }

      setOpen(false);
      setBookTitle("");
      setAuthorName("");
      setTitle("");
      setSynopsis("");
      setHostPasscode("");
      onCreated();
      router.push(`/s/${createdSessionId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create session.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          disabled={!isReady}
          className="w-full sm:w-auto transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-16px_rgba(79,70,229,0.75)]"
        >
          Create session
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/[0.45] bg-white/[0.95] backdrop-blur-md sm:max-w-xl dark:border-white/[0.15] dark:bg-[#0d1222]/[0.95]">
        <DialogHeader>
          <DialogTitle>Create session</DialogTitle>
          <DialogDescription>Start a live room for your reading group.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            value={bookTitle}
            onChange={(event) => setBookTitle(event.target.value)}
            placeholder="Book title"
            required
          />
          <Input
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            placeholder="Author name (optional)"
          />
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Session title (optional)"
          />
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Synopsis (optional)</p>
            <Textarea
              value={synopsis}
              onChange={(event) => setSynopsis(event.target.value)}
              placeholder="Add a short synopsis..."
              rows={3}
            />
          </div>
          <Input
            value={hostPasscode}
            onChange={(event) => setHostPasscode(event.target.value)}
            placeholder="Host passcode (optional)"
            type="password"
          />

          {errorMessage ? <p className="text-xs text-red-500">{errorMessage}</p> : null}
          {!isReady ? (
            <p className="text-xs text-muted-foreground">Preparing account...</p>
          ) : null}

          <DialogFooter className="pt-1">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isDisabled}>
              {isSubmitting ? "Creating..." : "Create session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
