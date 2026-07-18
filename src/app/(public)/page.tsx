"use client";

import ScrollAnimate from "@/components/ScrollAnimate";
import CountUp from "@/components/CountUp";
import Link from "next/link";
import Image from "next/image";
import ScrollLink from "@/components/ScrollLink";
const VERSION = 2;

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
    icon: "🏛️",
    title: "SKD CPNS",
    desc: "Persiapan Seleksi Kompetensi Dasar CPNS dengan sistem CAT BKN. Latihan TWK, TIU, dan TKP secara terstruktur.",
    color: "bg-blue-50 border-blue-100",
    iconBg: "bg-blue-100",
  },
  {
    icon: "🎓",
    title: "SKD Sekolah Kedinasan",
    desc: "Latihan intensif SKD untuk masuk sekolah kedinasan seperti STAN, IPDN, dan lainnya sesuai kisi-kisi terbaru.",
    color: "bg-sky-50 border-sky-100",
    iconBg: "bg-sky-100",
  },
  {
    icon: "🧠",
    title: "Psikotes & Akademik Polri",
    desc: "Bimbingan lengkap untuk seleksi Polri meliputi psikotes, akademik, dan latihan soal sesuai standar kepolisian.",
    color: "bg-indigo-50 border-indigo-100",
    iconBg: "bg-indigo-100",
  },
  {
    icon: "🪖",
    title: "Psikotes & Akademik TNI",
    desc: "Persiapan psikotes dan tes akademik untuk seleksi TNI dengan materi yang disesuaikan kebutuhan seleksi.",
    color: "bg-green-50 border-green-100",
    iconBg: "bg-green-100",
  },
  {
    icon: "📋",
    title: "Psikotes Sekolah Kedinasan",
    desc: "Latihan psikotes khusus untuk seleksi sekolah kedinasan, mencakup tes kepribadian, logika, dan numerik.",
    color: "bg-purple-50 border-purple-100",
    iconBg: "bg-purple-100",
  },
  {
    icon: "⭐",
    title: "Psikotes SIP POLRI",
    desc: "Program khusus persiapan psikotes untuk seleksi SIP Polri dengan simulasi dan pembahasan lengkap.",
    color: "bg-yellow-50 border-yellow-100",
    iconBg: "bg-yellow-100",
  },
];

