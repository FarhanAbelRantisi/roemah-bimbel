"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PauliReportView from "@/components/PauliReportView";

type ExamType = "SKD" | "PSIKOTEST" | "AKADEMIK" | "PSIKOTEST_TNI";

// 1. UPDATE INTERFACE AGAR MENERIMA SEMUA SKOR
interface Attempt {
  id: string;
  totalScore: number;
  twkScore: number;
  tiuScore: number;
  tkpScore: number;
  kecerdasanScore: number;
  kecermatanScore: number;
  kepribadianScore: number;
  akademikScore: number;
  finishedAt: string;
  user: { name: string; email: string };
  exam: {
    title: string;
    examType: ExamType;
    psikotestCategory?: string | null;
    akademikCategory?: string | null;
    skdCategory?: string | null;
  };
}

interface ExamGroup {
  examTitle: string;
  attempts: Attempt[];
}

// Helper untuk cek kelulusan (Hanya SKD yang punya passing grade)
const checkIsPassed = (a: Attempt) => {
  if (a.exam.examType === "SKD") {
    if (a.exam.skdCategory === "TWK") return a.twkScore >= 65;
    if (a.exam.skdCategory === "TIU") return a.tiuScore >= 80;
    if (a.exam.skdCategory === "TKP") return a.tkpScore >= 156;

    // Jika tidak ada skdCategory spesifik (gabungan)
    return a.twkScore >= 65 && a.tiuScore >= 80 && a.tkpScore >= 156;
  }
  return true; // Psikotest & Akademik dianggap lulus/selesai
};

function groupByExam(attempts: Attempt[]): ExamGroup[] {
  const map = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const key = a.exam.title;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return Array.from(map.entries()).map(([examTitle, attempts]) => ({
    examTitle,
    // Urutkan berdasarkan totalScore DESC, lalu bandingkan nilai kategori jika skor sama
    attempts: [...attempts].sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime();
    }),
  }));
}

const IconExamList = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;

