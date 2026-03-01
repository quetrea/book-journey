"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import type { ReactNode } from "react";

import { convex } from "@/features/db/convexClient";

type ConvexClientProviderProps = {
  children: ReactNode;
};

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
