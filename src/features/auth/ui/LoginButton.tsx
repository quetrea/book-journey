"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function LoginButton() {
  const { signOut } = useAuthActions();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignOut() {
    setIsWorking(true);
    setErrorMessage(null);

    try {
      await signOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sign out.";
      setErrorMessage(message);
    } finally {
      setIsWorking(false);
    }
  }

  if (isLoading) {
    return (
      <Button type="button" disabled className="w-full sm:w-auto">
        Checking authentication...
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button asChild type="button" className="w-full sm:w-auto">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void handleSignOut();
          }}
          disabled={isWorking}
          className="w-full sm:w-auto"
        >
          {isWorking ? "Signing out..." : "Sign out"}
        </Button>
        {errorMessage ? <p className="text-xs text-red-500">{errorMessage}</p> : null}
      </div>
    );
  }

  return (
    <Button
      asChild
      type="button"
      className="w-full sm:w-auto"
    >
      <Link href="/auth">Login</Link>
    </Button>
  );
}
