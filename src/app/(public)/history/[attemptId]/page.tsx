"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PauliReportView from "@/components/PauliReportView";

type ExamType = "SKD" | "PSIKOTEST" | "AKADEMIK" | "PSIKOTEST_TNI";

interface Question {
  id: string;
  category: "TWK" | "TIU" | "TKP";
  subCategory?: string;
  content: string;
  imageUrl: string | null;
  orderNum: number;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctOption: string | null;
  correctOption2: string | null;
  scoreA: number | null;
  scoreB: number | null;
  scoreC: number | null;
  scoreD: number | null;
  scoreE: number | null;
}

interface Answer {
  id: string;
  questionId: string;
  selected: string | null;
  selected2: string | null;
  isFlagged: boolean;
  question: Question;
}

interface AttemptDetail {
  id: string;
  twkScore: number;
  tiuScore: number;
  tkpScore: number;
  kecerdasanScore: number;
  kecermatanScore: number;
  kepribadianScore: number;
  akademikScore: number;
  totalScore: number;
  finishedAt: string;
  exam: {
    title: string;
    duration: number;
    examType: ExamType;
    skdCategory?: string | null;
    psikotestCategory?: string;
    psikotestConfig?: string;
    akademikCategory?: string;
  };
  answers: Answer[];
}

const OPTIONS = ["A", "B", "C", "D", "E"] as const;

