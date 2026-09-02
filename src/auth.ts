import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { upsertGitHubUser } from "@/lib/auth-users";
import { SESSION_MAX_AGE } from "@/lib/session";
import { mutate } from "@/lib/store";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID ?? "unset",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? "unset",
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, trigger }) {
      void trigger;
      if (account?.provider === "github" && profile) {
        const guestId =
          token.authKind === "guest" ? (token.sparkUserId as string | undefined) : undefined;
        const ghId = String((profile as { id?: string | number }).id ?? "");
        try {
          const result = await mutate((s) => {
            const taken = s.users.find((u) => u.githubId === ghId);
            if (taken && guestId && taken.id !== guestId) {
              return { githubTaken: true as const, userId: guestId, created: false };
            }
            const up = upsertGitHubUser(
              s,
              {
                id: ghId,
                login: String((profile as { login?: string }).login ?? "desk"),
                name: (profile as { name?: string | null }).name,
                avatar_url: (profile as { avatar_url?: string | null }).avatar_url,
              },
              { guestId },
            );
            return { githubTaken: false as const, userId: up.user.id, created: up.created };
          });
          if (result.githubTaken) {
            token.githubTaken = true;
            return token;
          }
          token.sparkUserId = result.userId;
          token.authKind = "github";
        } catch (e) {
          console.error("auth.github.upsert failed", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { sparkUserId?: string }).sparkUserId = token.sparkUserId as string;
        (session.user as { id?: string }).id = token.sparkUserId as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.includes("github=taken")) return url.startsWith("http") ? url : `${baseUrl}${url}`;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
});
