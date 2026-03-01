"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { UserCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../convex/_generated/api";

export function ProfileModal() {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const updateProfile = useMutation(api.users.updateProfile);

  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  if (!isAuthenticated || !profile) return null;

  const userName = profile.displayName || profile.name;
  const initials = userName.slice(0, 1).toUpperCase();

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Open profile settings"
          className="inline-flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition-all hover:bg-white/20 dark:border-white/10 dark:bg-white/8"
        >
          <UserCircle className="size-4 text-foreground/80" />
        </button>
      </DialogTrigger>

      <DialogContent className="border border-white/20 bg-black/80 backdrop-blur-2xl sm:max-w-md dark:border-white/10">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-semibold text-white">
            Your Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Avatar + Discord info */}
          <div className="flex items-center gap-4">
            <Avatar className="size-14 ring-2 ring-white/20">
              <AvatarImage src={profile.image ?? undefined} alt={userName} />
              <AvatarFallback className="bg-white/10 text-lg text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-white">{profile.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="border-[#5865F2]/30 bg-[#5865F2]/20 text-[10px] text-[#8ea1ff]"
                >
                  Discord
                </Badge>
                {profile.displayName && profile.displayName !== profile.name && (
                  <span className="text-xs text-white/50">
                    showing as &ldquo;{profile.displayName}&rdquo;
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Display name */}
          <div className="space-y-1.5">
            <Label htmlFor="displayName" className="text-xs font-medium text-white/70">
              Display name
              <span className="ml-1 text-white/35">(overrides Discord name)</span>
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={profile.name}
              maxLength={40}
              className="border-white/15 bg-white/8 text-white placeholder:text-white/30 focus-visible:ring-white/20"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-xs font-medium text-white/70">
              Bio
              <span className="ml-1 text-white/35">(optional)</span>
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio about yourself..."
              maxLength={160}
              rows={3}
              className="resize-none border-white/15 bg-white/8 text-white placeholder:text-white/30 focus-visible:ring-white/20"
            />
            <p className="text-right text-[10px] text-white/30">{bio.length}/160</p>
          </div>

          <Button
            onClick={() => void handleSave()}
            disabled={saving}
            className="w-full bg-white/15 text-white hover:bg-white/25"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
