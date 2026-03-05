import type { Metadata } from "next";

import { buildDefaultOg, buildDefaultTwitter, toAbsoluteUrl } from "@/lib/seo";

const dashboardTitle = "Dashboard | BookJourney";
const dashboardDescription =
  "Manage your reading sessions, queue access, and activity from the BookJourney dashboard.";

export const metadata: Metadata = {
  title: "Dashboard",
  description: dashboardDescription,
  alternates: {
    canonical: "/dashboard",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: buildDefaultOg({
    url: toAbsoluteUrl("/dashboard"),
    title: dashboardTitle,
    description: dashboardDescription,
  }),
  twitter: buildDefaultTwitter({
    title: dashboardTitle,
    description: dashboardDescription,
  }),
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
