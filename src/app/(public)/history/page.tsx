"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const IconClipboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/></svg>
);

type ExamType = "SKD" | "PSIKOTEST" | "AKADEMIK";

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

    if (type === "PSIKOTEST") {
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
        { label: cat, score: scoreMap[cat] ?? attempt.totalScore, max: maxScore },
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
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Riwayat Ujian</h1>
          <p className="text-gray-500 text-sm mt-1">Semua ujian yang telah kamu selesaikan</p>
        </div>
        <Link href="/catalog" className="text-sm text-blue-500 font-medium hover:underline">
          ← Kembali ke Katalog
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <IconClipboard />
          <p className="text-lg font-medium">Belum ada riwayat ujian</p>
          <Link href="/catalog"
            className="inline-block mt-4 bg-blue-500 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-blue-600 transition-colors">
            Lihat Katalog
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

            return (
              <div key={attempt.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-sm transition-shadow">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-base font-bold text-gray-900">{attempt.exam.title}</h2>

                      {/* Badge examType */}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        examType === "SKD" ? "bg-blue-50 text-blue-500" :
                        examType === "PSIKOTEST" ? "bg-blue-50 text-blue-500" :
                        "bg-blue-50 text-blue-500"
                      }`}>
                        {examType}
                        {examType === "SKD" && attempt.exam.skdCategory &&
                          ` · ${attempt.exam.skdCategory}`}
                        {examType === "PSIKOTEST" && attempt.exam.psikotestCategory &&
                          ` · ${attempt.exam.psikotestCategory}`}
                        {examType === "AKADEMIK" && attempt.exam.akademikCategory &&
                          ` · ${attempt.exam.akademikCategory.replace(/_/g, " ")}`}
                      </span>

                      {/* Passed badge — hanya SKD */}
                      {passed !== null && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                        }`}>
                          {passed ? "Lulus" : "Belum Lulus"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{formatDate(attempt.finishedAt)}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-gray-900">{answered}</p>
                    <p className="text-xs text-gray-400">dari {total} dijawab</p>
                  </div>
                </div>

                {/* Score Grid */}
                <div className={`grid gap-3 ${scoreGrid.length === 4 ? "grid-cols-4" : "grid-cols-2"}`}>
                  {scoreGrid.map((item) => (
                    <div key={item.label} className={`rounded-xl p-3 text-center ${
                      item.isTotal
                        ? (passed === false ? "bg-red-500 text-white" :
                          passed === true ? "bg-green-500 text-white" :
                          "bg-blue-500 text-white")
                        : "bg-gray-50 border border-gray-100"
                    }`}>
                      <p className={`text-xs mb-0.5 ${item.isTotal ? "text-white/80" : "text-gray-500"}`}>
                        {item.label}
                      </p>
                      <p className={`text-lg font-bold ${item.isTotal ? "text-white" : "text-gray-900"}`}>
                        {item.score}
                      </p>
                      <p className={`text-xs ${item.isTotal ? "text-white/60" : "text-gray-400"}`}>
                        /{item.max}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Detail link */}
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <Link href={`/history/${attempt.id}`}
                    className="inline-flex items-center gap-2 text-sm text-blue-500 font-medium hover:underline">
                    Lihat Detail Jawaban →
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