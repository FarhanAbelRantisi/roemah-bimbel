"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const IconAlertTriangle = ({ className = "shrink-0 mt-0.5" }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>);
const IconLock = ({ className = "shrink-0 mt-0.5" }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const IconFlag = ({ className = "w-4 h-4" }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>);

type Category = "TWK" | "TIU" | "TKP";
type ExamType = "SKD" | "PSIKOTEST" | "AKADEMIK" | "PSIKOTEST_TNI";

interface Question {
  id: string;
  category: Category;
  subCategory?: string;
  content: string;
  imageUrl?: string;
  orderNum: number;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  aspect?: string;
  correctOption?: string;
  correctOption2?: string;
  scoreA?: number;
  scoreB?: number;
  scoreC?: number;
  scoreD?: number;
  scoreE?: number;
}

interface Answer {
  questionId: string;
  selected: string | null;
  selected2: string | null;
  isFlagged: boolean;
  question: Question;
}

interface Attempt {
  id: string;
  examId: string;
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
  finishedAt: string | null;
}

const OPTIONS = ["A", "B", "C", "D", "E"] as const;

export default function ExamPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [shuffledAnswers, setShuffledAnswers] = useState<Answer[]>([]);
  // Menyimpan mapping: questionId -> { newKey -> originalKey }
  const [optionMapping, setOptionMapping] = useState<Record<string, Record<string, string>>>({});
  const attemptId = attempt?.id;
  const [tabWarning, setTabWarning] = useState(0); // jumlah pelanggaran
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const MAX_VIOLATIONS = 5;
  const [isBlurred, setIsBlurred] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const violationCooldownRef = useRef(false);
  const [examType, setExamType] = useState<ExamType>("SKD");
  const [selected2Map, setSelected2Map] = useState<Record<string, string | null>>({});

  const shuffledAnswersRef = useRef<Answer[]>([]);
  const selected2MapRef = useRef<Record<string, string | null>>({});

  useEffect(() => { shuffledAnswersRef.current = shuffledAnswers; }, [shuffledAnswers]);
  useEffect(() => { selected2MapRef.current = selected2Map; }, [selected2Map]);

  const showError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  }, []);

  const handleFinish = useCallback(async (auto = false) => {
    if (!attemptId) return;

    if (!auto) {
      const unansweredCount = shuffledAnswersRef.current.filter(
        (a) => !a.selected && !selected2MapRef.current[a.questionId]
      ).length;

      let confirmMsg = "Yakin ingin menyelesaikan ujian?";
      if (unansweredCount > 0) {
        confirmMsg = `Masih ada ${unansweredCount} soal yang belum dijawab.\n\n${confirmMsg}`;
      }

      if (!confirm(confirmMsg)) return;
    }

    setFinishing(true);
    clearInterval(timerRef.current!);

    const res = await fetch(`/api/attempts/${attemptId}/finish`, { method: "POST" });
    const data = await res.json();

    if (res.ok) {
      router.push(`/exam/${id}/result?attemptId=${attemptId}`);
    } else {
      alert(data.error);
      setFinishing(false);
    }
  }, [attemptId, id, router]);

  const triggerScreenshotViolation = useCallback(() => {
    navigator.clipboard?.writeText("").catch(() => { });
    setTabWarning((prev) => {
      const next = prev + 1;
      if (next >= MAX_VIOLATIONS) {
        setWarningMsg("Kamu telah melakukan pelanggaran sebanyak 3 kali. Ujian akan otomatis diselesaikan.");
        setShowWarning(true);
        setTimeout(() => { handleFinish(true); }, 3000);
      } else {
        setWarningMsg(`⚠️ Peringatan ${next}/${MAX_VIOLATIONS}: Screenshot terdeteksi! Dilarang mengambil screenshot selama ujian!`);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 4000);
      }
      return next;
    });
  }, [handleFinish]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Ujian sedang berlangsung. Keluar akan merugikan waktu Anda.";
      return e.returnValue;
    };

    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState(null, "", window.location.href);
      if (!confirm("Ujian sedang berlangsung. Apakah Anda yakin ingin keluar?")) {
      } else {
        router.back();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  function seededShuffle<T>(array: T[], seed: string): T[] {
    const arr = [...array];
    // Fungsi sederhana untuk menghasilkan angka acak berdasarkan string seed
    const seedNum = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

    let m = arr.length, t, i;
    while (m) {
      // Algoritma deterministik berdasarkan seed
      i = Math.floor(Math.abs(Math.sin(seedNum + m)) * m--);
      t = arr[m];
      arr[m] = arr[i];
      arr[i] = t;
    }
    return arr;
  }

  function shuffleOptions(answer: Answer, seed: string): { answer: Answer; mapping: Record<string, string> } {
    const options = OPTIONS.map((opt) => ({
      originalKey: opt,
      text: answer.question[`option${opt}` as keyof Question] as string,
      score: answer.question[`score${opt}` as keyof Question] as number | undefined,
    }));

    // Ganti shuffleArray dengan seededShuffle agar urutan A-E konsisten saat refresh
    const shuffled = seededShuffle(options, seed);

    const newQuestion = { ...answer.question };
    const mapping: Record<string, string> = {};

    shuffled.forEach((item, idx) => {
      const newKey = OPTIONS[idx];
      (newQuestion as Record<string, unknown>)[`option${newKey}`] = item.text;
      (newQuestion as Record<string, unknown>)[`score${newKey}`] = item.score;
      mapping[newKey] = item.originalKey;
    });

    const correctOriginalKey = answer.question.correctOption;
    const newCorrectIdx = shuffled.findIndex((item) => item.originalKey === correctOriginalKey);
    if (newCorrectIdx !== -1) {
      newQuestion.correctOption = OPTIONS[newCorrectIdx];
    }

    return { answer: { ...answer, question: newQuestion }, mapping };
  }

  // Mulai ujian
  useEffect(() => {
    if (status !== "authenticated") return;

    const startExam = async () => {
      try {
        const res = await fetch(`/api/exams/${id}/start`, { method: "POST" });
        const data = await res.json();

        if (!res.ok) {
          if (data.error === "PREMIUM_REQUIRED") router.push(`/catalog?premium=true`);
          else { alert(data.error); router.push("/catalog"); }
          return;
        }

        const attemptRes = await fetch(`/api/attempts/${data.attemptId}`);
        const attemptData = await attemptRes.json();
        const seed = attemptData.id;
        const type: ExamType = attemptData.exam.examType ?? "SKD";
        setExamType(type);

        let randomized: Answer[] = [];

        if (type === "SKD") {
          const skdCat = attemptData.exam.skdCategory as string | null;
          const twk = attemptData.answers.filter((a: Answer) => a.question.category === "TWK");
          const tiu = attemptData.answers.filter((a: Answer) => a.question.category === "TIU");
          const tkp = attemptData.answers.filter((a: Answer) => a.question.category === "TKP");

          if (skdCat === "TWK") {
            randomized = seededShuffle<Answer>(twk, seed + "twk");
          } else if (skdCat === "TIU") {
            randomized = seededShuffle<Answer>(tiu, seed + "tiu");
          } else if (skdCat === "TKP") {
            randomized = seededShuffle<Answer>(tkp, seed + "tkp");
          } else {
            // Gabungan
            randomized = [
              ...seededShuffle<Answer>(twk, seed + "twk"),
              ...seededShuffle<Answer>(tiu, seed + "tiu"),
              ...seededShuffle<Answer>(tkp, seed + "tkp"),
            ];
          }
        } else if (type === "PSIKOTEST") {
          // Psikotest: shuffle per subCategory
          const config = attemptData.exam.psikotestConfig
            ? JSON.parse(attemptData.exam.psikotestConfig) as Record<string, number>
            : {};
          const subCats = Object.keys(config);
          for (const sub of subCats) {
            const group = attemptData.answers.filter((a: Answer) => a.question.subCategory === sub);
            randomized.push(...seededShuffle<Answer>(group, seed + sub));
          }
          // Kalau subCats kosong (single kategori), shuffle semua
          if (randomized.length === 0) {
            randomized = seededShuffle<Answer>(attemptData.answers, seed);
          }
        } else {
          randomized = seededShuffle<Answer>([...attemptData.answers], seed);
        }

        const newMapping: Record<string, Record<string, string>> = {};

        const withShuffledOptions = randomized.map((a: Answer) => {
          const optionSeed = `${attemptData.id}-${a.questionId}`;
          const { answer, mapping } = shuffleOptions(a, optionSeed);

          const reverseMapping: Record<string, string> = {};
          Object.entries(mapping).forEach(([newKey, originalKey]) => {
            reverseMapping[originalKey] = newKey;
          });

          // Translasi Jawaban 1 ke posisi acaknya
          let displaySelected = a.selected;
          if (a.selected && reverseMapping[a.selected]) {
            displaySelected = reverseMapping[a.selected];
          }

          // Translasi Jawaban 2 ke posisi acaknya
          let displaySelected2 = a.selected2;
          if (a.selected2 && reverseMapping[a.selected2]) {
            displaySelected2 = reverseMapping[a.selected2];
          }

          newMapping[a.questionId] = mapping;

          // Jangan lupa sisipkan selected2 di return
          return { ...answer, selected: displaySelected, selected2: displaySelected2 };
        });

        // Ambil selected2Map dari data yang SUDAH ditranslasi
        const s2Map: Record<string, string | null> = {};
        withShuffledOptions.forEach((a: Answer) => {
          s2Map[a.questionId] = a.selected2 ?? null;
        });

        // Set semua state
        setSelected2Map(s2Map);
        setAttempt(attemptData);
        setShuffledAnswers(withShuffledOptions);
        setOptionMapping(newMapping);

        if (typeof attemptData.remainingTime === "number") {
          setTimeLeft(attemptData.remainingTime);
        } else {
          setTimeLeft(attemptData.exam.duration * 60);
        }

        setLoading(false);
      } catch (error) {
        console.error("Exam start error:", error);
        alert("Gagal memuat ujian. Silakan coba lagi.");
        router.push("/catalog");
      }
    };

    startExam();
  }, [id, status, router]);

  // Timer countdown
  useEffect(() => {
    if (!attempt || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleFinish(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [attempt]);

  useEffect(() => {
    if (!attempt) return;

    // ===== ANTI SELECT =====
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    const triggerViolation = (reason: string) => {
      // Guard: jika violation baru saja terpanggil dalam 1 detik, skip
      if (violationCooldownRef.current) return;
      violationCooldownRef.current = true;
      setTimeout(() => { violationCooldownRef.current = false; }, 1000);

      setIsBlurred(true);

      setTabWarning((prev) => {
        const next = prev + 1;

        if (next >= MAX_VIOLATIONS) {
          setWarningMsg(
            "Kamu telah melakukan pelanggaran sebanyak 3 kali. Ujian akan otomatis diselesaikan."
          );
          setShowWarning(true);
          setTimeout(() => { handleFinish(true); }, 3000);
        } else {
          setWarningMsg(
            `⚠️ Peringatan ${next}/${MAX_VIOLATIONS}: ${reason}`
          );
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 4000);
        }

        return next;
      });
    };

    const handleWindowBlur = () => {
      triggerViolation("Dilarang meninggalkan halaman ujian!");
    };

    const handleWindowFocus = () => {
      setTimeout(() => { setIsBlurred(false); }, 800);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation("Dilarang berpindah tab atau minimize browser!");
      } else {
        setTimeout(() => { setIsBlurred(false); }, 800);
      }
    };

    // ===== DISABLE RIGHT CLICK =====
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // ===== KEYBOARD PROTECTION =====
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        triggerScreenshotViolation(); // <- panggil violation, bukan cuma warning
      }
      if (
        (e.ctrlKey && (e.key === "p" || e.key === "s")) ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") ||
        e.key === "F12"
      ) {
        e.preventDefault();
      }
    };

    // ===== DETEKSI SCREEN CAPTURE API =====
    const detectScreenCapture = async () => {
      try {
        // Ini hanya bisa deteksi kalau user menggunakan getDisplayMedia (screen share browser)
        // Tidak bisa deteksi software screenshot eksternal
        const originalGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia?.bind(navigator.mediaDevices);
        if (originalGetDisplayMedia) {
          navigator.mediaDevices.getDisplayMedia = async (constraints) => {
            const stream = await originalGetDisplayMedia(constraints);
            mediaStreamRef.current = stream;
            triggerScreenshotViolation();
            // Stop stream langsung
            stream.getTracks().forEach((track) => track.stop());
            throw new Error("Screen capture tidak diizinkan selama ujian.");
          };
        }
      } catch {
        // Tidak semua browser support, abaikan
      }
    };

    detectScreenCapture();

    // Tambahkan ke cleanup:
    // Sudah handled karena getDisplayMedia di-override, tidak perlu removeEventListener

    // ===== OPTIONAL: BLOCK COPY =====
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    // ===== REGISTER EVENTS =====
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopy);

    // ===== CLEANUP =====
    return () => {
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";

      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
    };
  }, [attempt, handleFinish]);

  const handleAnswer = async (selected: string) => {
    if (!attempt || !attemptId || !shuffledAnswers.length) return;

    const currentAnswer = shuffledAnswers[currentIdx];
    const currentQuestion = currentAnswer.question;

    const hasDualAnswer = examType === "PSIKOTEST" && !!currentQuestion.correctOption2;

    // FIX: Bolehkan toggle off untuk SEMUA tipe soal (1 jawaban maupun 2 jawaban)
    let newSelected: string | null = selected;
    if (currentAnswer.selected === selected) {
      newSelected = null;
    }

    const originalKey = newSelected
      ? (optionMapping[currentAnswer.questionId]?.[newSelected] ?? newSelected)
      : null;

    // SAVE PREVIOUS STATE FOR REVERT
    const previousSelected = currentAnswer.selected;
    const previousSelected2 = selected2Map[currentAnswer.questionId];

    // Update UI optimistically
    setShuffledAnswers((prev) => {
      const next = [...prev];
      next[currentIdx] = { ...next[currentIdx], selected: newSelected };
      return next;
    });

    // --- SUSUN DATA API ---
    const payload: any = {
      questionId: currentAnswer.questionId,
      selected: originalKey,
    };

    // PENCEGAHAN BUG: Jika ini soal 1 Jawaban, PAKSA hapus selected2
    if (!hasDualAnswer) {
      payload.selected2 = null;
      setSelected2Map((prev) => ({ ...prev, [currentAnswer.questionId]: null }));
    }
    // ----------------------

    try {
      const res = await fetch(`/api/attempts/${attemptId}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save answer");
      }
    } catch (error) {
      console.error("Save answer error:", error);
      showError("Gagal menyimpan jawaban. Periksa koneksi internet Anda lalu coba lagi.");

      // Revert UI if failed
      setShuffledAnswers((prev) => {
        const next = [...prev];
        next[currentIdx] = { ...next[currentIdx], selected: previousSelected };
        return next;
      });
      if (!hasDualAnswer) {
        setSelected2Map((prev) => ({ ...prev, [currentAnswer.questionId]: previousSelected2 ?? null }));
      }
    }
  };

  const handleAnswer2 = async (opt: string) => {
    if (!attempt || !attemptId || examType !== "PSIKOTEST") return;

    const currentAnswer = shuffledAnswers[currentIdx];
    const isAlreadySelected = selected2Map[currentAnswer.questionId] === opt;
    const newSelected2 = isAlreadySelected ? null : opt;
    const newOriginalKey2 = newSelected2
      ? (optionMapping[currentAnswer.questionId]?.[newSelected2] ?? newSelected2)
      : null;

    const previousSelected2 = selected2Map[currentAnswer.questionId];

    setSelected2Map((prev) => ({ ...prev, [currentAnswer.questionId]: newSelected2 }));

    try {
      const res = await fetch(`/api/attempts/${attemptId}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentAnswer.questionId,
          selected2: newOriginalKey2,
        }),
      });

      if (!res.ok) throw new Error("Failed to save answer");
    } catch (error) {
      console.error("Save answer 2 error:", error);
      showError("Gagal menyimpan jawaban. Periksa koneksi internet Anda lalu coba lagi.");
      setSelected2Map((prev) => ({ ...prev, [currentAnswer.questionId]: previousSelected2 ?? null }));
    }
  };

  const handleFlag = async () => {
    if (!attempt || !attemptId || !shuffledAnswers.length) return;

    const currentAnswer = shuffledAnswers[currentIdx];
    const newFlagged = !currentAnswer.isFlagged;

    setShuffledAnswers((prev) => {
      const next = [...prev];
      next[currentIdx] = { ...next[currentIdx], isFlagged: newFlagged };
      return next;
    });

    setAttempt((prev) => {
      if (!prev) return prev;
      const newAnswers = prev.answers.map((a) =>
        a.questionId === currentAnswer.questionId ? { ...a, isFlagged: newFlagged } : a
      );
      return { ...prev, answers: newAnswers };
    });

    try {
      const res = await fetch(`/api/attempts/${attemptId}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentAnswer.questionId,
          isFlagged: newFlagged,
        }),
      });

      if (!res.ok) throw new Error("Failed to update flag");
    } catch (error) {
      console.error("Flag error:", error);
      showError("Gagal menandai ragu-ragu. Periksa koneksi internet Anda lalu coba lagi.");

      // Revert UI
      setShuffledAnswers((prev) => {
        const next = [...prev];
        next[currentIdx] = { ...next[currentIdx], isFlagged: !newFlagged };
        return next;
      });
      setAttempt((prev) => {
        if (!prev) return prev;
        const newAnswers = prev.answers.map((a) =>
          a.questionId === currentAnswer.questionId ? { ...a, isFlagged: !newFlagged } : a
        );
        return { ...prev, answers: newAnswers };
      });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getStatus = (answer: Answer, idx: number) => {
    if (idx === currentIdx) return "current";
    if (answer.isFlagged) return "flagged";
    if (answer.selected) return "answered";
    return "unanswered";
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Mempersiapkan ujian...</p>
        </div>
      </div>
    );
  }

  if (!attempt) return null;

  const currentAnswer = shuffledAnswers[currentIdx];
  const currentQuestion = currentAnswer?.question;

  return (
    <div className="min-h-screen bg-gray-50 exam-active" style={{ position: "relative" }}>

      {/* ===== BLUR OVERLAY SAAT WINDOW TIDAK FOKUS ===== */}
      {isBlurred && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9997,
            backdropFilter: "blur(20px)",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <IconLock className="w-16 h-16 text-white mb-4" />
          <p style={{ color: "white", fontWeight: "700", fontSize: "20px" }}>
            Ujian Terkunci
          </p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>
            Kembali ke halaman ini untuk melanjutkan ujian
          </p>
        </div>
      )}
      {/* ===== ERROR TOAST ===== */}
      {errorMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[999] bg-red-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in-down">
          <IconAlertTriangle className="text-xl shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
          <button onClick={() => setErrorMsg("")} className="ml-2 font-bold opacity-70 hover:opacity-100 text-white p-1">
            ✕
          </button>
        </div>
      )}

      {/* ===== WARNING TOAST ===== */}
      {showWarning && tabWarning < MAX_VIOLATIONS && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] animate-bounce">
          <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md">
            <IconAlertTriangle className="text-2xl shrink-0 text-yellow-500" />
            <div>
              <p className="font-bold text-sm">Pelanggaran Terdeteksi!</p>
              <p className="text-xs text-red-100 mt-0.5">{warningMsg}</p>
            </div>
            <div className="ml-auto shrink-0 bg-red-500 rounded-full w-8 h-8 flex items-center justify-center font-bold">
              {MAX_VIOLATIONS - tabWarning}
            </div>
          </div>
        </div>
      )}

      {/* ===== AUTO FINISH MODAL ===== */}
      {showWarning && tabWarning >= MAX_VIOLATIONS && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl">
            <IconAlertTriangle className="text-6xl text-red-500 mb-4 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ujian Dihentikan</h2>
            <p className="text-gray-500 text-sm mb-4">{warningMsg}</p>
            <div className="flex items-center justify-center gap-2 text-red-500">
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Menyelesaikan ujian...</span>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between lg:justify-end gap-3 sticky top-0 z-50">
        <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full lg:w-auto justify-between lg:justify-end">
          {/* Indikator pelanggaran */}
          {tabWarning > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
              <span className="text-red-500 text-xs font-semibold">Pelanggaran:</span>
              <div className="flex gap-1">
                {Array.from({ length: MAX_VIOLATIONS }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${i < tabWarning ? "bg-red-500" : "bg-gray-200"
                      }`}
                  />
                ))}
              </div>
              <span className="text-red-500 text-xs font-semibold">
                {tabWarning}/{MAX_VIOLATIONS}
              </span>
            </div>
          )}

          <span className="text-sm text-gray-500">
            Candidate ID: <span className="font-semibold text-gray-800">{session?.user?.name}</span>
          </span>
          <button
            onClick={() => handleFinish(false)}
            disabled={finishing}
            className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 uppercase tracking-wide"
          >
            {finishing ? "Memproses..." : "Finish Exam"}
          </button>
        </div>
      </header>

      <div className="flex flex-col landscape:flex-row lg:flex-row h-auto landscape:h-[calc(100vh-57px)] lg:h-[calc(100vh-57px)] min-h-[calc(100vh-57px)]">
        {/* Main Content */}
        <div className="flex-1 landscape:overflow-y-auto lg:overflow-y-auto p-4 md:p-8 order-2 landscape:order-1 lg:order-1">
          {/* Question Header */}
          <div className="mb-6">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">
              Question {currentIdx + 1} of {shuffledAnswers.length}
            </p>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                {examType === "SKD" && (
                  <>
                    {currentQuestion.category} — {
                      currentQuestion.category === "TWK" ? "Tes Wawasan Kebangsaan" :
                        currentQuestion.category === "TIU" ? "Tes Intelegensia Umum" :
                          "Tes Karakteristik Pribadi"
                    }
                    {currentQuestion.category === "TKP" && currentQuestion.aspect && (
                      <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg">
                        {currentQuestion.aspect}
                      </span>
                    )}
                  </>
                )}
                {examType === "PSIKOTEST" && (
                  <>
                    Psikotest
                    {currentQuestion.subCategory && (
                      <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg">
                        {currentQuestion.subCategory}
                      </span>
                    )}
                  </>
                )}
                {examType === "AKADEMIK" && (
                  <>
                    Akademik
                    {attempt.exam.akademikCategory && (
                      <span className="text-sm font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">
                        {attempt.exam.akademikCategory.replace(/_/g, " ")}
                      </span>
                    )}
                  </>
                )}
              </h2>
              <span className="text-sm text-gray-500 shrink-0">
                {examType === "SKD"
                  ? (currentQuestion.category !== "TKP" ? "+5 | -0" : "Gradasi 1-5")
                  : examType === "PSIKOTEST"
                  // ? (currentQuestion.correctOption2 ? "2 Jawaban Benar" : "+1 | -0")
                  // : "+1 | -0"
                }
              </span>
            </div>
          </div>

          {/* Question Content */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <p className="text-gray-800 text-base leading-relaxed mb-4">
              {currentQuestion.content}
            </p>
            {currentQuestion.imageUrl && (
              <img
                src={currentQuestion.imageUrl}
                alt="Gambar soal"
                className="max-h-60 object-contain rounded-xl border border-gray-100 bg-gray-50 mb-4"
              />
            )}
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3 mb-8">

            {OPTIONS.map((opt) => {
              const optionText = currentQuestion[`option${opt}` as keyof Question] as string;
              const isFirst = currentAnswer.selected === opt;
              const isSecond = examType === "PSIKOTEST" && selected2Map[currentAnswer.questionId] === opt;
              const hasDualAnswer = examType === "PSIKOTEST" && currentQuestion.correctOption2 !== undefined;

              return (
                <button
                  key={opt}
                  onClick={() => {
                    if (!hasDualAnswer) {
                      handleAnswer(opt);
                      return;
                    }

                    if (isFirst) {
                      // Deselect jawaban 1
                      handleAnswer(opt); // toggle off — perlu update handleAnswer untuk support toggle
                    } else if (isSecond) {
                      // Deselect jawaban 2
                      handleAnswer2(opt); // toggle off
                    } else if (!currentAnswer.selected) {
                      // Belum ada jawaban 1, set jawaban 1
                      handleAnswer(opt);
                    } else {
                      // Sudah ada jawaban 1, set jawaban 2
                      handleAnswer2(opt);
                    }
                  }}
                  className={`flex items-center gap-4 w-full text-left px-5 py-4 rounded-xl border-2 transition-all ${isFirst
                      ? "border-blue-500 bg-blue-50"
                      : isSecond
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50"
                    }`}
                >
                  <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 ${isFirst ? "border-blue-500 bg-blue-500 text-white" :
                      isSecond ? "border-green-500 bg-green-500 text-white" :
                        "border-gray-300 text-gray-500"
                    }`}>
                    {opt}
                  </span>
                  <span className={`text-sm flex-1 ${isFirst ? "text-blue-700 font-medium" :
                      isSecond ? "text-blue-700 font-medium" :
                        "text-gray-700"
                    }`}>
                    {optionText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>

            <button
              onClick={handleFlag}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors ${currentAnswer.isFlagged
                  ? "bg-orange-50 border-orange-300 text-orange-600"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-orange-50"
                }`}
            >
              <IconFlag className="mr-1 w-4 h-4" /> {currentAnswer.isFlagged ? "Flagged" : "Flag for Review"}
            </button>

            <button
              onClick={() => setCurrentIdx((i) => Math.min(shuffledAnswers.length - 1, i + 1))}
              disabled={currentIdx === shuffledAnswers.length - 1}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Save & Next →
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full landscape:w-48 lg:w-72 bg-white border-b landscape:border-b-0 lg:border-b-0 landscape:border-l lg:border-l border-gray-200 p-4 lg:p-5 landscape:overflow-y-auto lg:overflow-y-auto flex flex-col gap-4 lg:gap-5 order-1 landscape:order-2 lg:order-2 shrink-0">
          {/* Timer */}
          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Time Remaining</p>
            <p className={`text-4xl font-bold tabular-nums ${timeLeft < 300 ? "text-red-500" : "text-gray-900"}`}>
              {formatTime(timeLeft)}
            </p>
          </div>

          {/* Question Palette */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Question Palette</p>
              <span className="text-xs text-gray-400">{shuffledAnswers.length} Total</span>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-10 landscape:grid-cols-3 lg:grid-cols-5 gap-1.5 max-h-32 landscape:max-h-none lg:max-h-none overflow-y-auto landscape:overflow-y-visible lg:overflow-y-visible pr-2 landscape:pr-0 lg:pr-0">
              {shuffledAnswers.map((ans, idx) => {
                const s = getStatus(ans, idx);
                return (
                  <button
                    key={ans.questionId}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-full aspect-square rounded-lg text-xs font-semibold transition-colors ${s === "current"
                        ? "bg-white border-2 border-blue-500 text-blue-500"
                        : s === "answered"
                          ? "bg-blue-500 text-white"
                          : s === "flagged"
                            ? "bg-orange-400 text-white"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2">
            {[
              { color: "bg-blue-500", label: "Answered" },
              { color: "bg-orange-400", label: "Flagged" },
              { color: "bg-gray-100 border border-gray-200", label: "Unanswered" },
              { color: "bg-white border-2 border-blue-500", label: "Current" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${item.color}`} />
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>

          {/* User */}
          <div className="mt-auto flex items-center gap-3 pt-4 border-t border-gray-200">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-500">
              {session?.user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{session?.user?.name}</p>
              <p className="text-xs text-gray-400 uppercase">Candidate</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}