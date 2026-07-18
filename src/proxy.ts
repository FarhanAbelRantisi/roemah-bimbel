import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  // Ambil role dari session token
  const role = (req.auth?.user as any)?.role;
  const pathname = req.nextUrl.pathname;

  // Proteksi rute yang diawali dengan /admin
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      // Jika belum login, tendang ke halaman login
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
    if (role !== "ADMIN") {
      // Jika sudah login tapi BUKAN ADMIN, tendang ke beranda
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  return NextResponse.next();
});

// Tentukan rute mana saja yang akan diawasi Middleware
export const config = {
  matcher: [
    // Lewati file statis agar performa tetap cepat
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};