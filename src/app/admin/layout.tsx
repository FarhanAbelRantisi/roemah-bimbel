"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";

const menuItems = [
  { href: "/admin", label: "Dashboard", icon: "▣" },
  { href: "/admin/exams", label: "Kelola Ujian", icon: "📋" },
  { href: "/admin/users", label: "Manajemen User", icon: "👥" },
  { href: "/admin/news", label: "News & CMS", icon: "📰" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- KEAMANAN LAPIS KEDUA (CLIENT SIDE) ---
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);
  // ------------------------------------------

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  // Jangan render tampilan admin sama sekali jika bukan admin
  if (status === "loading" || (status === "authenticated" && session?.user?.role !== "ADMIN")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-30
        transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-blue-600 text-white font-bold rounded-md px-2 py-1 text-sm">RB</span>
            <span className="font-bold text-gray-800">Roemah Bimbel</span>
          </Link>
          {/* Close button mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3L13 13M13 3L3 13" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <p className="text-xs text-gray-400 px-6 pt-2 pb-1">Admin Portal</p>

        {/* Menu */}
        <nav className="flex-1 px-4 py-2 flex flex-col gap-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-gray-200 flex flex-col gap-1">
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span>🏠</span>
            Kembali ke Website
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full text-left"
          >
            <span>🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">

        {/* Top bar mobile */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5H17M3 10H17M3 15H17" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white font-bold rounded-md px-2 py-1 text-xs">RB</span>
            <span className="font-bold text-gray-800 text-sm">Admin Portal</span>
          </div>
          <div className="w-10" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}