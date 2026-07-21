"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { digitAt } from "@/lib/pauli-engine";

interface PauliExamViewProps {
  attemptId: string;
  durationMinutes: number;
  psikotestConfig?: string;
  candidateName?: string;
  onFinish: () => void;
}

const IconLock = ({ className = "w-16 h-16 text-white mb-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

const IconAlertTriangle = ({ className = "text-2xl shrink-0 text-yellow-500" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);

export default function PauliExamView({
  attemptId,
  durationMinutes,
  psikotestConfig,
  candidateName = "Peserta",
  onFinish,
}: PauliExamViewProps) {
  // Parse config
  let signalIntervalSec = 180; // default 3 menit
  if (psikotestConfig) {
    try {
      const cfg = JSON.parse(psikotestConfig);
      if (cfg.signal_interval_sec) signalIntervalSec = Number(cfg.signal_interval_sec);
    } catch {}
  }

  const totalDurationSec = durationMinutes * 60;
  const totalColumns = Math.max(1, Math.floor(totalDurationSec / signalIntervalSec));

  // State
  const [kolomIndex, setKolomIndex] = useState(0);
  const [posisiIndex, setPosisiIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  // Violations & Security
  const MAX_VIOLATIONS = 5;
  const [tabWarning, setTabWarning] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState("");
  const [isBlurred, setIsBlurred] = useState(false);
  const violationCooldownRef = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Derive seed from attemptId
  const seed = useRef<number>(
    attemptId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ).current;

  // Timers in Ref to prevent interval resets
  const kolomTimeLeftRef = useRef(signalIntervalSec);
  const totalTimeLeftRef = useRef(totalDurationSec);

  // Refs for current values in callbacks
  const kolomIndexRef = useRef(kolomIndex);
  const answersMapRef = useRef(answersMap);
  const isSubmittingRef = useRef(isSubmitting);
  const onFinishRef = useRef(onFinish);

  useEffect(() => { kolomIndexRef.current = kolomIndex; }, [kolomIndex]);
  useEffect(() => { answersMapRef.current = answersMap; }, [answersMap]);
  useEffect(() => { isSubmittingRef.current = isSubmitting; }, [isSubmitting]);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  // Submit column result to API
  const saveColumnResult = useCallback(async (kIdx: number, dikerjakan: number, benar: number) => {
    try {
      await fetch(`/api/attempts/${attemptId}/pauli-column`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kolomIndex: kIdx,
          jumlahDikerjakan: dikerjakan,
          jumlahBenar: benar,
        }),
      });
    } catch (e) {
      console.error("Gagal menyimpan progress kolom Pauli:", e);
    }
  }, [attemptId]);

  // Pindah ke kolom berikutnya
  const nextColumn = useCallback(async () => {
    if (isSubmittingRef.current) return;
    setIsSubmitting(true);

    const currentK = kolomIndexRef.current;
    const currentMap = answersMapRef.current;

    const dikerjakan = Object.keys(currentMap).length;
    let benar = 0;
    for (const [pStr, val] of Object.entries(currentMap)) {
      const p = Number(pStr);
      const dA = digitAt(seed, currentK, p, 0, 9);
      const dB = digitAt(seed, currentK, p + 1, 0, 9);
      if ((dA + dB) % 10 === val) {
        benar++;
      }
    }

    await saveColumnResult(currentK, dikerjakan, benar);

    if (currentK + 1 >= totalColumns) {
      onFinishRef.current();
    } else {
      setKolomIndex(currentK + 1);
      setPosisiIndex(0);
      setAnswersMap({});
      kolomTimeLeftRef.current = signalIntervalSec;
      setFlashMessage(`Garis! Pindah ke Kolom Berikutnya`);
      setTimeout(() => setFlashMessage(null), 2500);
    }
    setIsSubmitting(false);
  }, [saveColumnResult, seed, signalIntervalSec, totalColumns]);

  const nextColumnRef = useRef(nextColumn);
  useEffect(() => { nextColumnRef.current = nextColumn; }, [nextColumn]);

  // Background Timers (silent execution)
  useEffect(() => {
    const timer = setInterval(() => {
      totalTimeLeftRef.current -= 1;
      kolomTimeLeftRef.current -= 1;

      if (kolomTimeLeftRef.current <= 0) {
        kolomTimeLeftRef.current = signalIntervalSec;
        nextColumnRef.current();
      } else if (totalTimeLeftRef.current <= 0) {
        clearInterval(timer);
        nextColumnRef.current().then(() => {
          onFinishRef.current();
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [signalIntervalSec]);

  // Violation Protection Effects
  useEffect(() => {
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    const triggerViolation = (reason: string) => {
      if (violationCooldownRef.current) return;
      violationCooldownRef.current = true;
      setTimeout(() => { violationCooldownRef.current = false; }, 1000);

      setIsBlurred(true);

      setTabWarning((prev) => {
        const next = prev + 1;
        if (next >= MAX_VIOLATIONS) {
          setWarningMsg("Kamu telah melakukan pelanggaran batas maksimum. Ujian akan otomatis diselesaikan.");
          setShowWarning(true);
          setTimeout(() => {
            nextColumnRef.current().then(() => {
              onFinishRef.current();
            });
          }, 3000);
        } else {
          setWarningMsg(`Peringatan ${next}/${MAX_VIOLATIONS}: ${reason}`);
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 4000);
        }
        return next;
      });
    };

    const triggerScreenshotViolation = () => {
      triggerViolation("Dilarang melakukan screenshot atau screen recording saat ujian!");
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

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDownViolation = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        triggerScreenshotViolation();
      }
      if (
        (e.ctrlKey && (e.key === "p" || e.key === "s")) ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") ||
        e.key === "F12"
      ) {
        e.preventDefault();
      }
    };

    const detectScreenCapture = async () => {
      try {
        const originalGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia?.bind(navigator.mediaDevices);
        if (originalGetDisplayMedia) {
          navigator.mediaDevices.getDisplayMedia = async (constraints) => {
            const stream = await originalGetDisplayMedia(constraints);
            mediaStreamRef.current = stream;
            triggerScreenshotViolation();
            stream.getTracks().forEach((track) => track.stop());
            throw new Error("Screen capture tidak diizinkan selama ujian.");
          };
        }
      } catch {}
    };

    detectScreenCapture();

    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDownViolation);

    return () => {
      document.body.style.userSelect = "auto";
      document.body.style.webkitUserSelect = "auto";
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDownViolation);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Input Digit
  const handleDigitInput = useCallback((inputVal: number) => {
    setAnswersMap((prev) => ({
      ...prev,
      [posisiIndex]: inputVal,
    }));
    setPosisiIndex((prev) => prev + 1);
  }, [posisiIndex]);

  // Navigasi Atas/Bawah
  const handleMoveUp = useCallback(() => {
    setPosisiIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleMoveDown = useCallback(() => {
    setPosisiIndex((prev) => prev + 1);
  }, []);

  // Keydown listener for digits & movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleDigitInput(parseInt(e.key, 10));
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        handleMoveUp();
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleMoveDown();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigitInput, handleMoveUp, handleMoveDown]);

  // Centered view rows: offset from -3 to +3 relative to posisiIndex
  const offsets = [-3, -2, -1, 0, 1, 2, 3];
  const centerRows = offsets.map((offset) => {
    const idx = posisiIndex + offset;
    if (idx < 0) return { offset, idx: -1, dA: 0, dB: 0, val: undefined };
    const dA = digitAt(seed, kolomIndex, idx, 0, 9);
    const dB = digitAt(seed, kolomIndex, idx + 1, 0, 9);
    const val = answersMap[idx];
    return { offset, idx, dA, dB, val };
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans selection:bg-none relative">
      {/* Blur Overlay when window loses focus */}
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

      {/* Warning Toast */}
      {showWarning && tabWarning < MAX_VIOLATIONS && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-bounce">
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

      {/* Header Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Tes Pauli
          </span>
          <h1 className="text-sm font-bold text-gray-800 mt-1">
            Peserta: {candidateName}
          </h1>
        </div>
      </header>

      {/* Flash Message Banner */}
      {flashMessage && (
        <div className="bg-blue-600 text-white py-2.5 text-center font-bold text-sm shadow-md animate-bounce">
          ⚡ {flashMessage}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 items-center justify-center">
        {/* Working Column View */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md w-full max-w-md flex flex-col items-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Jumlahkan 2 Angka Berdampingan (Satuan Saja)
          </p>

          <div className="w-full flex flex-col gap-2 my-2">
            {centerRows.map(({ offset, idx, dA, dB, val }) => {
              if (idx < 0) {
                return (
                  <div key={`empty-${offset}`} className="h-[52px] border border-transparent" />
                );
              }
              const isCurrent = offset === 0;

              return (
                <div
                  key={idx}
                  onClick={() => setPosisiIndex(idx)}
                  className={`flex items-center justify-between px-6 py-3 rounded-xl border cursor-pointer transition-all ${
                    isCurrent
                      ? "bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 scale-105 shadow-sm"
                      : "bg-gray-50/50 border-gray-100 opacity-60 hover:opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl font-bold font-mono ${isCurrent ? "text-gray-900" : "text-gray-500"}`}>
                      {dA} + {dB}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-lg">
                    {val !== undefined ? (
                      <span className={`px-3 py-1 rounded-lg ${isCurrent ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}`}>
                        {val}
                      </span>
                    ) : isCurrent ? (
                      <span className="px-3 py-1 bg-blue-600 text-white rounded-lg animate-pulse">?</span>
                    ) : (
                      <span className="text-gray-300">...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Gunakan tombol panah keyboard atau keypad untuk berpindah antar soal
          </p>
        </div>

        {/* On-screen Keypad */}
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-md">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 text-center">
            Keypad Angka
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleDigitInput(num)}
                className="py-4 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-gray-200 rounded-xl font-mono text-2xl font-bold text-gray-800 transition-all active:scale-95 shadow-sm"
              >
                {num}
              </button>
            ))}

            {/* Row 4: Up Button (Atas) | 0 | Down Button (Bawah) */}
            <button
              onClick={handleMoveUp}
              title="Ke soal sebelumnya (Atas)"
              className="py-4 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-xl font-bold text-xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5"/>
                <path d="m5 12 7-7 7 7"/>
              </svg>
            </button>
            <button
              onClick={() => handleDigitInput(0)}
              className="py-4 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-gray-200 rounded-xl font-mono text-2xl font-bold text-gray-800 transition-all active:scale-95 shadow-sm"
            >
              0
            </button>
            <button
              onClick={handleMoveDown}
              title="Ke soal berikutnya (Bawah)"
              className="py-4 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-xl font-bold text-xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14"/>
                <path d="m19 12-7 7-7-7"/>
              </svg>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="bg-white border-t border-gray-200 py-3 text-center text-xs text-gray-400">
        Roemah Bimbel — Tes Pauli
      </footer>
    </div>
  );
}
