"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import PauliReportView from "@/components/PauliReportView";

const IconTrophy = () => (<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>);
const IconFileText = ({ className = "w-9 h-9 text-blue-500" }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>);
const IconCheckCircle = ({ className = "w-4 h-4 inline-block mr-1.5 -mt-0.5" }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);
const IconXCircle = ({ className = "w-4 h-4 inline-block mr-1.5 -mt-0.5" }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>);
const IconBarChart = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2 w-5 h-5"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>);

type ExamType = "SKD" | "PSIKOTEST" | "AKADEMIK" | "PSIKOTEST_TNI";

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
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (result.exam.psikotestCategory === "PAULI") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 text-center shadow-md">
          <PauliReportView attemptId={attemptId!} />
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-2xl text-xs md:text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
            >
              <span>Kembali ke Katalog Ujian</span>
            </Link>
          </div>
        </div>
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 border shadow-sm ${
            examType === "SKD" && passed ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-blue-50 text-blue-600 border-blue-200"
          }`}>
            {examType === "SKD" && passed ? <IconTrophy /> : <IconFileText />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Hasil Ujian Selesai</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">{result.exam.title}</p>
          <span className={`inline-block mt-3 text-[10px] font-bold px-3 py-1 rounded-full border ${
            examType === "SKD" ? "bg-blue-50 text-blue-700 border-blue-200" :
            examType === "PSIKOTEST" ? "bg-purple-50 text-purple-700 border-purple-200" :
            "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {examType}
            {examType === "SKD" && result.exam.skdCategory &&
              ` · ${result.exam.skdCategory}`}
            {examType === "PSIKOTEST" && result.exam.psikotestCategory &&
              ` · ${result.exam.psikotestCategory.split(/[\s_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}`}
            {examType === "AKADEMIK" && result.exam.akademikCategory &&
              ` · ${result.exam.akademikCategory.replace(/_/g, " ")}`}
          </span>
        </div>

        {/* Total Score */}
        <div className={`rounded-3xl p-6 sm:p-8 text-center mb-6 shadow-md transition-all ${
          examType === "SKD" ? (passed ? "bg-emerald-600 shadow-emerald-500/20" : "bg-blue-600 shadow-blue-500/20") :
          "bg-blue-600 shadow-blue-500/20"
        }`}>
          <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Total Skor Kamu</p>
          <p className="text-white text-5xl sm:text-6xl font-black">{result.totalScore}</p>
          {examType === "SKD" && (
            <p className="text-xs sm:text-sm mt-3 font-semibold text-white/90 flex items-center justify-center gap-1.5 bg-white/10 py-1.5 px-4 rounded-full max-w-fit mx-auto backdrop-blur-sm">
              {passed ? <><IconCheckCircle /> Memenuhi Semua Passing Grade</> : <><IconXCircle /> Belum Memenuhi Passing Grade</>}
            </p>
          )}
        </div>

        {/* Rincian Skor */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 mb-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">Rincian Skor Per Komponen</h2>

          {/* SKD */}
          {examType === "SKD" && (
            <div className="flex flex-col gap-5">
              {[
                { label: "TWK", score: result.twkScore, max: 150, passing: 65, passed: passedTWK, color: "bg-blue-600" },
                { label: "TIU", score: result.tiuScore, max: 175, passing: 80, passed: passedTIU, color: "bg-purple-600" },
                { label: "TKP", score: result.tkpScore, max: 225, passing: 156, passed: passedTKP, color: "bg-emerald-600" },
              ]
                .filter(item => !result.exam.skdCategory || result.exam.skdCategory === item.label)
                .map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{item.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.passed ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-rose-100 text-rose-700 border border-rose-200"
                      }`}>
                        {item.passed ? "LULUS" : `MIN. ${item.passing}`}
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-800">{item.score} <span className="font-medium text-slate-400 text-xs">/ {item.max}</span></span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-2.5 rounded-full transition-all duration-500 ${item.passed ? item.color : "bg-rose-500"}`}
                      style={{ width: `${Math.min((item.score / item.max) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Passing grade minimum: {item.passing} poin</p>
                </div>
              ))}
            </div>
          )}

          {/* Psikotest */}
          {examType === "PSIKOTEST" && (
            <div className="flex flex-col gap-5">
              {Object.keys(psikotestConfig).length > 0 ? (
                Object.entries(psikotestConfig).map(([sub]) => {
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
                    <div key={sub} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="font-bold text-slate-800">{sub.split(/[\s_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}</span>
                        <span className="font-extrabold text-slate-800">{score} <span className="font-medium text-slate-400 text-xs">/ {maxScore}</span></span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="h-2.5 rounded-full bg-purple-600 transition-all duration-500"
                          style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">{pct}% dari skor maksimal</p>
                    </div>
                  );
                })
              ) : (
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
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="font-bold text-slate-800">{singleCat.split(/[\s_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}</span>
                        <span className="font-extrabold text-slate-800">{score} <span className="font-medium text-slate-400 text-xs">/ {maxScore}</span></span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="h-2.5 rounded-full bg-purple-600 transition-all duration-500"
                          style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">{pct}% dari skor maksimal</p>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* Akademik */}
          {examType === "AKADEMIK" && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="font-bold text-slate-800">
                  {result.exam.akademikCategory?.replace(/_/g, " ")}
                </span>
                <span className="font-extrabold text-slate-800">{result.akademikScore} <span className="font-medium text-slate-400 text-xs">/ 100</span></span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="h-2.5 rounded-full bg-amber-600 transition-all duration-500"
                  style={{ width: `${result.akademikScore}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                {result.akademikScore}% dari skor maksimal
              </p>
            </div>
          )}
        </div>

        {/* Statistik singkat */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-slate-900">{answered}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Soal Dijawab</p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-slate-900">{total - answered}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Soal Kosong</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <Link href={`/history/${attemptId}`}
            className="w-full text-center bg-blue-600 text-white font-semibold text-xs sm:text-sm py-3.5 rounded-2xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2">
            <IconBarChart />
            <span>Lihat Detail Pembahasan Jawaban</span>
          </Link>
          <div className="flex gap-2.5">
            <Link href="/catalog"
              className="flex-1 text-center bg-white border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm py-3 rounded-2xl hover:bg-slate-50 transition-colors">
              Ke Katalog
            </Link>
            <Link href="/"
              className="flex-1 text-center bg-white border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm py-3 rounded-2xl hover:bg-slate-50 transition-colors">
              Ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}