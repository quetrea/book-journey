"use client";

import { useAction, useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../../convex/_generated/api";

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`;

function normalizeOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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
  const [hostPasscode, setHostPasscode] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const isDisabled = useMemo(
    () => isSubmitting || bookTitle.trim().length === 0,
    [bookTitle, isSubmitting],
  );

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
        setImportUrl("");
        setImportSuccess("Book info imported!");
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
        title: normalizeOptional(title),
        synopsis: normalizeOptional(synopsis),
        hostPasscode: normalizeOptional(hostPasscode),
        isPrivate: isPrivate || undefined,
      });

      setOpen(false);
      setBookTitle("");
      setAuthorName("");
      setTitle("");
      setSynopsis("");
      setHostPasscode("");
      setIsPrivate(false);
      setImportUrl("");
      setImportError(null);
      setImportSuccess(null);
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

      <DialogContent className="relative overflow-hidden border-white/45 bg-white/95 backdrop-blur-md sm:max-w-xl dark:border-white/15 dark:bg-[#0d1222]/95">
        {/* Glass noise texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute will-change-transform"
          style={{
            inset: "-150%",
            width: "400%",
            height: "400%",
            opacity: 0.04,
            backgroundImage: NOISE_SVG,
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px",
            animation: "grain 8s steps(10) infinite",
          }}
        />

        <DialogHeader className="relative">
          <DialogTitle>Create session</DialogTitle>
          <DialogDescription>Start a live room for your reading group.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="relative space-y-3">
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
          <Input
            value={hostPasscode}
            onChange={(event) => setHostPasscode(event.target.value)}
            placeholder="Host passcode (optional)"
            type="password"
          />

          <div className="flex items-center justify-between gap-3 rounded-xl border border-black/8 bg-black/3 px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
            <div>
              <p className="text-xs font-medium text-foreground">Private session</p>
              <p className="text-[11px] text-muted-foreground">Hidden from the public listing on the home page</p>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

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