const features = [
  {
    icon: "⚡",
    title: "Simulasi SKD Real-Time",
    desc: "Sistem ujian persis seperti CAT BKN — timer otomatis, navigasi soal, dan hasil instan.",
  },
  {
    icon: "📊",
    title: "Analisis Skor Mendalam",
    desc: "Breakdown skor TWK, TIU, TKP lengkap dengan perbandingan passing grade nasional.",
  },
  {
    icon: "🎯",
    title: "Bank Soal Terkurasi",
    desc: "Ribuan soal yang disusun oleh tentor berpengalaman sesuai kisi-kisi terbaru.",
  },
  {
    icon: "📱",
    title: "Akses Kapan Saja",
    desc: "Platform responsif — bisa diakses dari HP, tablet, maupun laptop tanpa install aplikasi.",
  },
];

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ===== HERO ===== */}
      <section className="relative bg-[#0a1628] text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #2563eb 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #1d4ed8 0%, transparent 40%)`,
          }}
        />
        <div className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-blue-300 text-sm font-medium">Platform Simulasi SKD Terpercaya</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Raih Impianmu{" "}
              <span className="text-blue-400">Bersama</span>{" "}
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
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors"
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
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2">Program Kami</p>
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
                <div className={`border rounded-2xl p-6 hover:shadow-lg transition-shadow h-full ${prog.color}`}>
                  <div className={`w-12 h-12 ${prog.iconBg} rounded-xl flex items-center justify-center text-2xl mb-4`}>
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
        <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2">
          Mengapa Roemah Bimbel?
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Bimbingan oleh{" "}
          <span className="text-blue-600">Praktisi</span>{" "}
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
              icon: "🎓",
              title: "Pengajar Profesional & Berpengalaman",
              desc: "Tentor kami adalah alumni dan praktisi aktif dari instansi pemerintah, TNI, dan Polri yang memahami betul standar seleksi.",
            },
            {
              icon: "📋",
              title: "Kurikulum Sesuai Kisi-Kisi Terbaru",
              desc: "Materi selalu diperbarui mengikuti regulasi dan kisi-kisi terbaru dari BKN, Kemenpan-RB, dan instansi terkait.",
            },
            {
              icon: "🔁",
              title: "Bimbingan Intensif & Terstruktur",
              desc: "Program belajar terstruktur dari dasar hingga mahir, dilengkapi evaluasi berkala dan sesi tanya jawab langsung.",
            },
            {
              icon: "🏆",
              title: "Terbukti Menghasilkan Lulusan",
              desc: "Lebih dari 200 siswa telah lulus seleksi impian mereka sejak Roemah Bimbel berdiri pada tahun 2015.",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-4">
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center text-xl shrink-0">
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
                src="/videos/video1.mp4"
                controls
                playsInline
                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                poster="/images/video1_thumb.jpg"
              >
                Browser kamu tidak mendukung video.
              </video>
            </div>
            <div className="absolute top-3 left-3 z-10">
              <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Kegiatan Belajar
              </span>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-black shadow-xl">
            <div className="relative w-full aspect-video">
              <video
                src="/videos/video2.mp4"
                controls
                playsInline
                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                poster="/images/video2_thumb.jpg"
              >
                Browser kamu tidak mendukung video.
              </video>
            </div>
            <div className="absolute top-3 left-3 z-10">
              <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
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
                <div className="bg-[#0a1628] px-4 py-3 flex items-center justify-between">
                  <span className="text-white text-sm font-medium">Roemah Bimbel — Simulasi SKD</span>
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-lg">FINISH EXAM</span>
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Question 42 of 110</p>
                  <h3 className="font-bold text-gray-900 mb-4">TIU — Analogi Verbal</h3>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-gray-800 text-sm">SURYA : TERIK = ... : ...</p>
                  </div>
                  {["Lampu : Pijar", "Bulan : Dingin", "Mawar : Harum", "Es : Beku"].map((opt, i) => (
                    <div
                      key={opt}
                      className={`flex items-center gap-3 p-3 rounded-xl mb-2 border text-sm ${
                        i === 0
                          ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                          : "border-gray-100 text-gray-600"
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        i === 0 ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
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
                <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2">Platform Digital</p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Simulasi SKD{" "}
                  <span className="text-blue-600">Real-Time</span>{" "}
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
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl shrink-0">
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
      <section className="bg-blue-600 py-16">
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
                className="bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg"
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
              <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2">Testimoni</p>
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
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 mb-10">
              {testiPhotos.map((src, i) => (
                <div key={i} className="break-inside-avoid mb-3">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={src}
                      alt={`Testimoni siswa ${i + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollAnimate>

          {/* Chat testimoni */}
          <p className="text-center text-gray-500 text-sm font-medium mb-6 uppercase tracking-wide">
            Pesan & Ucapan dari Siswa
          </p>
          <ScrollAnimate direction="up" delay={0.3}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {testiChats.map((src, i) => (
                <div key={i} className="relative w-full rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
                  <Image
                    src={src}
                    alt={`Chat testimoni ${i + 1}`}
                    width={400}
                    height={600}
                    className="w-full h-auto object-cover"
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
              <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2">
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
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">
                      📍
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Alamat</p>
                      <p className="text-gray-500 text-sm mt-0.5">
                        Jambi, Indonesia
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">
                      📱
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">WhatsApp 1</p>
                      <a
                        href="https://wa.me/6285366517750"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm mt-0.5 hover:underline"
                      >
                        +6285366517750
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">
                      📱
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">WhatsApp 2</p>
                      <a
                        href="https://wa.me/6285366517750"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm mt-0.5 hover:underline"
                      >
                        +6281368012510
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">
                      📸
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Instagram</p>
                      <a
                        href="https://instagram.com/bimbel_polri_kedinasan_cpns"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm mt-0.5 hover:underline"
                      >
                        @bimbel_polri_kedinasan_cpns
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">
                      🕐
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
                    className="block w-full text-center bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    💬 Chat via WhatsApp
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
                <span className="bg-blue-600 font-bold rounded-md px-2 py-1 text-sm">RB</span>
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