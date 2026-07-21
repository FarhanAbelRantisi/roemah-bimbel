"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const IconClipboard = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" /></svg>);
const IconAlertTriangle = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 text-red-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>);
const IconSmartphone = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 text-gray-500"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>);
const IconBan = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 text-gray-500"><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></svg>);
const IconClock = ({ className = "shrink-0 mt-0.5 text-gray-500" }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
const IconLock = ({ className = "shrink-0 mt-0.5 text-gray-500" }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
const IconSave = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 text-gray-500"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>);
const IconInbox = () => (<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>);
const IconFileText = ({ className = "w-6 h-6 text-blue-500" }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>);
const IconMessageSquare = ({ className = "w-5 h-5 text-gray-400" }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>);
const IconFilter = ({ className = "w-5 h-5 text-gray-500" }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>);
const IconChevronDown = ({ className = "w-4 h-4 text-gray-500" }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6" /></svg>);

interface Exam {
  id: string;
  title: string;
  duration: number;
  isPremium: boolean;
  isPublished: boolean;
  skdCategory: string | null;
  examType: "SKD" | "PSIKOTEST" | "AKADEMIK" | "PSIKOTEST_TNI";
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
        <div className="bg-blue-500 rounded-t-2xl px-6 py-5 text-white">
          <div className="flex items-center gap-3 mb-1">
            <IconClipboard />
            <h2 className="text-lg font-bold">Informasi Ujian</h2>
          </div>
          <p className="text-blue-100 text-sm">{exam.title}</p>
        </div>

        <div className="px-6 py-5">
          {/* Info ujian */}
          <div className={`grid ${exam.psikotestCategory === "PAULI" ? "grid-cols-1" : "grid-cols-2"} gap-3 mb-5`}>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{exam.duration}</p>
              <p className="text-xs text-gray-500">Durasi (Menit)</p>
            </div>
            {exam.psikotestCategory !== "PAULI" && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{exam._count.questions}</p>
                <p className="text-xs text-gray-500">Total Soal</p>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1.5"><IconAlertTriangle /> Perhatian Penting</p>
            <ul className="text-sm text-red-600 flex flex-col gap-1.5">
              <li className="flex items-start gap-2">
                <IconSmartphone />
                <span>Dilarang melakukan screenshot selama ujian berlangsung</span>
              </li>
              <li className="flex items-start gap-2">
                <IconBan />
                <span>Dilarang berpindah tab atau minimize browser</span>
              </li>
              <li className="flex items-start gap-2">
                <IconClock />
                <span>Timer berjalan otomatis dan tidak bisa dijeda</span>
              </li>
              <li className="flex items-start gap-2">
                <IconLock className="shrink-0 mt-0.5 text-red-600" />
                <span>Ujian hanya dapat dikerjakan <strong>1 kali</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <IconSave />
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
              className="mt-0.5 w-4 h-4 accent-blue-500"
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
              className="flex-1 bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Mulai Ujian →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Types for filtering

const PSIKOTEST_SUBS = ["SEMUA", "KECERDASAN", "KECERMATAN", "KEPRIBADIAN", "GABUNGAN"] as const;
const TNI_SUBS = ["SEMUA", "GABUNGAN_TNI", "VERBAL", "MATEMATIKA_DASAR", "LOGIKA", "DERET_ANGKA", "DERET_GAMBAR", "KUBUS", "PAULI"] as const;
const TNI_LABELS: Record<string, string> = {
  SEMUA: "Semua",
  GABUNGAN_TNI: "Gabungan",
  VERBAL: "Verbal",
  MATEMATIKA_DASAR: "Matematika Dasar",
  LOGIKA: "Logika",
  DERET_ANGKA: "Deret Angka",
  DERET_GAMBAR: "Deret Gambar",
  KUBUS: "Kubus",
  PAULI: "Pauli",
};

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
  const [filterMode, setFilterMode] = useState<string>("ALL");
  const currentMain = filterMode === "ALL" ? "ALL"
    : filterMode.startsWith("PSIKOTEST_TNI") ? "PSIKOTEST_TNI"
      : filterMode.split("_")[0];
  const finishedSet = new Set(finishedExamIds);

  const currentExams = exams.filter(e => {
    if (filterMode === "ALL") return true;

    // SKD Filters
    if (filterMode === "SKD_SEMUA") return e.examType === "SKD";
    if (filterMode === "SKD_GABUNGAN") return e.examType === "SKD" && !e.skdCategory;
    if (filterMode.startsWith("SKD_")) return e.examType === "SKD" && e.skdCategory === filterMode.replace("SKD_", "");

    // Psikotest Filters
    if (filterMode === "PSIKOTEST_SEMUA") return e.examType === "PSIKOTEST";
    if (filterMode.startsWith("PSIKOTEST_TNI_")) {
      const sub = filterMode.replace("PSIKOTEST_TNI_", "");
      if (sub === "SEMUA") return e.examType === "PSIKOTEST_TNI";
      return e.examType === "PSIKOTEST_TNI" && e.psikotestCategory === sub;
    }
    if (filterMode.startsWith("PSIKOTEST_")) return e.examType === "PSIKOTEST" && e.psikotestCategory === filterMode.replace("PSIKOTEST_", "");

    // Akademik Filters
    if (filterMode === "AKADEMIK_SEMUA") return e.examType === "AKADEMIK";
    if (filterMode.startsWith("AKADEMIK_")) return e.examType === "AKADEMIK" && e.akademikCategory === filterMode.replace("AKADEMIK_", "");

    return true;
  });

  const FILTER_OPTIONS = [
    { value: "ALL", label: "Semua Ujian" },
    { value: "SKD_SEMUA", label: "SKD (Semua)" },
    { value: "SKD_GABUNGAN", label: "SKD - Gabungan" },
    { value: "SKD_TWK", label: "SKD - TWK" },
    { value: "SKD_TIU", label: "SKD - TIU" },
    { value: "SKD_TKP", label: "SKD - TKP" },
    { value: "PSIKOTEST_SEMUA", label: "Psikotest (Semua)" },
    ...PSIKOTEST_SUBS.filter(s => s !== "SEMUA").map(s => ({ value: `PSIKOTEST_${s}`, label: `Psikotest - ${s.charAt(0) + s.slice(1).toLowerCase()}` })),
    { value: "AKADEMIK_SEMUA", label: "Akademik (Semua)" },
    ...AKADEMIK_SUBS.filter(s => s !== "SEMUA").map(s => ({ value: `AKADEMIK_${s}`, label: `Akademik - ${AKADEMIK_LABELS[s]}` })),
    { value: "PSIKOTEST_TNI_SEMUA", label: "Psikotest TNI (Semua)" },
    ...TNI_SUBS.filter(s => s !== "SEMUA").map(s => ({ value: `PSIKOTEST_TNI_${s}`, label: `TNI - ${TNI_LABELS[s]}` })),
  ];


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
          <Link href="/history" className="text-sm text-blue-500 font-medium hover:underline">
            Lihat Riwayat Ujian →
          </Link>
        )}
      </div>

      {/* MOBILE FILTER DROPDOWN */}
      <div className="mb-6 relative max-w-[240px] md:hidden">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <IconFilter className="w-5 h-5 text-gray-500" />
        </div>
        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          className="block w-full pl-10 pr-10 py-3 text-sm border-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-xl appearance-none bg-white font-semibold shadow-sm shadow-black/5 hover:border-gray-300 transition-colors cursor-pointer text-gray-700 border"
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <IconChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* DESKTOP TABS */}
      <div className="hidden md:flex flex-col mb-6">
        {/* Main Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: "ALL", label: "Semua Ujian" },
            { id: "SKD", label: "SKD" },
            { id: "PSIKOTEST", label: "Psikotest" },
            { id: "PSIKOTEST_TNI", label: "Psikotest TNI" },
            { id: "AKADEMIK", label: "Akademik" },
          ].map((tab) => {
            let count = exams.length;
            if (tab.id === "SKD") count = exams.filter(e => e.examType === "SKD").length;
            if (tab.id === "PSIKOTEST") count = exams.filter(e => e.examType === "PSIKOTEST").length;
            if (tab.id === "PSIKOTEST_TNI") count = exams.filter(e => e.examType === "PSIKOTEST_TNI").length;
            if (tab.id === "AKADEMIK") count = exams.filter(e => e.examType === "AKADEMIK").length;

            const isActive = currentMain === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id === "ALL" ? "ALL" : tab.id === "PSIKOTEST_TNI" ? "PSIKOTEST_TNI_SEMUA" : `${tab.id}_SEMUA`)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shrink-0 border ${isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                  }`}
              >
                {tab.label}
                <span className="ml-1.5 opacity-70 text-xs">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Sub Tabs SKD */}
        {currentMain === "SKD" && (
          <div className="flex gap-2">
            {[
              { value: "SEMUA", label: "Semua" },
              { value: "GABUNGAN", label: "Gabungan" },
              { value: "TWK", label: "TWK" },
              { value: "TIU", label: "TIU" },
              { value: "TKP", label: "TKP" },
            ].map((sub) => {
              const fullValue = `SKD_${sub.value}`;
              const count = sub.value === "SEMUA" ? exams.filter(e => e.examType === "SKD").length
                : sub.value === "GABUNGAN" ? exams.filter(e => e.examType === "SKD" && !e.skdCategory).length
                  : exams.filter(e => e.examType === "SKD" && e.skdCategory === sub.value).length;
              return (
                <button key={sub.value} onClick={() => setFilterMode(fullValue)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 border ${filterMode === fullValue
                    ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}>
                  {sub.label}
                  <span className="ml-1 opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sub Tabs Psikotest */}
        {currentMain === "PSIKOTEST" && (
          <div className="flex gap-2">
            {PSIKOTEST_SUBS.map((sub) => {
              const fullValue = `PSIKOTEST_${sub}`;
              const count = sub === "SEMUA"
                ? exams.filter(e => e.examType === "PSIKOTEST").length
                : exams.filter(e => e.examType === "PSIKOTEST" && e.psikotestCategory === sub).length;
              return (
                <button
                  key={sub}
                  onClick={() => setFilterMode(fullValue)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 border ${filterMode === fullValue
                    ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                >
                  {sub === "SEMUA" ? "Semua" : sub.charAt(0) + sub.slice(1).toLowerCase()}
                  <span className="ml-1 opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sub Tabs Akademik */}
        {currentMain === "AKADEMIK" && (
          <div className="flex gap-2">
            {AKADEMIK_SUBS.map((sub) => {
              const fullValue = `AKADEMIK_${sub}`;
              const count = sub === "SEMUA"
                ? exams.filter(e => e.examType === "AKADEMIK").length
                : exams.filter(e => e.examType === "AKADEMIK" && e.akademikCategory === sub).length;
              return (
                <button
                  key={sub}
                  onClick={() => setFilterMode(fullValue)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 border ${filterMode === fullValue
                    ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                >
                  {AKADEMIK_LABELS[sub]}
                  <span className="ml-1 opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sub Tabs Psikotest TNI */}
        {currentMain === "PSIKOTEST_TNI" && (
          <div className="flex gap-2 flex-wrap">
            {TNI_SUBS.map((sub) => {
              const fullValue = `PSIKOTEST_TNI_${sub}`;
              const count = sub === "SEMUA"
                ? exams.filter(e => e.examType === "PSIKOTEST_TNI").length
                : exams.filter(e => e.examType === "PSIKOTEST_TNI" && e.psikotestCategory === sub).length;
              return (
                <button
                  key={sub}
                  onClick={() => setFilterMode(fullValue)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 border ${filterMode === fullValue
                    ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                >
                  {TNI_LABELS[sub]}
                  <span className="ml-1 opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {currentExams.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <IconInbox />
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

              {/* Badges - Absolute positioned for both mobile and desktop */}
              <div className="absolute top-6 right-6 flex flex-col md:flex-row items-end md:items-center gap-2">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${exam.isPremium ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 border border-gray-200"
                  }`}>
                  {exam.isPremium ? "Premier" : "Free"}
                </span>
                {isDone && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 shrink-0">
                    ✓ Selesai
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-start md:items-center gap-0 md:gap-4 mb-4">
                  {/* Desktop Icon - Hidden on mobile */}
                  <div className="hidden md:flex w-12 h-12 rounded-xl items-center justify-center shrink-0 bg-blue-50">
                    <IconFileText />
                  </div>

                  <div className="flex-1 pr-20 md:pr-28">
                    <h2 className="text-lg font-bold text-gray-900">{exam.title}</h2>
                    {/* Sub-label */}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${exam.examType === "PSIKOTEST_TNI"
                          ? "bg-green-50 text-green-700 font-bold border border-green-200"
                          : "bg-blue-50 text-blue-500"
                        }`}>
                        {exam.examType === "PSIKOTEST_TNI" ? "PSIKOTEST TNI" : exam.examType}
                      </span>
                      {exam.examType === "SKD" && (
                        <span className="text-xs text-gray-400">
                          · {exam.skdCategory ?? "Gabungan"}
                        </span>
                      )}
                      {exam.examType === "PSIKOTEST" && exam.psikotestCategory && (
                        <span className="text-xs text-gray-400">
                          · {exam.psikotestCategory.split(/[\s_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}
                        </span>
                      )}
                      {exam.examType === "PSIKOTEST_TNI" && exam.psikotestCategory && (
                        <span className="text-xs text-gray-400">
                          · {TNI_LABELS[exam.psikotestCategory] ?? exam.psikotestCategory.replace(/_/g, " ")}
                        </span>
                      )}
                      {exam.examType === "AKADEMIK" && exam.akademikCategory && (
                        <span className="text-xs text-gray-400">
                          · {AKADEMIK_LABELS[exam.akademikCategory] ?? exam.akademikCategory.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    {isDone && exam.psikotestCategory !== "PAULI" && (
                      <p className="text-sm text-green-600 font-semibold mt-3">Skor kamu: {score}</p>
                    )}
                  </div>
                </div>

                <div className="w-full h-px bg-gray-100 my-3" />

                <div className="flex items-center gap-6 mb-5">
                  <div className="flex items-center gap-2">
                    <IconClock className="w-5 h-5 text-gray-400 hidden md:block" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{exam.duration} mins</p>
                      <p className="text-xs text-gray-400">Duration</p>
                    </div>
                  </div>
                  {exam.psikotestCategory !== "PAULI" && (
                    <div className="flex items-center gap-2">
                      <IconMessageSquare className="w-5 h-5 text-gray-400 hidden md:block" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{exam._count.questions}</p>
                        <p className="text-xs text-gray-400">Questions</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Button */}
              <div className="mt-auto">
                {isDone ? (
                  <span className="block w-full text-center bg-gray-100 text-gray-500 text-sm font-semibold py-3 rounded-xl cursor-not-allowed">
                    Sudah Dikerjakan
                  </span>
                ) : isPremiumLocked ? (
                  <span className="flex items-center justify-center gap-2 w-full bg-yellow-50 border border-yellow-200 text-yellow-600 text-sm font-semibold py-3 rounded-xl cursor-not-allowed">
                    <IconLock className="w-5 h-5 text-yellow-600 hidden md:block" /> Khusus Member Premium
                  </span>
                ) : (
                  <button
                    onClick={() => handleStartTest(exam)}
                    className="block w-full text-center text-white text-sm font-semibold py-3 rounded-xl transition-colors bg-blue-500 hover:bg-blue-600"
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
        <div className="mt-10 bg-blue-500 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-white text-xl font-bold mb-1">Kuasai Masa Depan Anda dengan Pembelajaran Terbimbing.</h3>
            <p className="text-blue-100 text-sm">Bergabung dengan ribuan siswa dan raih hasil terbaikmu.</p>
          </div>
          <Link href="/#contact"
            className="w-full md:w-auto text-center bg-white text-blue-500 text-sm font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shrink-0">
            Explore Membership
          </Link>
        </div>
      )}
    </div>
  );
}