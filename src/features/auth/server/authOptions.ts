import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

type DiscordProfile = {
  id?: string;
  username?: string;
  global_name?: string;
};

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      const discordProfile = profile as DiscordProfile | undefined;

      if (typeof account?.access_token === "string") {
        token.accessToken = account.access_token;
      }

      if (user?.id) {
        token.id = user.id;
        token.discordId = user.id;
      }

      if (discordProfile?.id) {
        token.id = discordProfile.id;
        token.discordId = discordProfile.id;
      }

      const preferredName =
        discordProfile?.global_name ??
        discordProfile?.username ??
        user?.name ??
        token.name;

      if (preferredName) {
        token.discordName = preferredName;
        token.name = preferredName;
      }

      if (user?.image) {
        token.picture = user.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? token.sub ?? "";
        session.user.discordId = token.discordId ?? token.id ?? token.sub ?? "";
        session.user.name = token.discordName ?? token.name ?? session.user.name;
        session.user.image =
          (typeof token.picture === "string" ? token.picture : null) ??
          session.user.image;
      }

      return session;
    },
  },
};
