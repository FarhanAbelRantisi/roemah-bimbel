"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type ExamType = "SKD" | "PSIKOTEST" | "AKADEMIK";

interface AttemptResult {
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
    examType: ExamType;
    skdCategory?: string | null;
    psikotestCategory?: string;
    psikotestConfig?: string;
    akademikCategory?: string;
  };
  answers: { selected: string | null; selected2?: string | null }[];
}

export default function ResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const attemptId = searchParams.get("attemptId");
  const [result, setResult] = useState<AttemptResult | null>(null);

  useEffect(() => {
    if (!attemptId) { router.push("/catalog"); return; }
    fetch(`/api/attempts/${attemptId}`)
      .then((r) => r.json())
      .then(setResult);
  }, [attemptId, router]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const answered = result.answers.filter((a) => a.selected || a.selected2).length;
  const total = result.answers.length;
  const examType = result.exam.examType ?? "SKD";

  // ===== SKD passing grade =====
  const passedTWK = result.twkScore >= 65;
  const passedTIU = result.tiuScore >= 80;
  const passedTKP = result.tkpScore >= 156;
  
  let skdPassed = passedTWK && passedTIU && passedTKP;
  if (result.exam.skdCategory === "TWK") skdPassed = passedTWK;
  else if (result.exam.skdCategory === "TIU") skdPassed = passedTIU;
  else if (result.exam.skdCategory === "TKP") skdPassed = passedTKP;

  // ===== Psikotest config =====
  const psikotestConfig = result.exam.psikotestConfig
    ? JSON.parse(result.exam.psikotestConfig) as Record<string, number>
    : {};

  const passed = examType === "SKD" ? skdPassed : true; // Psikotest & Akademik tidak ada passing grade

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 ${
            examType === "SKD" ? (passed ? "bg-green-100" : "bg-red-100") : "bg-blue-100"
          }`}>
            {examType === "SKD" ? (passed ? "🏆" : "📚") : examType === "PSIKOTEST" ? "🧠" : "🎓"}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Hasil Ujian</h1>
          <p className="text-gray-500 text-sm mt-1">{result.exam.title}</p>
          <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${
            examType === "SKD" ? "bg-blue-50 text-blue-600" :
            examType === "PSIKOTEST" ? "bg-purple-50 text-purple-600" :
            "bg-orange-50 text-orange-600"
          }`}>
            {examType}
            {examType === "SKD" && result.exam.skdCategory &&
              ` · ${result.exam.skdCategory}`}
            {examType === "PSIKOTEST" && result.exam.psikotestCategory &&
              ` · ${result.exam.psikotestCategory}`}
            {examType === "AKADEMIK" && result.exam.akademikCategory &&
              ` · ${result.exam.akademikCategory.replace(/_/g, " ")}`}
          </span>
        </div>

        {/* Total Score */}
        <div className={`rounded-2xl p-6 text-center mb-5 ${
          examType === "SKD" ? (passed ? "bg-green-600" : "bg-blue-600") :
          examType === "PSIKOTEST" ? "bg-purple-600" : "bg-orange-500"
        }`}>
          <p className="text-white/80 text-sm uppercase tracking-wide mb-1">Total Skor</p>
          <p className="text-white text-6xl font-bold">{result.totalScore}</p>
          {examType === "SKD" && (
            <p className="text-sm mt-2 font-semibold text-white/80">
              {passed ? "✅ Memenuhi Semua Passing Grade" : "❌ Belum Memenuhi Passing Grade"}
            </p>
          )}
        </div>

        {/* Rincian Skor */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Rincian Skor</h2>

          {/* SKD */}
          {examType === "SKD" && (
            <div className="flex flex-col gap-4">
              {[
                { label: "TWK", score: result.twkScore, max: 150, passing: 65, passed: passedTWK, color: "bg-blue-500" },
                { label: "TIU", score: result.tiuScore, max: 175, passing: 80, passed: passedTIU, color: "bg-purple-500" },
                { label: "TKP", score: result.tkpScore, max: 225, passing: 156, passed: passedTKP, color: "bg-green-500" },
              ]
                .filter(item => !result.exam.skdCategory || result.exam.skdCategory === item.label)
                .map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{item.label}</span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                        item.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}>
                        {item.passed ? "✓ Lulus" : `Min. ${item.passing}`}
                      </span>
                    </div>
                    <span className="text-gray-500">{item.score} / {item.max}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${item.passed ? item.color : "bg-red-400"}`}
                      style={{ width: `${Math.min((item.score / item.max) * 100, 100)}%` }} />
                  </div>
                  <div className="relative mt-1">
                    <div className="absolute top-0 w-0.5 h-2 bg-gray-400"
                      style={{ left: `${(item.passing / item.max) * 100}%` }} />
                    <p className="text-xs text-gray-400 mt-1">Passing grade: {item.passing}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Psikotest */}
          {examType === "PSIKOTEST" && (
            <div className="flex flex-col gap-4">
              {Object.keys(psikotestConfig).length > 0 ? (
                Object.entries(psikotestConfig).map(([sub]) => {
                  // Map subCategory ke field score yang benar
                  const scoreMap: Record<string, number> = {
                    KECERDASAN: result.kecerdasanScore,
                    KECERMATAN: result.kecermatanScore,
                    KEPRIBADIAN: result.kepribadianScore,
                  };
                  const maxScoreMap: Record<string, number> = {
                    KECERDASAN: 100,
                    KECERMATAN: 80,
                    KEPRIBADIAN: 80,
                  };
                  const score = scoreMap[sub] ?? 0;
                  const maxScore = maxScoreMap[sub] ?? 100;
                  const pct = Math.round((score / maxScore) * 100);

                  return (
                    <div key={sub}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{sub}</span>
                        <span className="text-gray-500">{score} / {maxScore}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="h-2.5 rounded-full bg-purple-500"
                          style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{pct}% dari nilai maksimal</p>
                    </div>
                  );
                })
              ) : (
                // Single kategori
                (() => {
                  const singleCat = result.exam.psikotestCategory ?? "";
                  const maxScoreMap: Record<string, number> = {
                    KECERDASAN: 100, KECERMATAN: 80, KEPRIBADIAN: 80,
                  };
                  const scoreMap: Record<string, number> = {
                    KECERDASAN: result.kecerdasanScore,
                    KECERMATAN: result.kecermatanScore,
                    KEPRIBADIAN: result.kepribadianScore,
                  };
                  const score = scoreMap[singleCat] ?? result.totalScore;
                  const maxScore = maxScoreMap[singleCat] ?? 100;
                  const pct = Math.round((score / maxScore) * 100);
                  return (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{singleCat}</span>
                        <span className="text-gray-500">{score} / {maxScore}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="h-2.5 rounded-full bg-purple-500"
                          style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{pct}% dari nilai maksimal</p>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* Akademik */}
          {examType === "AKADEMIK" && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">
                  {result.exam.akademikCategory?.replace(/_/g, " ")}
                </span>
                <span className="text-gray-500">{result.akademikScore} / 100</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="h-2.5 rounded-full bg-orange-500"
                  style={{ width: `${result.akademikScore}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {result.akademikScore}% dari nilai maksimal
              </p>
            </div>
          )}
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{answered}</p>
            <p className="text-xs text-gray-500 mt-0.5">Soal Dijawab</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{total - answered}</p>
            <p className="text-xs text-gray-500 mt-0.5">Soal Kosong</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Link href={`/history/${attemptId}`}
            className="w-full text-center bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors">
            📊 Lihat Detail Jawaban
          </Link>
          <div className="flex gap-3">
            <Link href="/catalog"
              className="flex-1 text-center border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors">
              Kembali ke Katalog
            </Link>
            <Link href="/"
              className="flex-1 text-center border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors">
              Ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}