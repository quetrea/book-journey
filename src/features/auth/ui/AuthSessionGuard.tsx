"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { api } from "../../../../convex/_generated/api";

type AuthSessionGuardProps = {
  children: ReactNode;
};

export function AuthSessionGuard({ children }: AuthSessionGuardProps) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const touchActivity = useMutation(api.users.touchActivityServer);
  const hasTriggeredSignOutRef = useRef(false);
  const sessionState = useQuery(
    api.users.getSessionState,
    isAuthenticated ? {} : "skip",
  );
  const isValidSession = isAuthenticated && !isLoading && sessionState?.valid === true;

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

  useEffect(() => {
    if (!isValidSession) {
      return;
    }

    const touch = () => {
      void touchActivity({}).catch(() => {
        // Best-effort activity signal; skip retries on transient errors.
      });
    };

    touch();
    const intervalId = window.setInterval(touch, 10 * 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isValidSession, touchActivity]);

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
