import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";

import { BackgroundProvider } from "@/components/background/BackgroundProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConvexClientProvider } from "@/app/ConvexClientProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "BookJourney — Live Reading Sessions",
    template: "%s · BookJourney",
  },
  description:
    "Create real-time reading sessions for your book club. Queue-based turns, synced timers, and live updates — no page refresh needed.",
  keywords: ["book club", "reading sessions", "live reading", "queue", "realtime"],
  openGraph: {
    type: "website",
    siteName: "BookJourney",
    title: "BookJourney — Live Reading Sessions",
    description:
      "Create real-time reading sessions for your book club. Queue-based turns, synced timers, and live updates.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BookJourney — Live Reading Sessions",
    description:
      "Queue-based live reading sessions for your book club. Real-time. No refresh needed.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <BackgroundProvider>
            <TooltipProvider>
              <ConvexClientProvider>{children}</ConvexClientProvider>
            </TooltipProvider>
          </BackgroundProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