export default function HistoryDetailPage() {
  const { attemptId } = useParams();
  const router = useRouter();
  const { status } = useSession();
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "empty">("all");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      fetch(`/api/attempts/${attemptId}/detail`)
        .then((r) => r.json())
        .then((data) => {
          setAttempt(data);
          setLoading(false);
        });
    }
  }, [status, attemptId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!attempt) return null;

  if (attempt.exam.psikotestCategory === "PAULI") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link
            href="/history"
            className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Kembali ke Riwayat Ujian</span>
          </Link>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <PauliReportView attemptId={attempt.id} />
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
            <Link
              href="/history"
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-2xl text-xs md:text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
            >
              <span>Kembali ke Daftar Riwayat</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const examType = attempt.exam.examType ?? "SKD";
  const psikotestConfig = attempt.exam.psikotestConfig
    ? JSON.parse(attempt.exam.psikotestConfig) as Record<string, number>
    : {};

  const getAnswerStatus = (answer: Answer) => {
    const q = answer.question;

    if (!answer.selected && !answer.selected2) return "empty";
    if (examType === "SKD" && q.category === "TKP") return "tkp";

    if (examType === "PSIKOTEST") {
      const hasSecondAnswer = !!(
        q.correctOption2 &&
        q.correctOption2.trim() !== ""
      );

      if (hasSecondAnswer) {
        const correctSet = new Set([
          q.correctOption?.trim(),
          q.correctOption2?.trim(),
        ].filter(Boolean));

        const userSet = new Set([
          answer.selected?.trim(),
          answer.selected2?.trim(),
        ].filter(Boolean));

        const isCorrect =
          userSet.size === 2 &&
          correctSet.size === 2 &&
          [...userSet].every((ans) => correctSet.has(ans as string));

        return isCorrect ? "correct" : "wrong";
      } else {
        const noExtraAnswer = !answer.selected2 || answer.selected2.trim() === "";
        return (answer.selected === q.correctOption && noExtraAnswer)
          ? "correct"
          : "wrong";
      }
    }

    return answer.selected === q.correctOption ? "correct" : "wrong";
  };

  // Tab options per examType
  const tabOptions: string[] =
    examType === "SKD" ? ["ALL", "TWK", "TIU", "TKP"] :
      examType === "PSIKOTEST" ? ["ALL", ...Object.keys(psikotestConfig).length > 0
        ? Object.keys(psikotestConfig)
        : [attempt.exam.psikotestCategory ?? ""]] :
        ["ALL"];

  const filteredAnswers = attempt.answers.filter((a) => {
    const matchTab = activeTab === "ALL" ||
      (examType === "SKD" ? a.question.category === activeTab : a.question.subCategory === activeTab);
    const s = getAnswerStatus(a);
    const matchFilter =
      filter === "all" ||
      (filter === "correct" && s === "correct") ||
      (filter === "wrong" && s === "wrong") ||
      (filter === "empty" && s === "empty");
    return matchTab && matchFilter;
  });

  const stats = {
    correct: attempt.answers.filter((a) => getAnswerStatus(a) === "correct").length,
    wrong: attempt.answers.filter((a) => getAnswerStatus(a) === "wrong").length,
    empty: attempt.answers.filter((a) => getAnswerStatus(a) === "empty").length,
    tkp: attempt.answers.filter((a) => getAnswerStatus(a) === "tkp").length,
  };

  const skdCat = attempt.exam.skdCategory;

  const passed = examType === "SKD"
    ? skdCat === "TWK" ? attempt.twkScore >= 65
      : skdCat === "TIU" ? attempt.tiuScore >= 80
        : skdCat === "TKP" ? attempt.tkpScore >= 156
          : attempt.twkScore >= 65 && attempt.tiuScore >= 80 && attempt.tkpScore >= 156
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-sans">
      {/* Top Navigation */}
      <div className="mb-6">
        <Link
          href="/history"
          className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Kembali ke Riwayat Ujian</span>
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{attempt.exam.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${examType === "SKD" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  examType === "PSIKOTEST" ? "bg-purple-50 text-purple-700 border-purple-200" :
                    "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                {examType}
                {examType === "SKD" && skdCat && ` · ${skdCat}`}
                {examType === "PSIKOTEST" && attempt.exam.psikotestCategory &&
                  ` · ${attempt.exam.psikotestCategory.split(/[\s_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}`}
                {examType === "AKADEMIK" && attempt.exam.akademikCategory &&
                  ` · ${attempt.exam.akademikCategory.replace(/_/g, " ")}`}
              </span>
              <p className="text-xs text-slate-400 font-medium">
                {new Date(attempt.finishedAt).toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {passed !== null && (
            <span className={`text-xs font-bold px-4 py-2 rounded-2xl shrink-0 self-start sm:self-auto border ${passed ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-rose-100 text-rose-700 border-rose-200"
              }`}>
              {passed ? "LULUS PASSING GRADE" : "BELUM LULUS PASSING GRADE"}
            </span>
          )}
        </div>

        {/* Score Grid per examType */}
        {examType === "SKD" && (
          <div className={`grid gap-3 ${skdCat ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
            {skdCat ? (
              <>
                <div className={`rounded-2xl p-4 text-center border ${skdCat === "TWK" ? "bg-blue-50 text-blue-800 border-blue-200" :
                    skdCat === "TIU" ? "bg-purple-50 text-purple-800 border-purple-200" :
                      "bg-emerald-50 text-emerald-800 border-emerald-200"
                  }`}>
                  <p className="text-xs font-semibold opacity-75">{skdCat}</p>
                  <p className="text-2xl font-black mt-1">
                    {skdCat === "TWK" ? attempt.twkScore :
                      skdCat === "TIU" ? attempt.tiuScore :
                        attempt.tkpScore}
                  </p>
                  <p className="text-[10px] opacity-60 font-medium">
                    /{skdCat === "TWK" ? 150 : skdCat === "TIU" ? 175 : 225}
                  </p>
                </div>
                <div className={`rounded-2xl p-4 text-center text-white ${passed ? "bg-emerald-600 shadow-sm shadow-emerald-500/20" : "bg-blue-600 shadow-sm shadow-blue-500/20"}`}>
                  <p className="text-xs font-semibold text-white/80">Total Skor</p>
                  <p className="text-2xl font-black mt-1">{attempt.totalScore}</p>
                  <p className="text-[10px] text-white/70 font-medium">
                    /{skdCat === "TWK" ? 150 : skdCat === "TIU" ? 175 : 225}
                  </p>
                </div>
              </>
            ) : (
              <>
                {[
                  { label: "TWK", score: attempt.twkScore, max: 150, color: "bg-blue-50 text-blue-800 border-blue-200" },
                  { label: "TIU", score: attempt.tiuScore, max: 175, color: "bg-purple-50 text-purple-800 border-purple-200" },
                  { label: "TKP", score: attempt.tkpScore, max: 225, color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                ].map((item) => (
                  <div key={item.label} className={`rounded-2xl p-4 text-center border ${item.color}`}>
                    <p className="text-xs font-semibold opacity-75">{item.label}</p>
                    <p className="text-2xl font-black mt-1">{item.score}</p>
                    <p className="text-[10px] opacity-60 font-medium">/{item.max}</p>
                  </div>
                ))}
                <div className={`rounded-2xl p-4 text-center text-white ${passed ? "bg-emerald-600 shadow-sm shadow-emerald-500/20" : "bg-blue-600 shadow-sm shadow-blue-500/20"}`}>
                  <p className="text-xs font-semibold text-white/80">Total Skor</p>
                  <p className="text-2xl font-black mt-1">{attempt.totalScore}</p>
                  <p className="text-[10px] text-white/70 font-medium">/550</p>
                </div>
              </>
            )}
          </div>
        )}

        {examType === "PSIKOTEST" && (
          <div className={`grid gap-3 ${Object.keys(psikotestConfig).length > 1 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}>
            {Object.keys(psikotestConfig).length > 1 ? (
              <>
                {[
                  { label: "Kecerdasan", score: attempt.kecerdasanScore, max: 100 },
                  { label: "Kecermatan", score: attempt.kecermatanScore, max: 80 },
                  { label: "Kepribadian", score: attempt.kepribadianScore, max: 80 },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl p-4 text-center bg-purple-50 text-purple-800 border border-purple-200">
                    <p className="text-xs font-semibold opacity-75">{item.label}</p>
                    <p className="text-2xl font-black mt-1">{item.score}</p>
                    <p className="text-[10px] opacity-60 font-medium">/{item.max}</p>
                  </div>
                ))}
                <div className="rounded-2xl p-4 text-center bg-purple-600 text-white shadow-sm shadow-purple-500/20">
                  <p className="text-xs font-semibold text-white/80">Total Skor</p>
                  <p className="text-2xl font-black mt-1">{attempt.totalScore}</p>
                  <p className="text-[10px] text-white/70 font-medium">/260</p>
                </div>
              </>
            ) : (
              (() => {
                const cat = attempt.exam.psikotestCategory ?? "";
                const maxScore = cat === "KECERDASAN" ? 100 : 80;
                const scoreMap: Record<string, number> = {
                  KECERDASAN: attempt.kecerdasanScore,
                  KECERMATAN: attempt.kecermatanScore,
                  KEPRIBADIAN: attempt.kepribadianScore,
                };
                const score = scoreMap[cat] ?? attempt.totalScore;
                return (
                  <>
                    <div className="rounded-2xl p-4 text-center bg-purple-50 text-purple-800 border border-purple-200">
                      <p className="text-xs font-semibold opacity-75">{cat.split(/[\s_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}</p>
                      <p className="text-2xl font-black mt-1">{score}</p>
                      <p className="text-[10px] opacity-60 font-medium">/{maxScore}</p>
                    </div>
                    <div className="rounded-2xl p-4 text-center bg-purple-600 text-white shadow-sm shadow-purple-500/20">
                      <p className="text-xs font-semibold text-white/80">Akurasi Nilai</p>
                      <p className="text-2xl font-black mt-1">{Math.round((score / maxScore) * 100)}%</p>
                    </div>
                  </>
                );
              })()
            )}
          </div>
        )}

        {examType === "AKADEMIK" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 text-center bg-amber-50 text-amber-800 border border-amber-200">
              <p className="text-xs font-semibold opacity-75">
                {attempt.exam.akademikCategory?.replace(/_/g, " ")}
              </p>
              <p className="text-2xl font-black mt-1">{attempt.akademikScore}</p>
              <p className="text-[10px] opacity-60 font-medium">/100</p>
            </div>
            <div className="rounded-2xl p-4 text-center bg-amber-600 text-white shadow-sm shadow-amber-500/20">
              <p className="text-xs font-semibold text-white/80">Persentase Benar</p>
              <p className="text-2xl font-black mt-1">{attempt.akademikScore}%</p>
            </div>
          </div>
        )}

        {/* Statistik jawaban */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          {[
            { label: "Jawaban Benar", value: stats.correct, color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
            { label: "Jawaban Salah", value: stats.wrong, color: "bg-rose-50 text-rose-800 border-rose-200" },
            { label: "Tidak Dijawab", value: stats.empty, color: "bg-slate-50 text-slate-700 border-slate-200" },
          ].map((item) => (
            <div key={item.label} className={`rounded-2xl p-3 text-center border ${item.color}`}>
              <p className="text-lg sm:text-xl font-black">{item.value}</p>
              <p className="text-[10px] sm:text-xs font-semibold opacity-80">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigasi Kategori Soal */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {tabOptions.map((tab) => {
          const count = tab === "ALL" ? attempt.answers.length :
            examType === "SKD"
              ? attempt.answers.filter((a) => a.question.category === tab).length
              : attempt.answers.filter((a) => a.question.subCategory === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${activeTab === tab
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
            >
              <span>{tab === "ALL" ? "Semua Kategori" : tab}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === tab ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Status Jawaban */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { value: "all", label: "Semua Jawaban" },
          { value: "correct", label: "Jawaban Benar" },
          { value: "wrong", label: "Jawaban Salah" },
          { value: "empty", label: "Tidak Dijawab" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as typeof filter)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${filter === f.value
              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Daftar Soal & Pembahasan */}
      <div className="flex flex-col gap-4">
        {filteredAnswers.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-white border border-slate-200/80 rounded-3xl p-6 text-xs sm:text-sm font-medium">
            Tidak ada soal yang sesuai dengan filter pilihan kamu.
          </div>
        )}

        {filteredAnswers.map((answer, idx) => {
          const q = answer.question;
          const answerStatus = getAnswerStatus(answer);
          const isTKP = examType === "SKD" && q.category === "TKP";
          const isPsikotest = examType === "PSIKOTEST";

          return (
            <div
              key={answer.id}
              className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-sm transition-all ${answerStatus === "correct" ? "border-emerald-200" :
                answerStatus === "wrong" ? "border-rose-200" :
                  answerStatus === "empty" ? "border-slate-200/80" :
                    "border-blue-200"
                }`}
            >
              {/* Header soal */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Badge kategori */}
                  {examType === "SKD" && (
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${q.category === "TWK" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        q.category === "TIU" ? "bg-purple-50 text-purple-700 border-purple-200" :
                          "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                      {q.category}
                    </span>
                  )}
                  {(examType === "PSIKOTEST" || examType === "AKADEMIK") && q.subCategory && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {q.subCategory}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono">Soal #{idx + 1}</span>

                  {answer.isFlagged && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 0l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 7H7v2h7.586l-1.293 1.293a1 1 0 000 1.414z" />
                      </svg>
                      Ragu-ragu
                    </span>
                  )}

                  {isPsikotest && q.correctOption2 && (
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                      2 Jawaban Pilihan
                    </span>
                  )}
                </div>

                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full shrink-0 border ${answerStatus === "correct" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    answerStatus === "wrong" ? "bg-rose-50 text-rose-700 border-rose-200" :
                      answerStatus === "empty" ? "bg-slate-100 text-slate-600 border-slate-200" :
                        "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                  {answerStatus === "correct" ? "BENAR" :
                    answerStatus === "wrong" ? "SALAH" :
                      answerStatus === "empty" ? "KOSONG" : "SKOR TKP"}
                </span>
              </div>

              {/* Teks soal */}
              <p className="text-slate-800 text-xs sm:text-sm font-medium leading-relaxed mb-3 whitespace-pre-wrap">{q.content}</p>

              {q.imageUrl && (
                <div className="mb-4">
                  <img
                    src={q.imageUrl}
                    alt="Gambar soal"
                    className="max-h-48 object-contain rounded-xl border border-slate-200 bg-slate-50 p-1"
                  />
                </div>
              )}

              {/* Pilihan jawaban */}
              <div className="flex flex-col gap-2">
                {OPTIONS.map((opt) => {
                  const optText = q[`option${opt}` as keyof Question] as string;
                  const isSelected = answer.selected === opt;
                  const isSelected2 = isPsikotest && answer.selected2 === opt;
                  const isCorrect1 = q.correctOption === opt;
                  const isCorrect2 = q.correctOption2 === opt;
                  const isAnyCorrect = isCorrect1 || (isPsikotest && isCorrect2);

                  const hasDualAnswer = isPsikotest && !!(q.correctOption2 && q.correctOption2.trim() !== "");

                  let style = "border-slate-100 bg-slate-50 text-slate-700";
                  if (!isTKP) {
                    if (isAnyCorrect && (isSelected || isSelected2)) style = "border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold shadow-sm";
                    else if (isAnyCorrect) style = "border-emerald-200 bg-emerald-50/70 text-emerald-800 font-medium";
                    else if (isSelected || isSelected2) style = "border-rose-300 bg-rose-50 text-rose-900 font-medium";
                  } else {
                    if (isSelected) style = "border-blue-300 bg-blue-50 text-blue-900 font-semibold shadow-sm";
                  }

                  return (
                    <div key={opt} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border text-xs sm:text-sm transition-all ${style}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${isSelected ? "bg-blue-600 text-white" :
                          isSelected2 ? "bg-emerald-500 text-white" :
                            isAnyCorrect && !isTKP ? "bg-emerald-600 text-white" :
                              "bg-slate-200 text-slate-700"
                        }`}>
                        {opt}
                      </span>
                      <span className="flex-1 leading-normal">{optText}</span>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {isTKP && (
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            +{q[`score${opt}` as keyof Question] ?? 0} poin
                          </span>
                        )}

                        {isSelected && (
                          <span className="text-[10px] font-bold text-blue-600">
                            ← {hasDualAnswer ? "Pilihan 1" : "Pilihan Kamu"}
                          </span>
                        )}
                        {isSelected2 && (
                          <span className="text-[10px] font-bold text-emerald-600">
                            ← Pilihan 2
                          </span>
                        )}
                        {isCorrect1 && !isTKP && (
                          <span className="text-[10px] font-bold text-emerald-700">
                            ← {hasDualAnswer ? "Kunci 1" : "Kunci Jawaban"}
                          </span>
                        )}
                        {isCorrect2 && isPsikotest && (
                          <span className="text-[10px] font-bold text-emerald-700">
                            ← Kunci 2
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Skor TKP */}
              {isTKP && answer.selected && (
                <div className="mt-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-blue-800 font-medium">Skor Poin yang Diperoleh:</span>
                  <span className="text-xs font-black text-blue-700">
                    +{q[`score${answer.selected}` as keyof Question] ?? 0} poin
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <Link
          href="/history"
          className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Kembali ke Riwayat Ujian</span>
        </Link>
      </div>
    </div>
  );
}