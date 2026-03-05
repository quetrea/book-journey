import type { Metadata } from "next";

import AuthPageClient from "./AuthPageClient";
import { buildDefaultOg, buildDefaultTwitter, toAbsoluteUrl } from "@/lib/seo";

const authTitle = "Sign in";
const authDescription =
  "Sign in to BookJourney with Discord or continue as a guest to join live reading sessions.";

export const metadata: Metadata = {
  title: authTitle,
  description: authDescription,
  alternates: {
    canonical: "/auth",
  },
  openGraph: buildDefaultOg({
    url: toAbsoluteUrl("/auth"),
    title: `${authTitle} | BookJourney`,
    description: authDescription,
  }),
  twitter: buildDefaultTwitter({
    title: `${authTitle} | BookJourney`,
    description: authDescription,
  }),
};

export default function AuthPage() {
  return <AuthPageClient />;
}
