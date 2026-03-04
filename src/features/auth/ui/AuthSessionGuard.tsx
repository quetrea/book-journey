"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useRef } from "react";

import { api } from "../../../../convex/_generated/api";

export function AuthSessionGuard() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const hasTriggeredSignOutRef = useRef(false);
  const sessionState = useQuery(
    api.users.getSessionState,
    isAuthenticated ? {} : "skip",
  );

  useEffect(() => {
    if (!isAuthenticated) {
      hasTriggeredSignOutRef.current = false;
      return;
    }

    if (isLoading || sessionState === undefined || sessionState.valid) {
      return;
    }

    if (hasTriggeredSignOutRef.current) {
      return;
    }

    hasTriggeredSignOutRef.current = true;
    void signOut();
  }, [isAuthenticated, isLoading, sessionState, signOut]);

  return null;
}
