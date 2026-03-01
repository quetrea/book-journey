"use client";

import { useMutation } from "convex/react";
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
import { api } from "../../../../convex/_generated/api";

function normalizeOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function CreateSessionModal() {
  const router = useRouter();
  const createSession = useMutation(api.sessions.createSessionServer);

  const [open, setOpen] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [hostPasscode, setHostPasscode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDisabled = useMemo(
    () => isSubmitting || bookTitle.trim().length === 0,
    [bookTitle, isSubmitting],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const normalizedBookTitle = bookTitle.trim();

    if (!normalizedBookTitle) {
      setErrorMessage("Book title is required.");
      return;
    }

    try {
      setIsSubmitting(true);

      const createdSessionId = await createSession({
        bookTitle: normalizedBookTitle,
        authorName: normalizeOptional(authorName),
        title: normalizeOptional(title),
        synopsis: normalizeOptional(synopsis),
        hostPasscode: normalizeOptional(hostPasscode),
      });

      setOpen(false);
      setBookTitle("");
      setAuthorName("");
      setTitle("");
      setSynopsis("");
      setHostPasscode("");
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
