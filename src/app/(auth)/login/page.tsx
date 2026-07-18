"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Email atau password salah");
      return;
    }

    const session = await fetch("/api/auth/session").then((r) => r.json());
    if (session?.user?.role === "ADMIN") {
      router.push("/admin");
    } else {
      router.push("/");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #fef3f2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      {/* Dekorasi background */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(59,130,246,0.08)" }} />
        <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "250px", height: "250px", borderRadius: "50%", background: "rgba(239,68,68,0.06)" }} />
        <div style={{ position: "absolute", top: "40%", left: "5%", width: "150px", height: "150px", borderRadius: "50%", background: "rgba(59,130,246,0.05)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#111827", margin: 0 }}>
            Roemah Bimbel
          </h1>
        </div>

        {/* Card */}
        <div style={{
          background: "white",
          borderRadius: "20px",
          border: "1px solid #e5e7eb",
          padding: "32px 28px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: "0 0 4px" }}>
            Masuk ke Akun
          </h2>
          <p style={{ fontSize: "13px", color: "#9ca3af", margin: "0 0 24px" }}>
            Masukkan kredensial kamu untuk melanjutkan
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@contoh.com"
                required
                style={{
                  width: "100%",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "12px 44px 12px 14px",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  height: "48px",
                  color: "#111827",
                  background: "#f9fafb",
                  boxSizing: "border-box" as const,
                  outline: "none",
                  WebkitAppearance: "none" as const,
                  appearance: "none" as const,
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    width: "100%",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "12px 44px 12px 14px",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    height: "48px",
                    color: "#111827",
                    background: "#f9fafb",
                    boxSizing: "border-box" as const,
                    outline: "none",
                    WebkitAppearance: "none" as const,
                    appearance: "none" as const,
                    // Sembunyikan karakter saat showPassword = false
                    WebkitTextSecurity: showPassword ? "none" : "disc",
                  } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "16px",
                    padding: "4px",
                    lineHeight: 1,
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px" }}>
                <p style={{ fontSize: "13px", color: "#dc2626", margin: 0 }}>⚠️ {error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#93c5fd" : "#2563eb",
                color: "white",
                fontWeight: "600",
                fontSize: "15px",
                padding: "13px",
                borderRadius: "10px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "4px",
                WebkitAppearance: "none",
              }}
            >
              {loading ? "Memproses..." : "Masuk →"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "14px", color: "#9ca3af", marginTop: "20px", marginBottom: 0 }}>
            Belum punya akun?{" "}
            <Link href="/register" style={{ color: "#2563eb", fontWeight: "600", textDecoration: "none" }}>
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}