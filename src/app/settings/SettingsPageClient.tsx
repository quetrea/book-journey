"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ArrowLeft, Shield, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { LoginButton } from "@/features/auth/ui/LoginButton";
import { useThemeGlow } from "@/hooks/useThemeGlow";
import { api } from "../../../convex/_generated/api";

export default function SettingsPageClient() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const { sectionShadow, cardShadow } = useThemeGlow();
  const router = useRouter();

  const profile = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const deleteAccount = useMutation(api.users.deleteMyAccountServer);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      await signOut();
      router.replace("/");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete account.");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-10">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-2xl items-center justify-center rounded-3xl border border-black/10 bg-white/60 p-6 text-sm text-slate-400 backdrop-blur-xl dark:border-white/15 dark:bg-black/40 dark:text-white/50">
          Loading...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-10">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-2xl flex-col items-center justify-center gap-3 rounded-3xl border border-black/10 bg-white/60 p-6 text-center backdrop-blur-xl dark:border-white/15 dark:bg-black/40">
          <p className="text-sm text-slate-500 dark:text-white/60">You are not signed in.</p>
          <LoginButton />
        </div>
      </main>
    );
  }

  const userName = (profile?.displayName || profile?.name) ?? "User";
  const initials = userName.slice(0, 1).toUpperCase();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <section
          className="space-y-6 rounded-3xl border border-black/8 bg-white/52 p-5 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-500 sm:p-7 dark:border-white/15 dark:bg-black/35"
          style={{ boxShadow: sectionShadow }}
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Settings
            </h1>
          </div>

          {/* Profile card */}
          <Card
            className="border-white/45 bg-white/66 backdrop-blur-md dark:border-white/15 dark:bg-white/7"
            style={{ boxShadow: cardShadow }}
          >
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="ring-1 ring-white/70 dark:ring-white/20">
                  <AvatarImage src={profile?.image ?? undefined} alt={userName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{userName}</p>
                  <Badge variant="secondary" className="mt-0.5 rounded-full px-2 py-0 text-[11px]">
                    {profile?.isGuest ? "Guest" : "Discord"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy card */}
          <Card
            className="border-white/45 bg-white/66 backdrop-blur-md dark:border-white/15 dark:bg-white/7"
            style={{ boxShadow: cardShadow }}
          >
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-base">
                <Shield className="size-4 text-emerald-600 dark:text-emerald-400" />
                Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>We only request Discord <strong className="text-foreground">identify</strong> scope &mdash; no email, no servers, no messages.</p>
              <p>
                Read our{" "}
                <Link href="/privacy" className="font-medium text-foreground underline underline-offset-4 hover:text-indigo-600 dark:hover:text-indigo-400">
                  Privacy Policy
                </Link>{" "}
                for full details.
              </p>
            </CardContent>
          </Card>

          <Separator className="bg-white/55 dark:bg-white/10" />

          {/* Danger zone */}
          <Card
            className="border-red-200/60 bg-red-50/40 backdrop-blur-md dark:border-red-500/20 dark:bg-red-500/5"
            style={{ boxShadow: cardShadow }}
          >
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-base text-red-700 dark:text-red-400">
                <Trash2 className="size-4" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-red-700/80 dark:text-red-400/70">
                Permanently delete your account and remove all your data from BookJourney.
                This action cannot be undone. If you are a host, your sessions will be transferred
                to another participant or ended.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="border-red-300 bg-white text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              >
                <Trash2 className="mr-2 size-4" />
                Delete my account
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteDialog(false);
          setConfirmText("");
          setDeleteError(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This permanently deletes your account and removes you from all sessions
                  and queues. This action <strong>cannot be undone</strong>.
                </p>
                <p>
                  If you are a host of any active session, the host role will be transferred
                  to another participant. If no one else is in the session, it will be ended.
                </p>
                <div className="pt-1">
                  <label htmlFor="confirm-delete" className="mb-1.5 block text-xs font-medium text-foreground">
                    Type <strong>DELETE</strong> to confirm
                  </label>
                  <Input
                    id="confirm-delete"
                    placeholder="DELETE"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    disabled={isDeleting}
                    className="font-mono"
                    autoComplete="off"
                  />
                </div>
                {deleteError && (
                  <p className="text-xs text-red-500">{deleteError}</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              disabled={confirmText !== "DELETE" || isDeleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteAccount();
              }}
            >
              {isDeleting ? "Deleting..." : "Delete my account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
