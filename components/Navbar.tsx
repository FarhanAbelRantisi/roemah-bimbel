"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/news", label: "News" },
  { href: "/catalog", label: "Test" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
    setMenuOpen(false);
  };

  const sessionUser = session?.user as { role?: string; isPremium?: boolean } | undefined;

  const handleAboutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === "/") {
      document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/");
      setTimeout(() => {
        document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <span className="bg-blue-600 text-white rounded-md px-2 py-1 text-sm">RB</span>
          Roemah Bimbel
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isAbout = link.href === "/about";
            return (
              <Link
                key={link.href}
                href={isAbout ? "/" : link.href}
                onClick={isAbout ? handleAboutClick : undefined}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Riwayat — hanya muncul jika login */}
          {session && (
            <Link
              href="/history"
              className={`text-sm font-medium transition-colors ${
                pathname === "/history"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Riwayat
            </Link>
          )}
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3">
          {status === "loading" ? (
            <div className="w-20 h-9 bg-gray-100 rounded-lg animate-pulse" />
          ) : session ? (
            <>
              <span className="text-sm text-gray-600">{session.user?.name}</span>
              {sessionUser?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="border border-blue-200 text-blue-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="border border-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile: Auth + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {status !== "loading" && !session && (
            <Link
              href="/login"
              className="bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 4L16 16M16 4L4 16" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5H17M3 10H17M3 15H17" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-1 shadow-lg">
          {/* Nav links */}
          {navLinks.map((link) => {
            const isAbout = link.href === "/about";
            return (
              <Link
                key={link.href}
                href={isAbout ? "/" : link.href}
                onClick={(e) => {
                  if (isAbout) handleAboutClick(e);
                  setMenuOpen(false);
                }}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Riwayat — tepat setelah Test, hanya jika login */}
          {session && (
            <Link
              href="/history"
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/history"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Riwayat
            </Link>
          )}

          <div className="border-t border-gray-100 my-2" />

          {status === "loading" ? (
            <div className="w-full h-9 bg-gray-100 rounded-lg animate-pulse" />
          ) : session ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                  {session.user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                  <p className="text-xs text-gray-400">{session.user?.email}</p>
                </div>
              </div>

              {sessionUser?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  🔧 Admin Panel
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Daftar Akun Baru
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}