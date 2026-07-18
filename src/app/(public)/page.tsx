"use client";

import ScrollAnimate from "@/components/ScrollAnimate";
import CountUp from "@/components/CountUp";
import Link from "next/link";
import Image from "next/image";
import ScrollLink from "@/components/ScrollLink";
import { useState } from "react";
const VERSION = 2;

// SVG Icon Components
const IconBuilding = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></svg>
);
const IconGradCap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></svg>
);
const IconBrain = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" /><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" /><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" /><path d="M17.599 6.5a3 3 0 0 0 .399-1.375" /><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" /><path d="M3.477 10.896a4 4 0 0 1 .585-.396" /><path d="M19.938 10.5a4 4 0 0 1 .585.396" /><path d="M6 18a4 4 0 0 1-1.967-.516" /><path d="M19.967 17.484A4 4 0 0 1 18 18" /></svg>
);
const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>
);
const IconClipboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>
);
const IconAward = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>
);
const IconZap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></svg>
);
const IconBarChart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>
);
const IconTarget = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
);
const IconSmartphone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
);
const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const IconBookOpen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></svg>
);
const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
);
const IconTrophy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
);
const IconMapPin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);
const IconPhone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);
const IconCamera = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
);
const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const IconMessageCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
);

// Data testimoni foto
const testiPhotos = Array.from({ length: 20 }, (_, i) =>
  `/images/testi_photo${i + 1}.jpeg?v=${VERSION}`
);
const testiChats = Array.from({ length: 5 }, (_, i) => `/images/testi_chat${i + 1}.jpeg`);

const stats = [
  { value: "2015", label: "Berdiri Sejak" },
  { value: "6", label: "Program Unggulan" },
  { value: "2", label: "Cabang di Kota Jambi" },
];

const programs = [
  {
    icon: <IconBuilding />,
    title: "SKD CPNS",
    desc: "Persiapan Seleksi Kompetensi Dasar CPNS dengan sistem CAT BKN. Latihan TWK, TIU, dan TKP secara terstruktur.",
    color: "bg-slate-50 border-slate-200/60",
    iconBg: "bg-blue-100 text-blue-500",
  },
  {
    icon: <IconGradCap />,
    title: "SKD Sekolah Kedinasan",
    desc: "Latihan intensif SKD untuk masuk sekolah kedinasan seperti STAN, IPDN, dan lainnya sesuai kisi-kisi terbaru.",
    color: "bg-slate-50 border-slate-200/60",
    iconBg: "bg-sky-100 text-sky-600",
  },
  {
    icon: <IconBrain />,
    title: "Psikotes & Akademik Polri",
    desc: "Bimbingan lengkap untuk seleksi Polri meliputi psikotes, akademik, dan latihan soal sesuai standar kepolisian.",
    color: "bg-slate-50 border-slate-200/60",
    iconBg: "bg-blue-100 text-blue-500",
  },
  {
    icon: <IconShield />,
    title: "Psikotes & Akademik TNI",
    desc: "Persiapan psikotes dan tes akademik untuk seleksi TNI dengan materi yang disesuaikan kebutuhan seleksi.",
    color: "bg-slate-50 border-slate-200/60",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: <IconClipboard />,
    title: "Psikotes Sekolah Kedinasan",
    desc: "Latihan psikotes khusus untuk seleksi sekolah kedinasan, mencakup tes kepribadian, logika, dan numerik.",
    color: "bg-slate-50 border-slate-200/60",
    iconBg: "bg-purple-100 text-purple-600",
  },
  {
    icon: <IconAward />,
    title: "Psikotes SIP POLRI",
    desc: "Program khusus persiapan psikotes untuk seleksi SIP Polri dengan simulasi dan pembahasan lengkap.",
    color: "bg-slate-50 border-slate-200/60",
    iconBg: "bg-amber-100 text-amber-600",
  },
];

const features = [
  {
    icon: <IconZap />,
    title: "Simulasi SKD Real-Time",
    desc: "Sistem ujian persis seperti CAT BKN — timer otomatis, navigasi soal, dan hasil instan.",
  },
  {
    icon: <IconBarChart />,
    title: "Analisis Skor Mendalam",
    desc: "Breakdown skor TWK, TIU, TKP lengkap dengan perbandingan passing grade nasional.",
  },
  {
    icon: <IconTarget />,
    title: "Bank Soal Terkurasi",
    desc: "Ribuan soal yang disusun oleh tentor berpengalaman sesuai kisi-kisi terbaru.",
  },
  {
    icon: <IconSmartphone />,
    title: "Akses Kapan Saja",
    desc: "Platform responsif — bisa diakses dari HP, tablet, maupun laptop tanpa install aplikasi.",
  },
];

