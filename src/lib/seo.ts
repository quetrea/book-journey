import type { Metadata } from "next";

export const SITE_URL = "https://bookreading.space";
export const SITE_NAME = "BookJourney";
export const SITE_DESCRIPTION =
  "Create real-time reading sessions for your book club. Queue-based turns, synced timers, and live updates without page refresh.";
export const DEFAULT_OG_IMAGE = "/logo.png";

type OpenGraphMetadata = NonNullable<Metadata["openGraph"]>;
type TwitterMetadata = NonNullable<Metadata["twitter"]>;

export function toAbsoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return new URL(path, SITE_URL).toString();
}

export function buildDefaultOg(
  overrides: Partial<OpenGraphMetadata> = {},
): OpenGraphMetadata {
  const images = overrides.images ?? [toAbsoluteUrl(DEFAULT_OG_IMAGE)];

  return {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    ...overrides,
    images,
  };
}

export function buildDefaultTwitter(
  overrides: Partial<TwitterMetadata> = {},
): TwitterMetadata {
  const images = overrides.images ?? [toAbsoluteUrl(DEFAULT_OG_IMAGE)];

  return {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    ...overrides,
    images,
  };
}
