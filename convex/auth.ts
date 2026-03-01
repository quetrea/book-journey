import Discord from "@auth/core/providers/discord";
import { convexAuth } from "@convex-dev/auth/server";

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
    }),
  ],
});
