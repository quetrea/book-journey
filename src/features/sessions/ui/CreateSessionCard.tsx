"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../../convex/_generated/api";

type CreateSessionCardProps = {
  isReady: boolean;
  onCreated: () => void;
};

function normalizeOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function CreateSessionCard({ isReady, onCreated }: CreateSessionCardProps) {
  const router = useRouter();
  const createSession = useMutation(api.sessions.createSessionServer);

  const [bookTitle, setBookTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [hostPasscode, setHostPasscode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isDisabled = useMemo(
    () => !isReady || isSubmitting || bookTitle.trim().length === 0,
    [bookTitle, isReady, isSubmitting],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

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

      const createdSessionId = await createSession({
        bookTitle: normalizedBookTitle,
        authorName: normalizeOptional(authorName),
        title: normalizeOptional(title),
        synopsis: normalizeOptional(synopsis),
        hostPasscode: normalizeOptional(hostPasscode),
      });

      setBookTitle("");
      setAuthorName("");
      setTitle("");
      setSynopsis("");
      setHostPasscode("");
      setSuccessMessage("Session created.");
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
    <Card className="border-white/[0.45] bg-white/[0.66] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.07] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
      <CardHeader>
        <CardTitle>Create Session</CardTitle>
        <CardDescription>Start a live room for your reading group.</CardDescription>
      </CardHeader>

      <CardContent>
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
          {successMessage ? <p className="text-xs text-emerald-600">{successMessage}</p> : null}

          {!isReady ? (
            <p className="text-xs text-muted-foreground">Preparing account...</p>
          ) : null}

          <Button type="submit" disabled={isDisabled} className="w-full sm:w-auto">
            {isSubmitting ? "Creating..." : "Create session"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        Sessions update in real time for your account.
      </CardFooter>
    </Card>
  );
}
