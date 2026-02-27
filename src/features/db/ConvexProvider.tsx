"use client";

import type { ReactNode } from "react";
import { ConvexProvider } from "convex/react";

import { convex } from "./convexClient";

type AppConvexProviderProps = {
  children: ReactNode;
};

export function AppConvexProvider({ children }: AppConvexProviderProps) {
  // MVP uses a plain ConvexProvider; Convex auth provider can be added later.
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
