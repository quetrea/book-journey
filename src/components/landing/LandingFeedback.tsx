"use client";

import { useMutation } from "convex/react";
import { MessageSquare } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../convex/_generated/api";

export function LandingFeedback() {
  const submitFeedback = useMutation(api.feedback.submitFeedback);

  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 4) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await submitFeedback({
        message: message.trim(),
        name: name.trim() || undefined,
      });
      setSubmitted(true);
      setMessage("");
      setName("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="mt-14 animate-in fade-in slide-in-from-bottom-4 animation-duration-[700ms] fill-mode-[both]"
      style={{ animationDelay: "300ms" }}
    >
      {/* Section header */}
      <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-white/40">
        <MessageSquare className="size-3.5" />
        Feedback
      </div>

      <div className="rounded-2xl border border-black/8 bg-white/70 p-5 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/6 dark:shadow-[0_4px_32px_-8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-6">
        {submitted ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <span className="text-2xl">🙏</span>
            <p className="text-sm font-medium text-slate-700 dark:text-white/80">
              Thanks for the feedback!
            </p>
            <p className="text-xs text-slate-400 dark:text-white/35">
              Every message helps make BookJourney better.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-2 text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline dark:text-white/30 dark:hover:text-white/60"
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700 dark:text-white/75">
                What&apos;s on your mind?
              </p>
              <p className="text-xs text-slate-400 dark:text-white/35">
                A bug, a feature idea, or just something you&apos;d like to see — all welcome.
              </p>
            </div>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your feedback..."
              rows={3}
              maxLength={2000}
              className="resize-none text-sm"
              disabled={isSubmitting}
            />

            <div className="flex items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                maxLength={80}
                className="h-9 flex-1 text-xs"
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || message.trim().length < 4}
                className="shrink-0"
              >
                {isSubmitting ? "Sending..." : "Send"}
              </Button>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
