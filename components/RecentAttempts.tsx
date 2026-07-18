"use client";
import { useState } from "react";

interface Attempt {
  id: string;
  totalScore: number;
  twkScore: number;
  tiuScore: number;
  tkpScore: number;
  finishedAt: string;
  user: { name: string; email: string };
  exam: { title: string };
}

export default function RecentAttempts({ attempts }: { attempts: Attempt[] }) {
  const [search, setSearch] = useState("");

  const filtered = attempts.filter(
    (a) =>
      a.user.name.toLowerCase().includes(search.toLowerCase()) ||
      a.user.email.toLowerCase().includes(search.toLowerCase()) ||
      a.exam.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header + Search */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-semibold text-gray-800 shrink-0">
          Aktivitas Ujian Terbaru
        </h2>
        <input
          type="text"
          placeholder="Cari nama / ujian..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">
          {search ? `Tidak ada hasil untuk "${search}"` : "Belum ada aktivitas ujian"}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((attempt) => {
          // Letakkan di sini — dihitung per attempt
          const passed =
            attempt.twkScore >= 65 &&
            attempt.tiuScore >= 80 &&
            attempt.tkpScore >= 156;

          return (
            <div
              key={attempt.id}
              className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Baris atas: avatar + nama + ujian + total skor */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                  {attempt.user.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {attempt.user.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{attempt.exam.title}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-lg font-bold ${passed ? "text-green-600" : "text-blue-600"}`}>
                    {attempt.totalScore}
                  </p>
                  <span className={`text-xs font-semibold ${passed ? "text-green-600" : "text-red-500"}`}>
                    {passed ? "✓ Lulus" : "✗ Belum"}
                  </span>
                </div>
              </div>

              {/* Baris bawah: skor per kategori */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "TWK", score: attempt.twkScore, max: 150, passing: 65, color: "bg-blue-50 text-blue-700" },
                  { label: "TIU", score: attempt.tiuScore, max: 175, passing: 80, color: "bg-purple-50 text-purple-700" },
                  { label: "TKP", score: attempt.tkpScore, max: 225, passing: 156, color: "bg-green-50 text-green-700" },
                ].map((cat) => {
                  const catPassed = cat.score >= cat.passing;
                  return (
                    <div
                      key={cat.label}
                      className={`rounded-lg px-3 py-1.5 flex items-center justify-between ${cat.color}`}
                    >
                      <span className="text-xs font-semibold">{cat.label}</span>
                      <div className="text-right">
                        <span className="text-xs font-bold">
                          {cat.score}
                          <span className="font-normal opacity-60">/{cat.max}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}