"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { api } from "../../../../convex/_generated/api";

type AuthSessionGuardProps = {
  children: ReactNode;
};

export function AuthSessionGuard({ children }: AuthSessionGuardProps) {
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
    void signOut().catch(() => {
      // Best-effort cleanup; avoid unhandled rejections if server session is already gone.
    });
  }, [isAuthenticated, isLoading, sessionState, signOut]);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  if (isLoading || sessionState === undefined) {
    return null;
  }

  if (!sessionState.valid) {
    return null;
  }

  return <>{children}</>;
}
