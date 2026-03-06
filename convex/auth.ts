import Discord from "@auth/core/providers/discord";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { convexAuth } from "@convex-dev/auth/server";

const GUEST_ADJECTIVES = [
  "Amber",
  "Bright",
  "Calm",
  "Clever",
  "Cozy",
  "Curious",
  "Drift",
  "Echo",
  "Gentle",
  "Hidden",
  "Kind",
  "Lucky",
  "Mellow",
  "Misty",
  "Nova",
  "Quiet",
  "River",
  "Silver",
  "Soft",
  "Swift",
] as const;

const GUEST_NOUNS = [
  "Atlas",
  "Beacon",
  "Comet",
  "Falcon",
  "Harbor",
  "Lantern",
  "Meadow",
  "Moon",
  "Pine",
  "Quill",
  "Rain",
  "Robin",
  "Stone",
  "Story",
  "Sun",
  "Tide",
  "Trail",
  "Willow",
  "Wren",
  "Zephyr",
] as const;

function randomIndex(length: number) {
  const values = crypto.getRandomValues(new Uint32Array(1));
  return values[0] % length;
}

function hashSeed(seed: string) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function buildGuestName() {
  const adjective = GUEST_ADJECTIVES[randomIndex(GUEST_ADJECTIVES.length)];
  const noun = GUEST_NOUNS[randomIndex(GUEST_NOUNS.length)];
  const suffix = String(100 + randomIndex(900));
  return `${adjective} ${noun} ${suffix}`;
}

function buildGuestAvatarDataUrl(seed: string) {
  const hash = hashSeed(seed);
  const primaryHue = hash % 360;
  const secondaryHue = (hash >> 3) % 360;
  const accentHue = (hash >> 7) % 360;
  const initials = seed
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "G";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${seed}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${primaryHue} 78% 62%)" />
          <stop offset="100%" stop-color="hsl(${secondaryHue} 72% 48%)" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="28" fill="url(#bg)" />
      <circle cx="74" cy="26" r="18" fill="hsl(${accentHue} 88% 72% / 0.42)" />
      <circle cx="23" cy="82" r="21" fill="hsl(${primaryHue} 95% 96% / 0.24)" />
      <path d="M12 70C28 54 42 52 62 59C76 64 84 60 90 52V96H12Z" fill="hsl(${secondaryHue} 72% 28% / 0.28)" />
      <text
        x="50%"
        y="54%"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="white"
        font-family="Arial, sans-serif"
        font-size="31"
        font-weight="700"
        letter-spacing="1.5"
      >
        ${initials}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * TODO(convex-auth-discord): Discord is not currently listed in Convex Auth's
 * official provider setup docs. This uses the Auth.js Discord provider in
 * best-effort mode.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
      authorization: {
        params: {
          scope: "identify",
        },
      },
    }),
    Anonymous({
      profile() {
        const name = buildGuestName();
        return {
          isAnonymous: true as const,
          name,
          image: buildGuestAvatarDataUrl(name),
        };
      },
    }),
  ],
});
