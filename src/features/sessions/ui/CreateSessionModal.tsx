"use client";

import { useAction, useMutation } from "convex/react";
import { Copy, Loader2, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { buildSessionPathFromSessionId } from "@/features/sessions/lib/inviteLinks";
import { api } from "../../../../convex/_generated/api";

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`;

function normalizeOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

type SessionAccessType = "public" | "passcode" | "private";
const PASSCODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function buildRandomPasscode(length = 6) {
  let result = "";
  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * PASSCODE_CHARS.length);
    result += PASSCODE_CHARS[randomIndex];
  }
  return result;
}

export function CreateSessionModal() {
  const router = useRouter();
  const createSession = useMutation(api.sessions.createSessionServer);
  const importBook = useAction(api.bookImport.importBookFromUrl);

  const [open, setOpen] = useState(false);
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

  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importedCoverUrl, setImportedCoverUrl] = useState<string | undefined>(undefined);
  const passcodeAnimationTimerRef = useRef<number | null>(null);

  const isDisabled = useMemo(
    () =>
      isSubmitting ||
      bookTitle.trim().length === 0 ||
      (sessionAccessType === "passcode" && sessionPasscode.trim().length === 0),
    [bookTitle, isSubmitting, sessionAccessType, sessionPasscode],
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

  async function handleImport() {
    const url = importUrl.trim();
    if (!url) return;
    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      const result = await importBook({ url });
      if (result) {
        setBookTitle(result.title);
        if (result.author) setAuthorName(result.author);
        if (result.coverUrl) setImportedCoverUrl(result.coverUrl);
        if (result.synopsis) setSynopsis(result.synopsis);
        setImportUrl("");
        setImportSuccess(
          result.synopsis ? "Book info and synopsis imported!" : "Book info imported!",
        );
      } else {
        setImportError(
          "Couldn't find book info from this link. Try a Goodreads, OpenLibrary, or Google Books URL.",
        );
      }
    } catch {
      setImportError("Import failed. Fill in the details manually.");
    } finally {
      setIsImporting(false);
    }
  }

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
        bookCoverUrl: importedCoverUrl,
        title: normalizeOptional(title),
        synopsis: normalizeOptional(synopsis),
        accessType: sessionAccessType,
        sessionPasscode:
          sessionAccessType === "passcode"
            ? normalizeOptional(sessionPasscode)
            : undefined,
      });

      setOpen(false);
      setBookTitle("");
      setAuthorName("");
      setTitle("");
      setSynopsis("");
      setSessionAccessType("passcode");
      setSessionPasscode(buildRandomPasscode());
      setPasscodeCopyState("idle");
      setImportUrl("");
      setImportError(null);
      setImportSuccess(null);
      setImportedCoverUrl(undefined);
      router.push(buildSessionPathFromSessionId(createdSessionId as string));
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

      <DialogContent className="border-white/30 bg-white/72 shadow-2xl backdrop-blur-2xl sm:max-w-xl dark:border-white/12 dark:bg-[#0d1222]/78">
        {/* Glass noise texture — clipped to dialog bounds */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div
            aria-hidden="true"
            className="absolute will-change-transform"
            style={{
              inset: "-150%",
              width: "400%",
              height: "400%",
              opacity: 0.05,
              backgroundImage: NOISE_SVG,
              backgroundRepeat: "repeat",
              backgroundSize: "200px 200px",
              animation: "grain 8s steps(10) infinite",
            }}
          />
        </div>

        {/* Top accent line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[inherit] bg-linear-to-r from-white/60 via-white/30 to-transparent dark:from-white/20 dark:via-white/10 dark:to-transparent" />

        <DialogHeader className="relative">
          <DialogTitle>Create session</DialogTitle>
          <DialogDescription>Start a live room for your reading group.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="relative flex flex-col gap-3">
          {/* Scrollable fields area */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[min(calc(100dvh-16rem),34rem)] pr-0.5">
            {/* Quick import */}
            <div className="space-y-2 rounded-xl border border-black/8 bg-black/3 p-3 dark:border-white/10 dark:bg-white/4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30">
                Import from link
              </p>
              <div className="flex gap-2">
                <Input
                  value={importUrl}
                  onChange={(e) => {
                    setImportUrl(e.target.value);
                    setImportError(null);
                    setImportSuccess(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleImport();
                    }
                  }}
                  placeholder="goodreads.com/book/... · openlibrary.org/works/..."
                  className="flex-1 text-xs"
                  disabled={isImporting}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!importUrl.trim() || isImporting}
                  onClick={() => void handleImport()}
                  className="shrink-0"
                >
                  {isImporting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    "Import"
                  )}
                </Button>
              </div>
              {importError && (
                <p className="text-[11px] text-red-500">{importError}</p>
              )}
              {importSuccess && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  {importSuccess}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-black/8 dark:border-white/8" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white/95 px-2.5 text-[10px] uppercase tracking-widest text-slate-400 dark:bg-[#0d1222] dark:text-white/30">
                  or enter manually
                </span>
              </div>
            </div>

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
              <p className="text-[11px] text-muted-foreground">
                {sessionAccessType === "public"
                  ? "Anyone with the link can enter and preview."
                  : sessionAccessType === "passcode"
                    ? "A random passcode protects the session by default."
                    : "Members send a request. Host approval is required before join."}
              </p>
            </div>

            {sessionAccessType === "passcode" ? (
              <div className="space-y-2 rounded-xl border border-black/8 bg-black/3 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">
                    Session passcode
                  </p>
                </div>
                <Input value={sessionPasscode} readOnly className="font-mono tracking-[0.28em]" />
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
                  This code is generated automatically and required before joining the session.
                  {passcodeCopyState === "copied" ? " Copied." : ""}
                  {passcodeCopyState === "error" ? " Copy failed." : ""}
                </p>
              </div>
            ) : null}
          </div>

          {/* Error + footer always visible */}
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