export default function RecentAttempts({ attempts }: { attempts: Attempt[] }) {
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportingExam, setExportingExam] = useState<string | null>(null);
  const [viewPauliId, setViewPauliId] = useState<string | null>(null);
  const router = useRouter();

  const examGroups = groupByExam(attempts);
  const selectedGroup = examGroups.find((g) => g.examTitle === selectedExam);

  // Deteksi tipe ujian dari group yang dipilih
  const isSkdGroup = selectedGroup?.attempts[0]?.exam.examType === "SKD";

  const filteredAttempts = selectedGroup
    ? selectedGroup.attempts.filter(
        (a) =>
          a.user.name.toLowerCase().includes(search.toLowerCase()) ||
          a.user.email.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus attempt ini?")) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/attempts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Gagal menghapus data");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async (examTitle: string) => {
    try {
      setExportingExam(examTitle);
      const res = await fetch(
        `/api/attempts/export?exam=${encodeURIComponent(examTitle)}`
      );
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hasil-ujian-${examTitle.replace(/\s+/g, "-")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Gagal mengekspor data");
    } finally {
      setExportingExam(null);
    }
  };

  // ── Exam List View ──────────────────────────────────────────────────────────
  if (!selectedExam) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Aktivitas Ujian Terbaru
        </h2>

        {examGroups.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">
            Belum ada aktivitas ujian
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {examGroups.map((group) => {
              const groupType = group.attempts[0]?.exam.examType;
              const passCount = group.attempts.filter(checkIsPassed).length;
              const avgScore =
                group.attempts.length > 0
                  ? Math.round(
                      group.attempts.reduce((s, a) => s + a.totalScore, 0) /
                        group.attempts.length
                    )
                  : 0;

              return (
                <button
                  key={group.examTitle}
                  onClick={() => {
                    setSelectedExam(group.examTitle);
                    setSearch("");
                  }}
                  className="w-full text-left border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                      <IconExamList />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 truncate">
                        {group.examTitle}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {group.attempts.length} peserta ·{" "}
                        <span className="text-green-600 font-medium">
                          {groupType === "SKD" ? `${passCount} lulus` : "Selesai"}
                        </span>
                        {" · "}
                        <span>Avg {avgScore}</span>
                      </p>
                    </div>

                    <span className="text-gray-300 group-hover:text-blue-400 text-lg">
                      →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Attempt Detail View ─────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => {
            setSelectedExam(null);
            setSearch("");
          }}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          ← Kembali
        </button>
        <span className="text-gray-300">|</span>
        <h2 className="text-base font-semibold text-gray-800 truncate flex-1">
          {selectedExam}
        </h2>
      </div>

      {/* Search + Export */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Cari nama / email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => handleExport(selectedExam)}
          disabled={exportingExam === selectedExam}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          {exportingExam === selectedExam ? (
            <span>Mengekspor...</span>
          ) : (
            <>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              <span>Export Excel</span>
            </>
          )}
        </button>
      </div>

      {/* Stats bar */}
      {selectedGroup && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            {
              label: "Peserta",
              value: selectedGroup.attempts.length,
              color: "bg-blue-50 text-blue-700",
            },
            {
              label: isSkdGroup ? "Lulus" : "Selesai",
              value: selectedGroup.attempts.filter(checkIsPassed).length,
              color: "bg-green-50 text-green-700",
            },
            {
              label: "Avg Skor",
              value:
                selectedGroup.attempts.length > 0
                  ? Math.round(
                      selectedGroup.attempts.reduce(
                        (s, a) => s + a.totalScore,
                        0
                      ) / selectedGroup.attempts.length
                    )
                  : 0,
              color: "bg-yellow-50 text-yellow-700",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-lg px-3 py-2 text-center ${s.color}`}
            >
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs font-medium opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Attempt list */}
      {filteredAttempts.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">
          {search
            ? `Tidak ada hasil untuk "${search}"`
            : "Belum ada attempt pada ujian ini"}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredAttempts.map((attempt) => {
            const originalRank = selectedGroup!.attempts.findIndex((a) => a.id === attempt.id) + 1;
            const passed = checkIsPassed(attempt);
            const examType = attempt.exam.examType;

            return (
              <div
                key={attempt.id}
                className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Top row */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Rank badge */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      originalRank === 1
                        ? "bg-yellow-100 text-yellow-700"
                        : originalRank === 2
                        ? "bg-gray-100 text-gray-600"
                        : originalRank === 3
                        ? "bg-orange-100 text-orange-600"
                        : "bg-blue-50 text-blue-500"
                    }`}
                  >
                    #{originalRank}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {attempt.user.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {attempt.user.email}
                    </p>
                  </div>

                  {/* Score + Delete */}
                  <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                    {/* Score pill */}
                    <div
                      className={`flex flex-col items-center justify-center rounded-xl px-3.5 py-1.5 min-w-[60px] ${
                        passed ? "bg-green-50" : "bg-blue-50"
                      }`}
                    >
                      <p
                        className={`text-xl font-semibold leading-tight ${
                          passed ? "text-green-700" : "text-blue-700"
                        }`}
                      >
                        {attempt.totalScore}
                      </p>
                      <span
                        className={`text-[10px] font-medium mt-0.5 ${
                          passed ? "text-green-700" : "text-blue-700"
                        }`}
                      >
                        {examType === "SKD" ? (passed ? "✓ Lulus" : "✗ Belum") : "✓ Selesai"}
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(attempt.id)}
                      disabled={deletingId === attempt.id}
                      title="Hapus attempt"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-40 transition-colors"
                    >
                      {deletingId === attempt.id ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 4h12M5 4V2.5h6V4M6 7v5M10 7v5M3 4l1 9.5h8L13 4"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* --- RENDER SCORE CATEGORY BERDASARKAN TIPE UJIAN --- */}
                
                {/* 1. SKD Scores */}
                {examType === "SKD" && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "TWK", score: attempt.twkScore, max: 150, passing: 65, color: "bg-blue-50 text-blue-700" },
                      { label: "TIU", score: attempt.tiuScore, max: 175, passing: 80, color: "bg-purple-50 text-purple-700" },
                      { label: "TKP", score: attempt.tkpScore, max: 225, passing: 156, color: "bg-green-50 text-green-700" },
                    ].map((cat) => (
                      <div key={cat.label} className={`rounded-lg px-3 py-1.5 flex items-center justify-between ${cat.color}`}>
                        <span className="text-xs font-semibold">{cat.label}</span>
                        <div className="text-right">
                          <span className={`text-xs font-bold ${cat.score < cat.passing ? "text-red-500" : ""}`}>
                            {cat.score}
                            <span className="font-normal opacity-60">/{cat.max}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Psikotest Scores */}
                {examType === "PSIKOTEST" && (() => {
                  const isGabungan = !attempt.exam.psikotestCategory || attempt.exam.psikotestCategory === "GABUNGAN";
                  const metrics = isGabungan ? [
                    { label: "Kecerdasan", score: attempt.kecerdasanScore, max: 100 },
                    { label: "Kecermatan", score: attempt.kecermatanScore, max: 80 },
                    { label: "Kepribadian", score: attempt.kepribadianScore, max: 80 }
                  ] : [
                    { 
                      label: attempt.exam.psikotestCategory, 
                      score: attempt.exam.psikotestCategory === "KECERDASAN" ? attempt.kecerdasanScore : 
                             attempt.exam.psikotestCategory === "KECERMATAN" ? attempt.kecermatanScore : attempt.kepribadianScore, 
                      max: attempt.exam.psikotestCategory === "KECERDASAN" ? 100 : 80 
                    }
                  ];

                  return (
                    <div className={`grid gap-2 ${isGabungan ? 'grid-cols-3' : 'grid-cols-1'}`}>
                      {metrics.map(cat => (
                        <div key={cat.label} className="rounded-lg px-3 py-1.5 flex items-center justify-between bg-purple-50 text-purple-700">
                          <span className="text-xs font-semibold">{cat.label}</span>
                          <div className="text-right">
                            <span className="text-xs font-bold">
                              {cat.score} <span className="font-normal opacity-60">/{cat.max}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* 3. Akademik Scores */}
                {examType === "AKADEMIK" && (
                  <div className="grid grid-cols-1 gap-2">
                    <div className="rounded-lg px-3 py-1.5 flex items-center justify-between bg-orange-50 text-orange-700">
                      <span className="text-xs font-semibold">
                        {attempt.exam.akademikCategory?.replace(/_/g, " ") || "Akademik"}
                      </span>
                      <div className="text-right">
                        <span className="text-xs font-bold">
                          {attempt.akademikScore} <span className="font-normal opacity-60">/100</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Finished at & Pauli Detail Button */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                  {attempt.exam.psikotestCategory === "PAULI" || attempt.exam.examType === "PSIKOTEST_TNI" ? (
                    <button
                      onClick={() => setViewPauliId(attempt.id)}
                      className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                      <span>Lihat Laporan Pauli Lengkap</span>
                    </button>
                  ) : (
                    <span />
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(attempt.finishedAt).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Pauli Report */}
      {viewPauliId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setViewPauliId(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold text-sm z-10"
            >
              ✕
            </button>
            <PauliReportView attemptId={viewPauliId} />
          </div>
        </div>
      )}
    </div>
  );
}