"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ArrowLeft, Link2, RefreshCcw, Shield, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { LoginButton } from "@/features/auth/ui/LoginButton";
import { useThemeGlow } from "@/hooks/useThemeGlow";
import { api } from "../../../convex/_generated/api";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.12.11 18.18.12 18.24a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export default function SettingsPageClient() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const { sectionShadow, cardShadow } = useThemeGlow();
  const router = useRouter();

  const profile = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const upsertCurrentUser = useMutation(api.users.upsertCurrentUser);
  const deleteAccount = useMutation(api.users.deleteMyAccountServer);

  const syncStartedRef = useRef(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [profileSyncError, setProfileSyncError] = useState<string | null>(null);
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);
  const [isConnectingDiscord, setIsConnectingDiscord] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const updateProfile = useMutation(api.users.updateProfile);
  const [displayName, setDisplayName] = useState("");
  const [displayImage, setDisplayImage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState<string | null>(null);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setDisplayName(profile.displayName ?? "");
    setDisplayImage(profile.displayImage ?? "");
  }, [profile]);

  useEffect(() => {
    if (!isAuthenticated) {
      syncStartedRef.current = false;
      return;
    }

    if (syncStartedRef.current) {
      return;
    }

    syncStartedRef.current = true;

    async function syncProfile() {
      try {
        await upsertCurrentUser({});
        setProfileSyncError(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to sync profile.";
        setProfileSyncError(message);
      }
    }

    void syncProfile();
  }, [isAuthenticated, upsertCurrentUser]);

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      try {
        await signOut();
      } catch {
        // Account cleanup may invalidate the session before the explicit sign-out completes.
      }
      router.replace("/");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete account.");
      setIsDeleting(false);
    }
  }

  async function handleConnectDiscord() {
    setIsConnectingDiscord(true);
    setConnectionError(null);
    try {
      await signIn("discord", { redirectTo: "/settings" });
    } catch (error) {
      setConnectionError(
        error instanceof Error
          ? error.message
          : "Failed to connect Discord.",
      );
      setIsConnectingDiscord(false);
    }
  }

  async function handleSaveProfile() {
    setIsSavingProfile(true);
    setProfileSaveError(null);
    setProfileSaveMessage(null);

    try {
      await updateProfile({
        displayName: displayName.trim() || undefined,
        displayImage: displayImage.trim() || undefined,
      });
      setProfileSaveMessage("Profile updated.");
    } catch (error) {
      setProfileSaveError(
        error instanceof Error ? error.message : "Failed to update profile.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleSyncFromDiscord() {
    setIsSavingProfile(true);
    setProfileSaveError(null);
    setProfileSaveMessage(null);

    try {
      await updateProfile({
        displayName: undefined,
        displayImage: undefined,
      });
      setDisplayName("");
      setDisplayImage("");
      setProfileSaveMessage("Discord profile reflected.");
    } catch (error) {
      setProfileSaveError(
        error instanceof Error
          ? error.message
          : "Failed to reflect Discord profile.",
      );
    } finally {
      setIsSavingProfile(false);
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
  const userImage = profile?.displayImage || profile?.image;
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
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="ring-1 ring-white/70 dark:ring-white/20">
                  <AvatarImage src={userImage ?? undefined} alt={userName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{userName}</p>
                  <Badge variant="secondary" className="mt-0.5 rounded-full px-2 py-0 text-[11px]">
                    {profile?.isGuest ? "Guest" : "Discord"}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="displayName"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Display name
                  </label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder={profile?.name ?? "Reader"}
                    maxLength={40}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="displayImage"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Profile image URL
                  </label>
                  <Input
                    id="displayImage"
                    value={displayImage}
                    onChange={(event) => setDisplayImage(event.target.value)}
                    placeholder={profile?.image ?? "https://..."}
                    inputMode="url"
                    autoComplete="url"
                  />
                  <p className="text-xs text-muted-foreground/80">
                    Paste an image URL if you want to override your current avatar.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => void handleSaveProfile()}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? "Saving..." : "Save profile"}
                </Button>
                {!profile?.isGuest ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleSyncFromDiscord()}
                    disabled={isSavingProfile}
                    className="gap-2"
                  >
                    <RefreshCcw className="size-4" />
                    Reflect from Discord
                  </Button>
                ) : null}
              </div>

              {profileSaveMessage ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {profileSaveMessage}
                </p>
              ) : null}
              {profileSaveError ? (
                <p className="text-xs text-red-500">{profileSaveError}</p>
              ) : null}
            </CardContent>
          </Card>

          <Card
            className="border-white/45 bg-white/66 backdrop-blur-md dark:border-white/15 dark:bg-white/7"
            style={{ boxShadow: cardShadow }}
          >
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-base">
                <Link2 className="size-4 text-foreground/80" />
                Connections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {profile?.isGuest ? (
                <>
                  <p>
                    Connect Discord if you want to convert this guest account into
                    a normal persistent account.
                  </p>
                  <p>
                    Your current sessions, joined rooms, and saved data stay on
                    this account after the connection is completed.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setConnectionError(null);
                      setIsDiscordModalOpen(true);
                    }}
                    className="gap-2 border-black/10 bg-white/60 text-slate-700 hover:bg-white/80 hover:text-slate-900 dark:border-white/12 dark:bg-white/6 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <DiscordIcon className="size-4 text-[#5865F2]" />
                    Connect Discord
                  </Button>
                </>
              ) : (
                <>
                  <p>Discord is already connected to this account.</p>
                  <p>
                    This profile is now persistent, so signing out will not delete
                    your account data.
                  </p>
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white/55 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-md dark:border-white/12 dark:bg-white/8">
                    <DiscordIcon className="size-3.5 text-[#5865F2]" />
                    Connected with Discord
                  </div>
                </>
              )}
              {connectionError ? (
                <p className="text-xs text-red-500">{connectionError}</p>
              ) : null}
              {profileSyncError ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {profileSyncError}
                </p>
              ) : null}
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
              {profile?.isGuest ? (
                <>
                  <p>
                    Guest profiles are temporary. As soon as you sign out, all of
                    your session data is deleted immediately.
                  </p>
                  <p>
                    If you connect Discord first, this guest account becomes a
                    normal account and stops being treated as temporary.
                  </p>
                </>
              ) : (
                <p>
                  We only request Discord <strong className="text-foreground">identify</strong>{" "}
                  scope &mdash; no email, no servers, no messages.
                </p>
              )}
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

      <Dialog open={isDiscordModalOpen} onOpenChange={setIsDiscordModalOpen}>
        <DialogContent className="border-white/35 bg-white/78 shadow-2xl backdrop-blur-2xl dark:border-white/12 dark:bg-[#0d1222]/86">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DiscordIcon className="size-5 text-[#5865F2]" />
              Connect Discord
            </DialogTitle>
            <DialogDescription>
              Connecting Discord converts this temporary guest account into a
              normal BookJourney account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl border border-black/8 bg-black/3 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="font-medium text-foreground">
                What changes after connecting
              </p>
              <ul className="mt-2 space-y-2">
                <li>Your current guest identity becomes a persistent account.</li>
                <li>Your current sessions, joins, and saved data stay attached.</li>
                <li>Signing out will no longer delete this account automatically.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-black/8 bg-black/3 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="font-medium text-foreground">Requested Discord scope</p>
              <p className="mt-1">
                We only request <strong className="text-foreground">identify</strong>.
                No email, no servers, no messages.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDiscordModalOpen(false)}
              disabled={isConnectingDiscord}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleConnectDiscord()}
              disabled={isConnectingDiscord}
              className="gap-2 bg-[#5865F2] text-white hover:bg-[#4752c4]"
            >
              <DiscordIcon className="size-4" />
              {isConnectingDiscord ? "Redirecting..." : "Connect Discord"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
