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
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/history" className="hover:text-blue-600">Riwayat</Link>
        <span>›</span>
        <span className="text-gray-600 line-clamp-1">{attempt.exam.title}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">{attempt.exam.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${examType === "SKD" ? "bg-blue-50 text-blue-600" :
                examType === "PSIKOTEST" ? "bg-purple-50 text-purple-600" :
                  "bg-orange-50 text-orange-600"
                }`}>
                {examType}
                {examType === "SKD" && skdCat && ` · ${skdCat}`}
                {examType === "PSIKOTEST" && attempt.exam.psikotestCategory &&
                  ` · ${attempt.exam.psikotestCategory}`}
                {examType === "AKADEMIK" && attempt.exam.akademikCategory &&
                  ` · ${attempt.exam.akademikCategory.replace(/_/g, " ")}`}
              </span>
              <p className="text-xs text-gray-400">
                {new Date(attempt.finishedAt).toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {passed !== null && (
            <span className={`text-sm font-bold px-4 py-2 rounded-xl shrink-0 ${passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}>
              {passed ? "Lulus" : "Belum Lulus"}
            </span>
          )}
        </div>

        {/* Score Grid per examType */}
        {examType === "SKD" && (
          <div className={`grid gap-3 ${skdCat ? "grid-cols-2" : "grid-cols-4"}`}>
            {skdCat ? (
              <>
                <div className={`rounded-xl p-3 text-center ${skdCat === "TWK" ? "bg-blue-50 text-blue-700" :
                  skdCat === "TIU" ? "bg-purple-50 text-purple-700" :
                    "bg-green-50 text-green-700"
                  }`}>
                  <p className="text-xs mb-0.5 opacity-70">{skdCat}</p>
                  <p className="text-xl font-bold">
                    {skdCat === "TWK" ? attempt.twkScore :
                      skdCat === "TIU" ? attempt.tiuScore :
                        attempt.tkpScore}
                  </p>
                  <p className="text-xs opacity-60">
                    /{skdCat === "TWK" ? 150 : skdCat === "TIU" ? 175 : 225}
                  </p>
                </div>
                <div className={`rounded-xl p-3 text-center ${passed ? "bg-green-600" : "bg-blue-600"} text-white`}>
                  <p className="text-xs mb-0.5 opacity-80">Total</p>
                  <p className="text-xl font-bold">{attempt.totalScore}</p>
                  <p className="text-xs opacity-60">
                    /{skdCat === "TWK" ? 150 : skdCat === "TIU" ? 175 : 225}
                  </p>
                </div>
              </>
            ) : (
              <>
                {[
                  { label: "TWK", score: attempt.twkScore, max: 150, color: "bg-blue-50 text-blue-700" },
                  { label: "TIU", score: attempt.tiuScore, max: 175, color: "bg-purple-50 text-purple-700" },
                  { label: "TKP", score: attempt.tkpScore, max: 225, color: "bg-green-50 text-green-700" },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl p-3 text-center ${item.color}`}>
                    <p className="text-xs mb-0.5 opacity-70">{item.label}</p>
                    <p className="text-xl font-bold">{item.score}</p>
                    <p className="text-xs opacity-60">/{item.max}</p>
                  </div>
                ))}
                <div className={`rounded-xl p-3 text-center ${passed ? "bg-green-600" : "bg-blue-600"} text-white`}>
                  <p className="text-xs mb-0.5 opacity-80">Total</p>
                  <p className="text-xl font-bold">{attempt.totalScore}</p>
                  <p className="text-xs opacity-60">/550</p>
                </div>
              </>
            )}
          </div>
        )}

        {examType === "PSIKOTEST" && (
          <div className={`grid gap-3 ${Object.keys(psikotestConfig).length > 1 ? "grid-cols-4" : "grid-cols-2"}`}>
            {Object.keys(psikotestConfig).length > 1 ? (
              <>
                {[
                  { label: "Kecerdasan", score: attempt.kecerdasanScore, max: 100 },
                  { label: "Kecermatan", score: attempt.kecermatanScore, max: 80 },
                  { label: "Kepribadian", score: attempt.kepribadianScore, max: 80 },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl p-3 text-center bg-purple-50 text-purple-700">
                    <p className="text-xs mb-0.5 opacity-70">{item.label}</p>
                    <p className="text-xl font-bold">{item.score}</p>
                    <p className="text-xs opacity-60">/{item.max}</p>
                  </div>
                ))}
                <div className="rounded-xl p-3 text-center bg-purple-600 text-white">
                  <p className="text-xs mb-0.5 opacity-80">Total</p>
                  <p className="text-xl font-bold">{attempt.totalScore}</p>
                  <p className="text-xs opacity-60">/260</p>
                </div>
              </>
            ) : (
              // Single kategori
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
                    <div className="rounded-xl p-3 text-center bg-purple-50 text-purple-700">
                      <p className="text-xs mb-0.5 opacity-70">{cat}</p>
                      <p className="text-xl font-bold">{score}</p>
                      <p className="text-xs opacity-60">/{maxScore}</p>
                    </div>
                    <div className="rounded-xl p-3 text-center bg-purple-600 text-white">
                      <p className="text-xs mb-0.5 opacity-80">% Nilai</p>
                      <p className="text-xl font-bold">{Math.round((score / maxScore) * 100)}%</p>
                    </div>
                  </>
                );
              })()
            )}
          </div>
        )}

        {examType === "AKADEMIK" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 text-center bg-orange-50 text-orange-700">
              <p className="text-xs mb-0.5 opacity-70">
                {attempt.exam.akademikCategory?.replace(/_/g, " ")}
              </p>
              {/* Ini sudah skala 100 */}
              <p className="text-xl font-bold">{attempt.akademikScore}</p>
              <p className="text-xs opacity-60">/100</p>
            </div>
            <div className="rounded-xl p-3 text-center bg-orange-500 text-white">
              <p className="text-xs mb-0.5 opacity-80">% Benar</p>
              <p className="text-xl font-bold">
                {attempt.akademikScore}%
              </p>
            </div>
          </div>
        )}

        {/* Statistik benar/salah/kosong */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: "Benar", value: stats.correct, color: "bg-green-50 text-green-700 border-green-100" },
            { label: "Salah", value: stats.wrong, color: "bg-red-50 text-red-600 border-red-100" },
            { label: "Kosong", value: stats.empty, color: "bg-gray-50 text-gray-500 border-gray-100" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-3 text-center border ${item.color}`}>
              <p className="text-lg font-bold">{item.value}</p>
              <p className="text-xs mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab filter */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {tabOptions.map((tab) => {
          const count = tab === "ALL" ? attempt.answers.length :
            examType === "SKD"
              ? attempt.answers.filter((a) => a.question.category === tab).length
              : attempt.answers.filter((a) => a.question.subCategory === tab).length;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${activeTab === tab ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}>
              {tab === "ALL" ? "Semua" : tab}
              <span className="ml-1.5 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Filter status */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {[
          { value: "all", label: "Semua" },
          { value: "correct", label: "Benar" },
          { value: "wrong", label: "Salah" },
          { value: "empty", label: "Kosong" },
        ].map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value as typeof filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${filter === f.value ? "bg-gray-800 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Daftar Soal */}
      <div className="flex flex-col gap-4">
        {filteredAnswers.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white border border-gray-200 rounded-2xl">
            Tidak ada soal yang sesuai filter
          </div>
        )}

        {filteredAnswers.map((answer, idx) => {
          const q = answer.question;
          const answerStatus = getAnswerStatus(answer);
          const isTKP = examType === "SKD" && q.category === "TKP";
          const isPsikotest = examType === "PSIKOTEST";

          return (
            <div key={answer.id} className={`bg-white border rounded-2xl p-6 ${answerStatus === "correct" ? "border-green-200" :
              answerStatus === "wrong" ? "border-red-200" :
                answerStatus === "empty" ? "border-gray-200" :
                  "border-blue-200"
              }`}>

              {/* Header soal */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Badge kategori */}
                  {examType === "SKD" && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${q.category === "TWK" ? "bg-blue-100 text-blue-700" :
                      q.category === "TIU" ? "bg-purple-100 text-purple-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                      {q.category}
                    </span>
                  )}
                  {(examType === "PSIKOTEST" || examType === "AKADEMIK") && q.subCategory && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      {q.subCategory}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">Soal #{idx + 1}</span>
                  {answer.isFlagged && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                      🚩 Flagged
                    </span>
                  )}
                  {/* Psikotest: hint 2 jawaban */}
                  {isPsikotest && q.correctOption2 && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      2 Jawaban
                    </span>
                  )}
                </div>

                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${answerStatus === "correct" ? "bg-green-100 text-green-700" :
                  answerStatus === "wrong" ? "bg-red-100 text-red-600" :
                    answerStatus === "empty" ? "bg-gray-100 text-gray-500" :
                      "bg-blue-100 text-blue-600"
                  }`}>
                  {answerStatus === "correct" ? "Benar" :
                    answerStatus === "wrong" ? "Salah" :
                      answerStatus === "empty" ? "Kosong" : "TKP"}
                </span>
              </div>

              {/* Teks soal */}
              <p className="text-gray-800 text-sm leading-relaxed mb-3">{q.content}</p>

              {q.imageUrl && (
                <div className="mb-4">
                  <img src={q.imageUrl} alt="Gambar soal"
                    className="max-h-48 object-contain rounded-xl border border-gray-100 bg-gray-50" />
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

                  // Deteksi apakah soal ini punya 2 jawaban benar (khusus psikotest)
                  const hasDualAnswer = isPsikotest && !!(q.correctOption2 && q.correctOption2.trim() !== "");

                  let style = "border-gray-100 bg-gray-50 text-gray-600";
                  if (!isTKP) {
                    if (isAnyCorrect && (isSelected || isSelected2)) style = "border-green-400 bg-green-50 text-green-800";
                    else if (isAnyCorrect) style = "border-green-300 bg-green-50 text-green-700";
                    else if (isSelected || isSelected2) style = "border-red-300 bg-red-50 text-red-700";
                  } else {
                    if (isSelected) style = "border-blue-300 bg-blue-50 text-blue-700";
                  }

                  return (
                    <div key={opt} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${style}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? "bg-blue-500 text-white" :
                        isSelected2 ? "bg-green-400 text-white" :
                          isAnyCorrect && !isTKP ? "bg-green-500 text-white" :
                            "bg-gray-200 text-gray-600"
                        }`}>
                        {opt}
                      </span>
                      <span className="flex-1">{optText}</span>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {isTKP && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                            +{q[`score${opt}` as keyof Question] ?? 0}
                          </span>
                        )}

                        {/* Teks dinamis berdasarkan hasDualAnswer */}
                        {isSelected && (
                          <span className="text-xs font-semibold text-blue-500">
                            ← {hasDualAnswer ? "Jawaban 1" : "Jawaban"}
                          </span>
                        )}
                        {isSelected2 && (
                          <span className="text-xs font-semibold text-green-500">
                            ← Jawaban 2
                          </span>
                        )}
                        {isCorrect1 && !isTKP && (
                          <span className="text-xs font-semibold text-green-600">
                            ← {hasDualAnswer ? "Benar 1" : "Benar"}
                          </span>
                        )}
                        {isCorrect2 && isPsikotest && (
                          <span className="text-xs font-semibold text-green-600">
                            ← Benar 2
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Skor TKP */}
              {isTKP && answer.selected && (
                <div className="mt-3 bg-blue-50 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm text-blue-700">Skor yang didapat:</span>
                  <span className="text-sm font-bold text-blue-700">
                    +{q[`score${answer.selected}` as keyof Question] ?? 0} poin
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <Link href="/history" className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline">
          ← Kembali ke Riwayat
        </Link>
      </div>
    </div>
  );
}