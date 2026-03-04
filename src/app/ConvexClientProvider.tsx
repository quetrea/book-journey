"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import type { ReactNode } from "react";

import { convex } from "@/features/db/convexClient";
import { AuthSessionGuard } from "@/features/auth/ui/AuthSessionGuard";

type ConvexClientProviderProps = {
  children: ReactNode;
};

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  return (
    <ConvexAuthProvider client={convex}>
      <AuthSessionGuard>{children}</AuthSessionGuard>
    </ConvexAuthProvider>
  );
}
