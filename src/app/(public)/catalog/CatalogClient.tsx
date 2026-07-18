"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Exam {
  id: string;
  title: string;
  duration: number;
  isPremium: boolean;
  isPublished: boolean;
  skdCategory: string | null;
  examType: "SKD" | "PSIKOTEST" | "AKADEMIK";
  psikotestCategory: string | null;
  akademikCategory: string | null;
  _count: { questions: number };
}

interface UserSession {
  id: string;
  isPremium: boolean;
}

interface Props {
  exams: Exam[];
  finishedExamIds: string[];
  scoreMap: Record<string, number>;
  userSession: UserSession | null;
}

function ExamWarningModal({
  exam,
  onConfirm,
  onCancel,
}: {
  exam: Exam;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="bg-blue-600 rounded-t-2xl px-6 py-5 text-white">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">📋</span>
            <h2 className="text-lg font-bold">Informasi Ujian</h2>
          </div>
          <p className="text-blue-100 text-sm">{exam.title}</p>
        </div>

        <div className="px-6 py-5">
          {/* Info ujian */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{exam.duration}</p>
              <p className="text-xs text-gray-500">Menit</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{exam._count.questions}</p>
              <p className="text-xs text-gray-500">Total Soal</p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold text-red-700 mb-2">⚠️ Perhatian Penting</p>
            <ul className="text-sm text-red-600 flex flex-col gap-1.5">
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">📵</span>
                <span>Dilarang melakukan screenshot selama ujian berlangsung</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">🚫</span>
                <span>Dilarang berpindah tab atau minimize browser</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⏱️</span>
                <span>Timer berjalan otomatis dan tidak bisa dijeda</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">🔒</span>
                <span>Ujian hanya dapat dikerjakan <strong>1 kali</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">💾</span>
                <span>Jawaban tersimpan otomatis setiap memilih opsi</span>
              </li>
            </ul>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer mb-5">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-blue-600"
            />
            <span className="text-sm text-gray-700">
              Saya telah membaca dan memahami seluruh ketentuan ujian di atas
            </span>
          </label>

          {/* Tombol */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={!checked}
              className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Mulai Ujian →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type MainTab = "SKD" | "PSIKOTEST" | "AKADEMIK";

const PSIKOTEST_SUBS = ["SEMUA", "KECERDASAN", "KECERMATAN", "KEPRIBADIAN", "GABUNGAN"] as const;

const AKADEMIK_SUBS = [
  "SEMUA",
  "WAWASAN_KEBANGSAAN",
  "PENGETAHUAN_UMUM",
  "TES_POTENSI_AKADEMIK",
  "TES_KOMPETENSI_KEAHLIAN",
  "TES_PENGETAHUAN_KEPOLISIAN",
  "TES_PENALARAN_NUMERIK",
] as const;

const AKADEMIK_LABELS: Record<string, string> = {
  SEMUA: "Semua",
  WAWASAN_KEBANGSAAN: "Wawasan Kebangsaan",
  PENGETAHUAN_UMUM: "Pengetahuan Umum",
  TES_POTENSI_AKADEMIK: "Tes Potensi Akademik",
  TES_KOMPETENSI_KEAHLIAN: "Tes Kompetensi Keahlian",
  TES_PENGETAHUAN_KEPOLISIAN: "Tes Pengetahuan Kepolisian",
  TES_PENALARAN_NUMERIK: "Tes Penalaran Numerik",
};

export default function CatalogClient({ exams, finishedExamIds, scoreMap, userSession }: Props) {
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>("SKD");
  const [psikotestSub, setPsikotestSub] = useState("SEMUA");
  const [akademikSub, setAkademikSub] = useState("SEMUA");

  const finishedSet = new Set(finishedExamIds);

  // Filter exams per tab
  const skdExams = exams.filter((e) => e.examType === "SKD");
  const psikotestExams = exams.filter((e) => e.examType === "PSIKOTEST");
  const akademikExams = exams.filter((e) => e.examType === "AKADEMIK");

  const [skdSub, setSkdSub] = useState("SEMUA");

  const filteredSKD = skdSub === "SEMUA"
    ? skdExams
    : skdSub === "GABUNGAN"
      ? skdExams.filter((e) => !e.skdCategory)
      : skdExams.filter((e) => e.skdCategory === skdSub);

  const filteredPsikotest = psikotestSub === "SEMUA"
    ? psikotestExams
    : psikotestExams.filter((e) => e.psikotestCategory === psikotestSub);

  const filteredAkademik = akademikSub === "SEMUA"
    ? akademikExams
    : akademikExams.filter((e) => e.akademikCategory === akademikSub);

  const currentExams =
    mainTab === "SKD" ? filteredSKD :
      mainTab === "PSIKOTEST" ? filteredPsikotest :
        filteredAkademik;


  const handleStartTest = (exam: Exam) => {
    if (!userSession) { router.push("/login"); return; }
    setSelectedExam(exam);
  };

  const handleConfirm = () => {
    if (!selectedExam) return;
    setSelectedExam(null);
    router.push(`/exam/${selectedExam.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {selectedExam && (
        <ExamWarningModal
          exam={selectedExam}
          onConfirm={handleConfirm}
          onCancel={() => setSelectedExam(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Katalog Ujian Tersedia</h1>
        {userSession && (
          <Link href="/history" className="text-sm text-blue-600 font-medium hover:underline">
            Lihat Riwayat Ujian →
          </Link>
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 mb-4">
        {(["SKD", "PSIKOTEST", "AKADEMIK"] as MainTab[]).map((tab) => {
          const count =
            tab === "SKD" ? skdExams.length :
              tab === "PSIKOTEST" ? psikotestExams.length :
                akademikExams.length;
          return (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${mainTab === tab
                  ? tab === "SKD" ? "bg-blue-600 text-white" :
                    tab === "PSIKOTEST" ? "bg-purple-600 text-white" :
                      "bg-orange-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
            >
              {tab}
              <span className="ml-1.5 opacity-70 text-xs">({count})</span>
            </button>
          );
        })}
      </div>

      {mainTab === "SKD" && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { value: "SEMUA", label: "Semua" },
            { value: "GABUNGAN", label: "Gabungan" },
            { value: "TWK", label: "TWK" },
            { value: "TIU", label: "TIU" },
            { value: "TKP", label: "TKP" },
          ].map((sub) => {
            const count = sub.value === "SEMUA" ? skdExams.length
              : sub.value === "GABUNGAN" ? skdExams.filter((e) => !e.skdCategory).length
                : skdExams.filter((e) => e.skdCategory === sub.value).length;
            return (
              <button key={sub.value} onClick={() => setSkdSub(sub.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${skdSub === sub.value
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}>
                {sub.label}
                <span className="ml-1 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Sub-tabs Psikotest */}
      {mainTab === "PSIKOTEST" && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {PSIKOTEST_SUBS.map((sub) => {
            const count = sub === "SEMUA"
              ? psikotestExams.length
              : psikotestExams.filter((e) => e.psikotestCategory === sub).length;
            return (
              <button
                key={sub}
                onClick={() => setPsikotestSub(sub)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${psikotestSub === sub
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
              >
                {sub === "SEMUA" ? "Semua" : sub.charAt(0) + sub.slice(1).toLowerCase()}
                <span className="ml-1 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Sub-tabs Akademik */}
      {mainTab === "AKADEMIK" && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {AKADEMIK_SUBS.map((sub) => {
            const count = sub === "SEMUA"
              ? akademikExams.length
              : akademikExams.filter((e) => e.akademikCategory === sub).length;
            return (
              <button
                key={sub}
                onClick={() => setAkademikSub(sub)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${akademikSub === sub
                    ? "bg-orange-100 text-orange-700 border border-orange-200"
                    : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
              >
                {AKADEMIK_LABELS[sub]}
                <span className="ml-1 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {currentExams.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-lg font-medium">Belum ada ujian tersedia</p>
          <p className="text-sm mt-1">Pantau terus untuk ujian terbaru!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {currentExams.map((exam) => {
          const isDone = finishedSet.has(exam.id);
          const score = scoreMap[exam.id];
          const isPremiumLocked = exam.isPremium && !userSession?.isPremium;

          return (
            <div key={exam.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow relative flex flex-col">

              {/* Badge */}
              <div className="absolute top-4 right-4 flex gap-2">
                {isDone && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
                    ✓ Selesai
                  </span>
                )}
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${exam.isPremium ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 border border-gray-200"
                  }`}>
                  {exam.isPremium ? "Premier" : "Free"}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${exam.examType === "SKD" ? "bg-blue-50" :
                      exam.examType === "PSIKOTEST" ? "bg-purple-50" : "bg-orange-50"
                    }`}>
                    {exam.examType === "SKD" ? "📝" : exam.examType === "PSIKOTEST" ? "🧠" : "🎓"}
                  </div>
                  <div className="flex-1 pr-24">
                    <h2 className="text-lg font-bold text-gray-900">{exam.title}</h2>
                    {/* Sub-label */}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${exam.examType === "SKD" ? "bg-blue-50 text-blue-600" :
                          exam.examType === "PSIKOTEST" ? "bg-purple-50 text-purple-600" :
                            "bg-orange-50 text-orange-600"
                        }`}>
                        {exam.examType}
                      </span>
                      {exam.examType === "SKD" && (
                        <span className="text-xs text-gray-400">
                          · {exam.skdCategory ?? "Gabungan"}
                        </span>
                      )}
                      {exam.examType === "PSIKOTEST" && exam.psikotestCategory && (
                        <span className="text-xs text-gray-400">
                          · {exam.psikotestCategory.charAt(0) + exam.psikotestCategory.slice(1).toLowerCase()}
                        </span>
                      )}
                      {exam.examType === "AKADEMIK" && exam.akademikCategory && (
                        <span className="text-xs text-gray-400">
                          · {AKADEMIK_LABELS[exam.akademikCategory] ?? exam.akademikCategory.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    {isDone && (
                      <p className="text-sm text-green-600 font-semibold mt-1">Skor kamu: {score}</p>
                    )}
                  </div>
                </div>

                <div className="w-full h-px bg-gray-100 my-3" />

                <div className="flex items-center gap-6 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">🕐</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{exam.duration} mins</p>
                      <p className="text-xs text-gray-400">Duration</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">💬</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{exam._count.questions}</p>
                      <p className="text-xs text-gray-400">Questions Total</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Button */}
              <div className="mt-auto">
                {isDone ? (
                  <span className="block w-full text-center bg-gray-100 text-gray-500 text-sm font-semibold py-3 rounded-xl cursor-not-allowed">
                    Sudah Dikerjakan
                  </span>
                ) : isPremiumLocked ? (
                  <span className="block w-full text-center bg-yellow-50 border border-yellow-200 text-yellow-600 text-sm font-semibold py-3 rounded-xl cursor-not-allowed">
                    🔒 Khusus Member Premium
                  </span>
                ) : (
                  <button
                    onClick={() => handleStartTest(exam)}
                    className={`block w-full text-center text-white text-sm font-semibold py-3 rounded-xl transition-colors ${exam.examType === "SKD" ? "bg-blue-600 hover:bg-blue-700" :
                        exam.examType === "PSIKOTEST" ? "bg-purple-600 hover:bg-purple-700" :
                          "bg-orange-500 hover:bg-orange-600"
                      }`}
                  >
                    {userSession ? "Start Test →" : "Login untuk Mulai"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {exams.length > 0 && (
        <div className="mt-10 bg-blue-600 rounded-2xl p-8 flex items-center justify-between">
          <div>
            <h3 className="text-white text-xl font-bold mb-1">Master Your Future with Guided Learning.</h3>
            <p className="text-blue-100 text-sm">Bergabung dengan ribuan siswa dan raih hasil terbaikmu.</p>
          </div>
          <Link href="/#contact"
            className="bg-white text-blue-600 text-sm font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shrink-0 ml-6">
            Explore Membership
          </Link>
        </div>
      )}
    </div>
  );
}