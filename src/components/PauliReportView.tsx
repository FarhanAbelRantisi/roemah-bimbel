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
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
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

  const getCategoryColor = (kategori?: string) => {
    if (!kategori) return "bg-gray-100 text-gray-700";
    if (kategori === "Tinggi") return "bg-green-100 text-green-700 border-green-200";
    if (kategori === "Sedang") return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  };

  return (
    <div className="space-y-6 w-full text-left font-sans">
      {/* Header Info */}
      <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="bg-indigo-700 text-indigo-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Laporan Sesi Tes Pauli ({data.jenis_seleksi})
          </span>
          <h2 className="text-xl font-bold mt-2">{data.testee_ref}</h2>
          <p className="text-xs text-indigo-300 mt-1">Ref ID: {data.session_id}</p>
        </div>
        <div className="text-left sm:text-right text-xs text-indigo-200 space-y-1">
          <p>Mulai: {data.waktu_mulai ? new Date(data.waktu_mulai).toLocaleString("id-ID") : "—"}</p>
          <p>Selesai: {data.waktu_selesai ? new Date(data.waktu_selesai).toLocaleString("id-ID") : "—"}</p>
        </div>
      </div>

      {/* 1. Skor Mentah */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">
          1. Ringkasan Skor Mentah
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Jumlah Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{raw.jumlah_total}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">dikerjakan</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
            <p className="text-xs text-gray-500 font-medium font-semibold text-green-700">Total Benar</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{raw.total_benar}</p>
            <p className="text-[10px] text-red-500 mt-0.5">Salah: {raw.total_salah}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Rasio Ketelitian</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {(raw.rasio_ketelitian * 100).toFixed(1)}%
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">rasio benar</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Konsistensi Deviasi</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{raw.deviasi_konsistensi}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">fluktuasi antar kolom</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Median per Kolom</p>
            <p className="text-lg font-bold text-gray-800 mt-0.5">{raw.median_per_kolom}</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Puncak (Max)</p>
            <p className="text-lg font-bold text-green-600 mt-0.5">{raw.puncak}</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Bawah (Min)</p>
            <p className="text-lg font-bold text-orange-600 mt-0.5">{raw.bawah}</p>
          </div>
        </div>
      </div>

      {/* 2. Klasifikasi Norma TNI */}
      {norm && (
        <div>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">
            2. Klasifikasi vs Norma TNI
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Jumlah Total", data: norm.jumlah_total },
              { label: "Rasio Ketelitian", data: norm.rasio_ketelitian },
              { label: "Deviasi Konsistensi", data: norm.deviasi_konsistensi },
            ].map((item) => (
              <div
                key={item.label}
                className={`bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-between ${getCategoryColor(
                  item.data?.kategori
                )}`}
              >
                <div>
                  <p className="text-xs font-semibold text-gray-600">{item.label}</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">
                    {item.data?.kategori || "—"}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200/50 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Z-Score:</span>
                  <span className="font-mono font-bold text-gray-800">
                    {item.data?.z !== undefined ? item.data.z.toFixed(2) : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Grafik Perkembangan Per Kolom */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">
          3. Grafik Perkembangan Kolom
        </h3>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="h-48 flex items-end gap-2 sm:gap-3 pt-8 pb-2 overflow-x-auto min-h-[160px]">
            {cols.map((c) => {
              const heightPct = Math.max(10, Math.round((c.jumlah_dikerjakan / maxColumnWork) * 100));
              return (
                <div key={c.kolom} className="flex-1 min-w-[32px] flex flex-col items-center gap-1.5 group">
                  <span className="text-[11px] font-bold text-indigo-600 font-mono">
                    {c.jumlah_dikerjakan}
                  </span>
                  <div className="w-full bg-indigo-50 rounded-t-lg relative flex flex-col justify-end h-32 border-b border-indigo-200">
                    <div className="w-full relative rounded-t-lg overflow-hidden transition-all duration-300" style={{ height: `${heightPct}%` }}>
                      <div className="bg-indigo-600 w-full h-full" />
                      {c.jumlah_salah > 0 && (
                        <div
                          className="bg-red-500 w-full absolute top-0 left-0"
                          style={{ height: `${Math.min(100, (c.jumlah_salah / (c.jumlah_dikerjakan || 1)) * 100)}%` }}
                          title={`Salah: ${c.jumlah_salah}`}
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 font-semibold">K{c.kolom}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-indigo-600 rounded-sm" /> Dikerjakan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-red-500 rounded-sm" /> Salah
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
