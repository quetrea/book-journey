import type { Metadata } from "next";

import SettingsPageClient from "./SettingsPageClient";
import { buildDefaultOg, buildDefaultTwitter, toAbsoluteUrl } from "@/lib/seo";

const settingsTitle = "Settings";
const settingsDescription =
  "Manage your BookJourney profile, privacy preferences, and account deletion controls.";

export const metadata: Metadata = {
  title: settingsTitle,
  description: settingsDescription,
  alternates: {
    canonical: "/settings",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: buildDefaultOg({
    url: toAbsoluteUrl("/settings"),
    title: `${settingsTitle} | BookJourney`,
    description: settingsDescription,
  }),
  twitter: buildDefaultTwitter({
    title: `${settingsTitle} | BookJourney`,
    description: settingsDescription,
  }),
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
