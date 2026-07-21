"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const IconClipboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/></svg>
);

type ExamType = "SKD" | "PSIKOTEST" | "AKADEMIK" | "PSIKOTEST_TNI";

interface Attempt {
  id: string;
  examId: string;
  startedAt: string;
  finishedAt: string;
  twkScore: number;
  tiuScore: number;
  tkpScore: number;
  kecerdasanScore: number;
  kecermatanScore: number;
  kepribadianScore: number;
  pauliScore: number;
  akademikScore: number;
  totalScore: number;
  exam: {
    title: string;
    duration: number;
    examType: ExamType;
    skdCategory?: string | null;
    psikotestCategory?: string;
    psikotestConfig?: string;
    akademikCategory?: string;
  };
  answers: { selected: string | null }[];
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      fetch("/api/history")
        .then((r) => r.json())
        .then((data) => {
          setAttempts(Array.isArray(data) ? data : []);
          setLoading(false);
        });
    }
  }, [status, router]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const getScoreGrid = (attempt: Attempt) => {
    const type = attempt.exam.examType ?? "SKD";
    const isPauli = attempt.exam.psikotestCategory === "PAULI" || (type === "PSIKOTEST_TNI" && attempt.exam.psikotestCategory === "PAULI");

    if (isPauli) {
      const acc = attempt.pauliScore ?? attempt.totalScore;
      return [
        { label: "Rasio Ketelitian", score: `${acc}%`, max: "100%", isTotal: true },
      ];
    }

    const config = attempt.exam.psikotestConfig
      ? JSON.parse(attempt.exam.psikotestConfig) as Record<string, number>
      : {};

    if (type === "SKD") {
      const skdCat = attempt.exam.skdCategory;

      if (skdCat === "TWK") {
        return [
          { label: "TWK", score: attempt.twkScore, max: 150 },
          { label: "Total", score: attempt.totalScore, max: 150, isTotal: true },
        ];
      }
      if (skdCat === "TIU") {
        return [
          { label: "TIU", score: attempt.tiuScore, max: 175 },
          { label: "Total", score: attempt.totalScore, max: 175, isTotal: true },
        ];
      }
      if (skdCat === "TKP") {
        return [
          { label: "TKP", score: attempt.tkpScore, max: 225 },
          { label: "Total", score: attempt.totalScore, max: 225, isTotal: true },
        ];
      }
      // Gabungan
      return [
        { label: "TWK", score: attempt.twkScore, max: 150 },
        { label: "TIU", score: attempt.tiuScore, max: 175 },
        { label: "TKP", score: attempt.tkpScore, max: 225 },
        { label: "Total", score: attempt.totalScore, max: 550, isTotal: true },
      ];
    }

    if (type === "PSIKOTEST" || type === "PSIKOTEST_TNI") {
      const subs = Object.entries(config);
      if (subs.length > 1) {
        return [
          { label: "Kecerdasan", score: attempt.kecerdasanScore, max: 100 },
          { label: "Kecermatan", score: attempt.kecermatanScore, max: 80 },
          { label: "Kepribadian", score: attempt.kepribadianScore, max: 80 },
          { label: "Total", score: attempt.totalScore, max: 260, isTotal: true },
        ];
      }
      const cat = attempt.exam.psikotestCategory ?? "";
      const maxScore = cat === "KECERDASAN" ? 100 : 80;
      const scoreMap: Record<string, number> = {
        KECERDASAN: attempt.kecerdasanScore,
        KECERMATAN: attempt.kecermatanScore,
        KEPRIBADIAN: attempt.kepribadianScore,
      };
      return [
        { label: cat.replace(/_/g, " "), score: scoreMap[cat] ?? attempt.totalScore, max: maxScore },
        { label: "Total", score: attempt.totalScore, max: maxScore, isTotal: true },
      ];
    }

    // AKADEMIK
    return [
      { label: attempt.exam.akademikCategory?.replace(/_/g, " ") ?? "Skor", score: attempt.akademikScore, max: 100 },
      { label: "Total", score: attempt.totalScore, max: 100, isTotal: true },
    ];
  };

  const isPassed = (attempt: Attempt) => {
    if ((attempt.exam.examType ?? "SKD") !== "SKD") return null;
    const skdCat = attempt.exam.skdCategory;

    if (skdCat === "TWK") return attempt.twkScore >= 65;
    if (skdCat === "TIU") return attempt.tiuScore >= 80;
    if (skdCat === "TKP") return attempt.tkpScore >= 156;
    // Gabungan
    return attempt.twkScore >= 65 && attempt.tiuScore >= 80 && attempt.tkpScore >= 156;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Riwayat Ujian</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Daftar seluruh ujian yang telah kamu selesaikan</p>
        </div>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-4 py-2.5 rounded-xl transition-colors shrink-0 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Kembali ke Katalog</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-white border border-slate-200/80 rounded-3xl">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-medium">Memuat riwayat ujian...</p>
        </div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200/80 rounded-3xl p-6">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-base font-bold text-slate-800">Belum Ada Riwayat Ujian</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Kamu belum pernah mengerjakan ujian. Silakan pilih simulasi ujian dari katalog.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 mt-5 bg-blue-600 text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
          >
            <span>Buka Katalog Ujian</span>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {attempts.map((attempt) => {
            const answered = attempt.answers.filter((a) => a.selected).length;
            const total = attempt.answers.length;
            const passed = isPassed(attempt);
            const examType = attempt.exam.examType ?? "SKD";
            const scoreGrid = getScoreGrid(attempt);
            const isPauli = attempt.exam.psikotestCategory === "PAULI" || (examType === "PSIKOTEST_TNI" && attempt.exam.psikotestCategory === "PAULI");

            return (
              <div
                key={attempt.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm hover:border-slate-300 hover:shadow-md transition-all space-y-4"
              >
                {/* Header Card */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">{attempt.exam.title}</h2>

                      {/* Badge examType */}
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        examType === "SKD" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        examType === "PSIKOTEST" ? "bg-purple-50 text-purple-700 border-purple-200" :
                        examType === "PSIKOTEST_TNI" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {examType.replace(/_/g, " ")}
                        {examType === "SKD" && attempt.exam.skdCategory && ` · ${attempt.exam.skdCategory}`}
                        {(examType === "PSIKOTEST" || examType === "PSIKOTEST_TNI") && attempt.exam.psikotestCategory &&
                          ` · ${attempt.exam.psikotestCategory.split(/[\s_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}`}
                        {examType === "AKADEMIK" && attempt.exam.akademikCategory &&
                          ` · ${attempt.exam.akademikCategory.replace(/_/g, " ")}`}
                      </span>

                      {/* Passed badge */}
                      {passed !== null && (
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          passed ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-rose-100 text-rose-700 border border-rose-200"
                        }`}>
                          {passed ? "LULUS" : "BELUM LULUS"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{formatDate(attempt.finishedAt)}</p>
                  </div>

                  <div className="text-right shrink-0 bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-2xl">
                    {isPauli ? (
                      <>
                        <p className="text-xl sm:text-2xl font-black text-slate-900">{attempt.pauliScore ?? attempt.totalScore}%</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ketelitian</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xl sm:text-2xl font-black text-slate-900">{answered}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">dari {total} dijawab</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Score Grid */}
                <div className={`grid gap-2.5 ${scoreGrid.length === 4 ? "grid-cols-2 sm:grid-cols-4" : scoreGrid.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {scoreGrid.map((item) => {
                    const isFailedTotal = item.isTotal && passed === false;
                    return (
                      <div
                        key={item.label}
                        className={`rounded-2xl p-3 text-center transition-colors ${
                          item.isTotal
                            ? (isFailedTotal ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20" :
                              passed === true ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20" :
                              "bg-blue-600 text-white shadow-sm shadow-blue-500/20")
                            : "bg-slate-50 border border-slate-200/60"
                        }`}
                      >
                        <p className={`text-[11px] font-semibold mb-0.5 ${
                          item.isTotal ? "text-white/80" : "text-slate-500"
                        }`}>
                          {item.label}
                        </p>
                        <p className={`text-lg sm:text-xl font-extrabold ${
                          item.isTotal ? "text-white" : "text-slate-900"
                        }`}>
                          {item.score}
                        </p>
                        <p className={`text-[10px] font-medium ${
                          item.isTotal ? "text-white/70" : "text-slate-400"
                        }`}>
                          /{item.max}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Detail link */}
                <div className="border-t border-slate-100 pt-3 flex justify-end">
                  <Link
                    href={`/history/${attempt.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 group"
                  >
                    <span>Lihat Detail Jawaban & Pembahasan</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}