export default function HomePage() {
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  return (
    <div className="overflow-x-hidden">

      {/* ===== HERO ===== */}
      <section className="relative bg-[#0a1628] text-white overflow-hidden -mt-16">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #2563eb 0%, transparent 40%)`,
          }}
        />
        <div className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-24 md:pt-40 md:pb-32">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-500/25 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-blue-300 text-sm font-medium">Platform Simulasi SKD Terpercaya</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Raih Impianmu{" "}
              <span className="text-blue-500">Bersama</span>{" "}
              Roemah Bimbel
            </h1>

            <p className="text-lg text-gray-300 mb-4 leading-relaxed max-w-2xl">
              Bimbingan terpercaya untuk persiapan tes Sekolah Kedinasan, CPNS, TNI & POLRI.  Berdiri sejak 2015, sudah ratusan siswa yang lulus dan membuktikan.
            </p>

            {/* Program tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {["SKD CPNS", "SKD Sekolah Kedinasan", "Psikotes & Akademik Polri", "Psikotes & Akademik TNI", "Psikotes Sekolah Kedinasan", "Psikotes SIP POLRI"].map((tag) => (
                <span key={tag} className="bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full border border-white/10">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/catalog"
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                Lihat Katalog Ujian →
              </Link>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors"
              >
                Daftar Bimbel
              </a>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-white/5">
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap justify-center gap-6">
            {stats.map((stat) => (
              <CountUp key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROGRAM ===== */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-blue-500 font-semibold text-sm uppercase tracking-widest mb-2">Program Kami</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Bimbingan Lengkap untuk Setiap Jalur
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Kami menyediakan program bimbingan offline khusus yang disesuaikan dengan
              kebutuhan seleksi masing-masing jalur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {programs.map((prog, i) => (
              <ScrollAnimate key={prog.title} delay={i * 0.1} direction="up">
                <div className={`border rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full ${prog.color}`}>
                  <div className={`w-12 h-12 ${prog.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                    {prog.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{prog.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{prog.desc}</p>
                </div>
              </ScrollAnimate>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KEUNGGULAN ===== */}
      <section id="about" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ScrollAnimate direction="right">

              {/* Kiri — Teks keunggulan */}
              <div>
                <p className="text-blue-500 font-semibold text-sm uppercase tracking-widest mb-2">
                  Mengapa Roemah Bimbel?
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Bimbingan oleh{" "}
                  <span className="text-blue-500 font-extrabold">Praktisi</span>{" "}
                  yang Berpengalaman
                </h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  Kami bukan sekadar bimbel biasa. Setiap pengajar di Roemah Bimbel
                  adalah praktisi aktif yang telah melalui proses seleksi ketat —
                  memastikan kamu belajar dari yang terbaik.
                </p>

                <div className="flex flex-col gap-5">
                  {[
                    {
                      icon: <IconUsers />,
                      title: "Pengajar Profesional & Berpengalaman",
                      desc: "Tentor kami adalah alumni dan praktisi aktif dari instansi pemerintah, TNI, dan Polri yang memahami betul standar seleksi.",
                    },
                    {
                      icon: <IconBookOpen />,
                      title: "Kurikulum Sesuai Kisi-Kisi Terbaru",
                      desc: "Materi selalu diperbarui mengikuti regulasi dan kisi-kisi terbaru dari BKN, Kemenpan-RB, dan instansi terkait.",
                    },
                    {
                      icon: <IconRefresh />,
                      title: "Bimbingan Intensif & Terstruktur",
                      desc: "Program belajar terstruktur dari dasar hingga mahir, dilengkapi evaluasi berkala dan sesi tanya jawab langsung.",
                    },
                    {
                      icon: <IconTrophy />,
                      title: "Terbukti Menghasilkan Lulusan",
                      desc: "Lebih dari 200 siswa telah lulus seleksi impian mereka sejak Roemah Bimbel berdiri pada tahun 2015.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md shadow-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-0.5">{item.title}</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollAnimate>

            {/* Kanan — 2 Video */}
            <ScrollAnimate direction="left" delay={0.2}>
              <div className="flex flex-col gap-4">
                <div className="relative rounded-2xl overflow-hidden bg-black shadow-xl">
                  <div className="relative w-full aspect-video">
                    <video
                      src="/videos/video1.mp4#t=0.1"
                      controls
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                      poster="/images/video1.jpeg"
                    >
                      Browser kamu tidak mendukung video.
                    </video>
                  </div>
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Kegiatan Belajar
                    </span>
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden bg-black shadow-xl">
                  <div className="relative w-full aspect-video">
                    <video
                      src="/videos/video2.mp4#t=0.1"
                      controls
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                      poster="/images/video2.jpeg"
                    >
                      Browser kamu tidak mendukung video.
                    </video>
                  </div>
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Kegiatan Belajar
                    </span>
                  </div>
                </div>
              </div>
            </ScrollAnimate>

          </div>
        </div>
      </section>

      {/* ===== FITUR SIMULASI ===== */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Preview ujian */}
            <ScrollAnimate direction="right">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
                <div className="bg-[#0f172a] px-4 py-3 flex items-center justify-between">
                  <span className="text-white text-sm font-medium">Roemah Bimbel — Simulasi SKD</span>
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-lg">FINISH EXAM</span>
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Question 42 of 110</p>
                  <h3 className="font-bold text-gray-900 mb-4">TIU — Analogi Verbal</h3>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-gray-800 text-sm">SURYA : TERIK = ... : ...</p>
                  </div>
                  {["Lampu : Pijar", "Bulan : Dingin", "Mawar : Harum", "Es : Beku"].map((opt, i) => (
                    <div
                      key={opt}
                      className={`flex items-center gap-3 p-3 rounded-xl mb-2 border text-sm ${i === 0
                        ? "border-blue-500 bg-blue-50 text-blue-600 font-medium"
                        : "border-gray-100 text-gray-600"
                        }`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
                        }`}>
                        {["A", "B", "C", "D"][i]}
                      </span>
                      {opt}
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50">
                  <span className="text-xs text-gray-400">TIME REMAINING</span>
                  <span className="text-2xl font-bold text-gray-900 tabular-nums">99:45</span>
                </div>
              </div>
            </ScrollAnimate>

            <ScrollAnimate direction="left" delay={0.2}>
              <div>
                <p className="text-blue-500 font-semibold text-sm uppercase tracking-widest mb-2">Platform Digital</p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Simulasi SKD{" "}
                  <span className="text-blue-500 font-extrabold">Real-Time</span>{" "}
                  Seperti CAT BKN
                </h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  Latihan TWK, TIU, dan TKP dengan sistem persis seperti ujian
                  CAT BKN sungguhan. Timer otomatis, navigasi 110 soal, dan
                  analisis skor langsung setelah ujian selesai.
                </p>

                <div className="grid grid-cols-1 gap-4">
                  {features.map((feat) => (
                    <div key={feat.title} className="flex gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md shadow-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                        {feat.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-0.5">{feat.title}</h4>
                        <p className="text-sm text-gray-500">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollAnimate>
          </div>
        </div>
      </section>

      {/* ===== CTA CATALOG ===== */}
      <section className="bg-[#1a365d] py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ScrollAnimate direction="up">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Siap Mulai Latihan Sekarang?
            </h2>
            <p className="text-blue-100 mb-8 text-lg">
              Bimbingan offline intensif, Akses soal SKD, simulasi ujian real-time, dan analisis
              skor mendalam.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/catalog"
                className="bg-white text-[#1a365d] font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors text-lg shadow-lg"
              >
                Lihat Katalog Ujian →
              </Link>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors"
              >
                Daftar Bimbel
              </a>
            </div>
          </ScrollAnimate>
        </div>
      </section>

      {/* ===== TESTIMONI FOTO ===== */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollAnimate direction="up">
            <div className="text-center mb-12">
              <p className="text-blue-500 font-semibold text-sm uppercase tracking-widest mb-2">Testimoni</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Mereka Sudah Membuktikan
              </h2>
              <p className="text-gray-500 mt-3">
                Ratusan siswa Roemah Bimbel yang telah berhasil lulus seleksi impian mereka.
              </p>
            </div>
          </ScrollAnimate>

          {/* Grid foto testimoni */}
          <ScrollAnimate direction="up" delay={0.2}>
            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 ${showAllPhotos ? 'mb-16 pb-8' : 'mb-6 pb-2'} md:mb-16 md:pb-12`}>
              {testiPhotos.map((src, i) => (
                <div
                  key={i}
                  className={`relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 shadow-md hover:shadow-xl transition-all duration-300 ${i % 2 !== 0 ? "md:translate-y-8" : ""} ${!showAllPhotos && i >= 4 ? 'hidden md:block' : ''}`}
                >
                  <Image
                    src={src}
                    alt={`Testimoni siswa ${i + 1}`}
                    fill
                    className="object-cover hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  />
                </div>
              ))}
            </div>

            {!showAllPhotos && (
              <div className="md:hidden flex justify-center mb-16 pb-4">
                <button 
                  onClick={() => setShowAllPhotos(true)}
                  className="bg-white border border-gray-200 text-gray-700 font-semibold text-sm px-6 py-2.5 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                >
                  Lihat Semua Foto
                </button>
              </div>
            )}
          </ScrollAnimate>

          {/* Chat testimoni */}
          <p className="text-center text-gray-500 text-sm font-medium mb-6 uppercase tracking-wide">
            Pesan & Ucapan dari Siswa
          </p>
          <ScrollAnimate direction="up" delay={0.3}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 pb-6">
              {testiChats.map((src, i) => (
                <div
                  key={i}
                  className={`relative w-full rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 ${i % 2 !== 0 ? "md:translate-y-6" : ""}`}
                >
                  <Image
                    src={src}
                    alt={`Chat testimoni ${i + 1}`}
                    width={400}
                    height={600}
                    className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </ScrollAnimate>
        </div>
      </section>

      {/* ===== KONTAK & LOKASI ===== */}
      <section className="bg-gray-50 py-20" id="contact">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollAnimate direction="up">
            <div className="text-center mb-12">
              <p className="text-blue-500 font-semibold text-sm uppercase tracking-widest mb-2">
                Hubungi Kami
              </p>
              <h2 className="text-3xl font-bold text-gray-900">
                Lokasi & Kontak
              </h2>
            </div>
          </ScrollAnimate>

          {/* GRID 3 KOLOM */}
          <div className="grid md:grid-cols-3 gap-6 items-stretch">

            {/* ===== KONTAK ===== */}
            <ScrollAnimate direction="right">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 h-full flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Roemah Bimbel
                </h3>

                <div className="flex flex-col gap-5 flex-1">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                      <IconMapPin />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Alamat</p>
                      <p className="text-gray-500 text-sm mt-0.5">
                        Jambi, Indonesia
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                      <IconPhone />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">WhatsApp 1</p>
                      <a
                        href="https://wa.me/6285366517750"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 text-sm mt-0.5 hover:underline"
                      >
                        +6285366517750
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                      <IconPhone />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">WhatsApp 2</p>
                      <a
                        href="https://wa.me/6285366517750"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 text-sm mt-0.5 hover:underline"
                      >
                        +6281368012510
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                      <IconCamera />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Instagram</p>
                      <a
                        href="https://instagram.com/bimbel_polri_kedinasan_cpns"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 text-sm mt-0.5 hover:underline"
                      >
                        @bimbel_polri_kedinasan_cpns
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                      <IconClock />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Jam Operasional
                      </p>
                      <p className="text-gray-500 text-sm mt-0.5">
                        Senin – Sabtu: 08.00 – 17.00 WIB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <a
                    href="https://wa.me/6285366517750"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-[#25D366]/20"
                  >
                    <span className="inline-flex items-center gap-2"><IconMessageCircle /> Chat via WhatsApp</span>
                  </a>
                </div>
              </div>
            </ScrollAnimate>

            {/* ===== MAP 1 ===== */}
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm min-h-80">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.1718395461726!2d103.63692227607896!3d-1.6460928983386185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e2585667eb7bd05%3A0x27a37b753f513463!2sRoemah%20Bimbel!5e0!3m2!1sid!2sid!4v1775893346941!5m2!1sid!2sid"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>

            {/* ===== MAP 2 ===== */}
            <ScrollAnimate direction="left" delay={0.2}>
              <div className="h-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.2162179250295!2d103.56008537607897!3d-1.6237558983611482!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e25890075d939b9%3A0xdebdf41bef6a14d7!2sRoemah%20Bimbel%202!5e0!3m2!1sid!2sid!4v1775894636338!5m2!1sid!2sid"
                  className="w-full h-full min-h-[320px]"
                  loading="lazy"
                />
              </div>
            </ScrollAnimate>

          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#0a1628] text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-blue-500 font-bold rounded-md px-2 py-1 text-sm">RB</span>
                <span className="font-bold text-lg">Roemah Bimbel</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Platform bimbingan dan simulasi ujian terpercaya untuk SKD,
                Polri, Kedinasan, dan TNI sejak 2015.
              </p>
            </div>

            <div id="fixed-nav">
              <p className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-300">
                Navigasi
              </p>

              <div className="flex flex-col gap-2">
                {[
                  { href: "/", label: "Home" },
                  { href: "about", label: "About Us", isScroll: true },
                  { href: "/catalog", label: "Katalog Ujian" },
                  { href: "/news", label: "Berita" },
                ].map((link) =>
                  link.isScroll ? (
                    <ScrollLink
                      key={link.label}
                      targetId={link.href}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </ScrollLink>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  )
                )}
              </div>
            </div>

            <div>
              <p className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-300">Program</p>
              <div className="flex flex-col gap-2 text-gray-400 text-sm">
                <span>SKD CPNS</span>
                <span>SKD Sekolah Kedinasan</span>
                <span>Psikotes & Akademik Polri</span>
                <span>Psikotes & Akademik TNI</span>
                <span>Psikotes Sekolah Kedinasan</span>
                <span>Psikotes SIP POLRI</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-gray-500 text-sm">© 2026 Roemah Bimbel. All rights reserved.</p>
            <div className="flex gap-4 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="#contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}