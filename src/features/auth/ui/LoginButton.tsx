"use client";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function LoginButton() {
  return (
    <Button
      type="button"
      onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
      className="w-full sm:w-auto"
    >
      Continue with Discord
    </Button>
  );
}
