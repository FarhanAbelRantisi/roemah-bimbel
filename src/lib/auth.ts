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

        // 1. Cek apakah akun sedang terkunci
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("Akun Anda terkunci karena terlalu banyak percobaan salah. Coba lagi dalam 15 menit.");
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          // 2. Jika salah, tambahkan hitungan gagal
          const attempts = user.failedLoginAttempts + 1;
          const updates: any = { failedLoginAttempts: attempts };
          
          if (attempts >= 5) {
            // Kunci akun selama 15 menit
            const lockTime = new Date();
            lockTime.setMinutes(lockTime.getMinutes() + 15);
            updates.lockedUntil = lockTime;
          }
          
          await prisma.user.update({
            where: { id: user.id },
            data: updates,
          });
          
          if (attempts >= 5) {
            throw new Error("Akun dikunci karena salah password 5 kali. Coba lagi 15 menit.");
          }
          throw new Error(`Password salah. Sisa percobaan: ${5 - attempts}`);
        }

        // 3. Jika berhasil login, reset hitungan gagal
        if (user.failedLoginAttempts > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

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