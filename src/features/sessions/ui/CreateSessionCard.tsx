"use client";

import { useMutation } from "convex/react";
import { Copy, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useThemeGlow } from "@/hooks/useThemeGlow";
import { buildSessionInvitePathFromSessionId } from "@/features/sessions/lib/inviteLinks";
import { api } from "../../../../convex/_generated/api";

type CreateSessionCardProps = {
  isReady: boolean;
  onCreated: () => void;
};

type SessionAccessType = "public" | "passcode" | "private";

const PASSCODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function normalizeOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function buildRandomPasscode(length = 6) {
  let result = "";
  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * PASSCODE_CHARS.length);
    result += PASSCODE_CHARS[randomIndex];
  }
  return result;
}

export function CreateSessionCard({ isReady, onCreated }: CreateSessionCardProps) {
  const router = useRouter();
  const createSession = useMutation(api.sessions.createSessionServer);
  const { cardShadow } = useThemeGlow();

  const [bookTitle, setBookTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [sessionAccessType, setSessionAccessType] =
    useState<SessionAccessType>("passcode");
  const [sessionPasscode, setSessionPasscode] = useState(() =>
    buildRandomPasscode(),
  );
  const [isGeneratingPasscode, setIsGeneratingPasscode] = useState(false);
  const [passcodeCopyState, setPasscodeCopyState] = useState<
    "idle" | "copied" | "error"
  >("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const passcodeAnimationTimerRef = useRef<number | null>(null);

  const isDisabled = useMemo(
    () =>
      !isReady ||
      isSubmitting ||
      bookTitle.trim().length === 0 ||
      (sessionAccessType === "passcode" && sessionPasscode.trim().length === 0),
    [bookTitle, isReady, isSubmitting, sessionAccessType, sessionPasscode],
  );

  useEffect(() => {
    if (sessionAccessType !== "passcode") {
      setSessionPasscode("");
      setPasscodeCopyState("idle");
      return;
    }

    if (!sessionPasscode) {
      setSessionPasscode(buildRandomPasscode());
    }
  }, [sessionAccessType, sessionPasscode]);

  useEffect(() => {
    return () => {
      if (passcodeAnimationTimerRef.current !== null) {
        window.clearInterval(passcodeAnimationTimerRef.current);
      }
    };
  }, []);

  function handleGeneratePasscode() {
    if (isGeneratingPasscode) {
      return;
    }

    setIsGeneratingPasscode(true);
    let ticks = 0;

    if (passcodeAnimationTimerRef.current !== null) {
      window.clearInterval(passcodeAnimationTimerRef.current);
    }

    passcodeAnimationTimerRef.current = window.setInterval(() => {
      ticks += 1;
      setSessionPasscode(buildRandomPasscode());

      if (ticks >= 12) {
        if (passcodeAnimationTimerRef.current !== null) {
          window.clearInterval(passcodeAnimationTimerRef.current);
          passcodeAnimationTimerRef.current = null;
        }
        setSessionPasscode(buildRandomPasscode());
        setIsGeneratingPasscode(false);
      }
    }, 45);
  }

  async function handleCopyPasscode() {
    if (!sessionPasscode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(sessionPasscode);
      setPasscodeCopyState("copied");
    } catch {
      setPasscodeCopyState("error");
    } finally {
      window.setTimeout(() => setPasscodeCopyState("idle"), 2_000);
    }
  }

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
        accessType: sessionAccessType,
        sessionPasscode:
          sessionAccessType === "passcode"
            ? normalizeOptional(sessionPasscode)
            : undefined,
      });

      setBookTitle("");
      setAuthorName("");
      setTitle("");
      setSynopsis("");
      setSessionAccessType("passcode");
      setSessionPasscode(buildRandomPasscode());
      setPasscodeCopyState("idle");
      setSuccessMessage("Session created.");
      onCreated();
      router.push(buildSessionInvitePathFromSessionId(createdSessionId as string));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create session.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-white/45 bg-white/66 backdrop-blur-md dark:border-white/15 dark:bg-white/7" style={{ boxShadow: cardShadow }}>
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

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Session access</p>
            <Select
              value={sessionAccessType}
              onValueChange={(value) =>
                setSessionAccessType(value as SessionAccessType)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passcode">Passcode (default)</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private (host approval)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sessionAccessType === "passcode" ? (
            <div className="space-y-2 rounded-xl border border-white/40 bg-white/60 p-3 dark:border-white/[0.14] dark:bg-white/6">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-foreground">Session passcode</p>
              </div>
              <Input
                value={sessionPasscode}
                readOnly
                className="font-mono tracking-[0.28em]"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePasscode}
                  disabled={isGeneratingPasscode || isSubmitting}
                  className="gap-1.5"
                >
                  <Shuffle
                    className={`size-3.5 ${isGeneratingPasscode ? "animate-spin" : ""}`}
                  />
                  {isGeneratingPasscode ? "Generating..." : "Regenerate"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void handleCopyPasscode();
                  }}
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  <Copy className="size-3.5" />
                  Copy passcode
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Generated by default for safer invite sharing.
                {passcodeCopyState === "copied" ? " Copied." : ""}
                {passcodeCopyState === "error" ? " Copy failed." : ""}
              </p>
            </div>
          ) : null}

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
