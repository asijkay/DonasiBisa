import "server-only";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, sessions, userRoles, users, verificationTokens } from "@/db/schema";
import { afterVerifiedLogin } from "./after-login";

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google({ allowDangerousEmailAccountLinking: false })],
  session: { strategy: "database" as const },
  pages: { signIn: "/login" },
  callbacks: {
    // Only Google accounts with a verified e-mail may sign in (needed for safe donor linking).
    async signIn({ account, profile }) {
      if (account?.provider === "google") return profile?.email_verified === true;
      return false;
    },
    async session({ session, user }) {
      const roles = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, user.id));
      session.user.id = user.id;
      session.user.roles = roles.map((r) => r.role);
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) await afterVerifiedLogin(user.id);
    },
  },
}));
