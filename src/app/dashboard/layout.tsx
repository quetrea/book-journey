import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your reading sessions, join queues, and track your book clubs.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
