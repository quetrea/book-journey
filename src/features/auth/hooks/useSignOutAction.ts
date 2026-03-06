"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";

import { api } from "../../../../convex/_generated/api";

export function useSignOutAction() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const deleteGuestAccountOnSignOut = useMutation(
    api.users.deleteGuestAccountOnSignOutServer,
  );

  async function signOutCurrentUser() {
    const result = await deleteGuestAccountOnSignOut({});

    if (result.deletedGuest) {
      try {
        await signOut();
      } catch {
        // The guest auth session may already be gone after server-side cleanup.
      }

      router.replace("/");
      router.refresh();
      return;
    }

    await signOut();
  }

  return { signOutCurrentUser };
}
