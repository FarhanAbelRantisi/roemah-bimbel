"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validatePassword(form.password)) {
      setError("Password minimal 8 karakter, mengandung huruf besar, angka, dan simbol.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push("/login?registered=true");
  };

  const inputStyle = {
    width: "100%",
    border: "1.5px solid #e5e7eb",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "14px",
    lineHeight: "1.5",
    height: "48px",
    color: "#111827",
    background: "#f9fafb",
    boxSizing: "border-box" as const,
    outline: "none",
    WebkitAppearance: "none" as const,
    appearance: "none" as const,
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
      </div>

      <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1, paddingTop: "16px", paddingBottom: "16px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
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
            Buat Akun Baru
          </h2>
          <p style={{ fontSize: "13px", color: "#9ca3af", margin: "0 0 24px" }}>
            Daftar gratis dan mulai latihan ujian sekarang
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Nama */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
                Nama Lengkap
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama kamu"
                required
                style={inputStyle}
              />
            </div>

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
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
              Password
            </label>
            <div style={{ position: "relative"}}>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 8 karakter"
                required
                style={{
                  ...inputStyle,
                  paddingRight: "44px",
                  WebkitTextSecurity: showPassword ? "none" : "disc",
                } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "14px", padding: "4px" }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <p style={{ fontSize: "11px", color: "#9ca3af", margin: "5px 0 0" }}>
              Min. 8 karakter, huruf besar, angka & simbol (@$!%*?&)
            </p>
          </div>

            {/* Confirm Password */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
                Konfirmasi Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Ulangi password"
                  required
                  style={{
                    ...inputStyle,
                    paddingRight: "44px",
                    WebkitTextSecurity: showConfirm ? "none" : "disc",
                  } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "14px", padding: "4px" }}
                >
                  {showConfirm ? "🙈" : "👁️"}
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
              {loading ? "Memproses..." : "Buat Akun →"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "14px", color: "#9ca3af", marginTop: "20px", marginBottom: 0 }}>
            Sudah punya akun?{" "}
            <Link href="/login" style={{ color: "#2563eb", fontWeight: "600", textDecoration: "none" }}>
              Masuk sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}