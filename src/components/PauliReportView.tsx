"use client";

import { useEffect, useState } from "react";

interface PauliReportData {
  testee_ref: string;
  session_id: string;
  jenis_seleksi: string;
  waktu_mulai: string | null;
  waktu_selesai: string | null;
  skor_mentah: {
    jumlah_total: number;
    total_benar: number;
    total_salah: number;
    rasio_ketelitian: number;
    median_per_kolom: number;
    puncak: number;
    bawah: number;
    deviasi_konsistensi: number;
  } | null;
  klasifikasi_vs_norma_TNI: {
    jumlah_total?: { z: number; kategori: string };
    rasio_ketelitian?: { z: number; kategori: string };
    deviasi_konsistensi?: { z: number; kategori: string };
  } | null;
  grafik_per_kolom: {
    kolom: number;
    jumlah_dikerjakan: number;
    jumlah_salah: number;
  }[];
}

export default function PauliReportView({ attemptId }: { attemptId: string }) {
  const [data, setData] = useState<PauliReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/attempts/${attemptId}/pauli-result`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-gray-400">Memuat Laporan Tes Pauli...</p>
      </div>
    );
  }

  if (!data || !data.skor_mentah) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-2xl border border-gray-200">
        <p className="text-sm text-gray-500 font-medium">Belum ada data pengerjaan kolom Pauli.</p>
      </div>
    );
  }

  const { skor_mentah: raw, klasifikasi_vs_norma_TNI: norm, grafik_per_kolom: cols } = data;

  const maxColumnWork = Math.max(...cols.map((c) => c.jumlah_dikerjakan), 1);

  const getCategoryBadge = (kategori?: string) => {
    if (!kategori) return "bg-slate-100 text-slate-600 border-slate-200";
    if (kategori === "Tinggi") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (kategori === "Sedang") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <div className="space-y-6 w-full text-left font-sans">
      {/* Header Info */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-emerald-500/20">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Laporan Hasil Ujian Pauli
              </span>
              <span className="bg-white/10 text-slate-300 text-[10px] font-medium px-2.5 py-1 rounded-full">
                {data.jenis_seleksi || "Psikotes TNI"}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white mt-1">
              {data.testee_ref}
            </h2>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-300 bg-white/5 border border-white/10 p-3 rounded-2xl space-y-1">
            <p className="flex items-center sm:justify-end gap-1.5">
              <span className="text-slate-400">Mulai:</span>
              <span className="font-semibold text-white">
                {data.waktu_mulai ? new Date(data.waktu_mulai).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
              </span>
            </p>
            <p className="flex items-center sm:justify-end gap-1.5">
              <span className="text-slate-400">Selesai:</span>
              <span className="font-semibold text-white">
                {data.waktu_selesai ? new Date(data.waktu_selesai).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 1. Skor Mentah */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Ringkasan Skor Mentah
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-sm hover:border-slate-300 transition-colors">
            <p className="text-xs text-slate-500 font-semibold">Jumlah Total</p>
            <p className="text-2xl md:text-3xl font-black text-slate-900 mt-1">{raw.jumlah_total}</p>
            <span className="text-[10px] text-slate-400 font-medium">dikerjakan</span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-xs text-emerald-700 font-semibold">Total Benar</p>
            <p className="text-2xl md:text-3xl font-black text-emerald-600 mt-1">{raw.total_benar}</p>
            <span className="text-[10px] text-red-500 font-semibold">Salah: {raw.total_salah}</span>
          </div>

          <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-xs text-blue-700 font-semibold">Rasio Ketelitian</p>
            <p className="text-2xl md:text-3xl font-black text-blue-600 mt-1">
              {(raw.rasio_ketelitian * 100).toFixed(1)}%
            </p>
            <span className="text-[10px] text-blue-500 font-medium">akurasi jawaban</span>
          </div>

          <div className="bg-purple-50/50 border border-purple-200/80 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-xs text-purple-700 font-semibold">Konsistensi Deviasi</p>
            <p className="text-2xl md:text-3xl font-black text-purple-600 mt-1">{raw.deviasi_konsistensi}</p>
            <span className="text-[10px] text-purple-500 font-medium">fluktuasi per kolom</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 text-center">
            <p className="text-[11px] text-slate-500 font-medium">Median / Kolom</p>
            <p className="text-base md:text-lg font-bold text-slate-800 mt-0.5">{raw.median_per_kolom}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 text-center">
            <p className="text-[11px] text-slate-500 font-medium">Puncak (Max)</p>
            <p className="text-base md:text-lg font-bold text-emerald-600 mt-0.5">{raw.puncak}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 text-center">
            <p className="text-[11px] text-slate-500 font-medium">Bawah (Min)</p>
            <p className="text-base md:text-lg font-bold text-amber-600 mt-0.5">{raw.bawah}</p>
          </div>
        </div>
      </div>

      {/* 2. Klasifikasi Norma TNI */}
      {norm && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Klasifikasi Norma TNI
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Jumlah Total", data: norm.jumlah_total },
              { label: "Rasio Ketelitian", data: norm.rasio_ketelitian },
              { label: "Deviasi Konsistensi", data: norm.deviasi_konsistensi },
            ].map((item) => (
              <div
                key={item.label}
                className={`bg-white border rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all ${getCategoryBadge(
                  item.data?.kategori
                )}`}
              >
                <div>
                  <p className="text-xs font-semibold text-slate-600">{item.label}</p>
                  <p className="text-2xl font-black mt-1">
                    {item.data?.kategori || "—"}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Z-Score:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {item.data?.z !== undefined ? (item.data.z >= 0 ? `+${item.data.z.toFixed(2)}` : item.data.z.toFixed(2)) : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Grafik Perkembangan Per Kolom */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
          Grafik Perkembangan Kolom
        </h3>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm">
          <div className="h-56 flex items-end gap-2 sm:gap-3 pt-10 pb-2 overflow-x-auto min-h-[180px]">
            {cols.map((c) => {
              const heightPct = Math.max(12, Math.round((c.jumlah_dikerjakan / maxColumnWork) * 100));
              return (
                <div key={c.kolom} className="flex-1 min-w-[34px] flex flex-col items-center gap-1.5 group">
                  <span className="text-[11px] font-bold text-emerald-600 font-mono group-hover:scale-110 transition-transform">
                    {c.jumlah_dikerjakan}
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-xl relative flex flex-col justify-end h-36 border-b border-slate-200">
                    <div className="w-full relative rounded-t-xl overflow-hidden transition-all duration-300" style={{ height: `${heightPct}%` }}>
                      <div className="bg-emerald-500 group-hover:bg-emerald-600 w-full h-full transition-colors" />
                      {c.jumlah_salah > 0 && (
                        <div
                          className="bg-rose-500 w-full absolute top-0 left-0"
                          style={{ height: `${Math.min(100, (c.jumlah_salah / (c.jumlah_dikerjakan || 1)) * 100)}%` }}
                          title={`Salah: ${c.jumlah_salah}`}
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-bold group-hover:text-slate-900 transition-colors">K{c.kolom}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 font-semibold">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm" /> Jawaban Dikerjakan
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-rose-500 rounded-sm" /> Jawaban Salah
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
