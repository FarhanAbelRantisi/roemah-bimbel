import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Tambahkan "as string" dan "as boolean" di sini
        token.id = user.id as string;
        token.role = user.role as string;
        token.isPremium = user.isPremium as boolean;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        // Berkat next-auth.d.ts, kode di bawah ini jadi sangat rapi
        // tanpa perlu deklarasi (session.user as Session["user"] & ...) lagi!
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isPremium = token.isPremium;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isPremium: user.isPremium,
        };
      },
    }),
  ],
});