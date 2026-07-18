import Navbar from "@/components/Navbar";
import SessionProvider from "@/components/SessionProvider";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}