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

const IconAlertTriangle = ({ className = "text-2xl shrink-0 text-amber-400" }: { className?: string }) => (
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
  const [kolomTimeLeft, setKolomTimeLeft] = useState(signalIntervalSec);

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
      setKolomTimeLeft(signalIntervalSec);
      setFlashMessage(`Pindah ke Kolom ${currentK + 2}!`);
      setTimeout(() => setFlashMessage(null), 2500);
    }
    setIsSubmitting(false);
  }, [saveColumnResult, seed, signalIntervalSec, totalColumns]);

  const nextColumnRef = useRef(nextColumn);
  useEffect(() => { nextColumnRef.current = nextColumn; }, [nextColumn]);

  // Background Timers
  useEffect(() => {
    const timer = setInterval(() => {
      totalTimeLeftRef.current -= 1;
      kolomTimeLeftRef.current -= 1;
      setKolomTimeLeft(kolomTimeLeftRef.current);

      if (kolomTimeLeftRef.current <= 0) {
        kolomTimeLeftRef.current = signalIntervalSec;
        setKolomTimeLeft(signalIntervalSec);
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

  // Centered view digit cards
  const offsets = [-2, -1, 0, 1, 2, 3];
  const centerRows = offsets.map((offset) => {
    const idx = posisiIndex + offset;
    if (idx < 0) return { offset, idx: -1 };
    return { offset, idx };
  });

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentAnsweredCount = Object.keys(answersMap).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-none relative overflow-x-hidden">
      {/* Background Subtle Ambient Mesh Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Blur Overlay when window loses focus */}
      {isBlurred && (
        <div className="fixed inset-0 z-[9997] backdrop-blur-xl bg-slate-950/80 flex flex-col items-center justify-center gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm text-center">
            <IconLock className="w-16 h-16 text-rose-500 mb-2 animate-bounce" />
            <p className="text-white font-bold text-xl">Ujian Terkunci</p>
            <p className="text-slate-400 text-sm mt-1">
              Kembali ke tab halaman ini untuk melanjutkan pengerjaan.
            </p>
          </div>
        </div>
      )}

      {/* Warning Toast */}
      {showWarning && tabWarning < MAX_VIOLATIONS && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-bounce">
          <div className="bg-rose-950 border border-rose-600/60 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-md">
            <IconAlertTriangle className="text-2xl shrink-0 text-amber-400" />
            <div>
              <p className="font-bold text-sm text-rose-200">Pelanggaran Terdeteksi!</p>
              <p className="text-xs text-rose-300/90 mt-0.5">{warningMsg}</p>
            </div>
            <div className="ml-auto shrink-0 bg-rose-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
              {MAX_VIOLATIONS - tabWarning}
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic Header Bar */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3.5 py-1.5 rounded-full font-semibold text-xs shadow-md shadow-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Tes Pauli
          </div>
          <div className="bg-slate-800/90 border border-slate-700/80 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-full">
            Kolom <span className="text-blue-400 font-bold">{kolomIndex + 1}</span> / {totalColumns}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Sisa Waktu Kolom */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Waktu Kolom:</span>
            <span className={`font-mono font-bold text-sm ${kolomTimeLeft <= 15 ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
              {formatTimer(kolomTimeLeft)}
            </span>
          </div>

          {/* Indikator Pelanggaran */}
          {tabWarning > 0 && (
            <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-800/60 px-3 py-1.5 rounded-xl">
              <span className="text-rose-400 text-xs font-semibold">Pelanggaran:</span>
              <div className="flex gap-1">
                {Array.from({ length: MAX_VIOLATIONS }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i < tabWarning ? "bg-rose-500" : "bg-slate-700"}`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="hidden sm:block text-xs text-slate-400 border-l border-slate-800 pl-4">
            Peserta: <span className="font-semibold text-slate-200">{candidateName}</span>
          </div>
        </div>
      </header>

      {/* Flash Banner */}
      {flashMessage && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white py-2.5 text-center font-bold text-sm shadow-xl animate-bounce z-40">
          ⚡ {flashMessage}
        </div>
      )}

      {/* Main Layout Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 items-center justify-center z-10">
        
        {/* Stream Workspace (Central Column Stream) */}
        <div className="w-full max-w-sm bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 shadow-2xl shadow-black/40 flex flex-col items-center relative select-none">
          
          {/* Header Title */}
          <div className="flex items-center justify-between w-full mb-6 pb-3 border-b border-slate-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Aliran Angka Vertikal
            </span>
            <span className="text-xs font-mono bg-blue-950/80 border border-blue-800/60 text-blue-400 px-2.5 py-0.5 rounded-md font-semibold">
              Terjawab: {currentAnsweredCount}
            </span>
          </div>

          {/* Glowing Vertical Line Spine Guide */}
          <div className="absolute top-20 bottom-16 left-12 w-0.5 bg-gradient-to-b from-blue-500/10 via-blue-500/40 to-blue-500/10 pointer-events-none" />

          {/* Cards & Floating Badges */}
          <div className="w-full flex flex-col gap-3 my-1 relative">
            {centerRows.map(({ offset, idx }) => {
              if (idx < 0) {
                return (
                  <div key={`empty-${offset}`} className="h-16 border border-transparent" />
                );
              }

              const digitVal = digitAt(seed, kolomIndex, idx, 0, 9);
              const val = answersMap[idx];
              const isActiveTop = idx === posisiIndex;
              const isActiveBottom = idx === posisiIndex + 1;
              const isActivePair = isActiveTop || isActiveBottom;
              const isBadgeActive = idx === posisiIndex;

              return (
                <div key={idx} className="relative group">
                  {/* Digit Card */}
                  <div
                    onClick={() => setPosisiIndex(idx)}
                    className={`h-16 w-full rounded-2xl border transition-all duration-200 px-8 flex items-center justify-between cursor-pointer ${
                      isActivePair
                        ? "bg-slate-800/90 border-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-2 ring-blue-500/20 scale-[1.02]"
                        : "bg-slate-900/60 border-slate-800/90 hover:bg-slate-800/50 hover:border-slate-700 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <span
                      className={`text-3xl font-mono transition-colors ${
                        isActivePair
                          ? "text-blue-400 font-black drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]"
                          : "text-slate-300 font-bold"
                      }`}
                    >
                      {digitVal}
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Inter-Node Answer Badge (Floating between Card i & Card i+1) */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setPosisiIndex(idx);
                    }}
                    className={`absolute right-6 -bottom-5 z-20 w-12 h-13 rounded-xl border flex items-center justify-center font-mono text-xl font-bold cursor-pointer transition-all duration-200 shadow-lg ${
                      isBadgeActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-white text-white ring-4 ring-blue-500/30 scale-110 shadow-blue-500/40"
                        : val !== undefined
                        ? "bg-slate-800 border-blue-500/40 text-cyan-400 shadow-md"
                        : "bg-slate-900/90 border-slate-800 text-slate-600 hover:border-slate-700"
                    }`}
                  >
                    {val !== undefined ? (
                      val
                    ) : isBadgeActive ? (
                      <span className="text-white animate-pulse font-extrabold text-2xl">?</span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-500 mt-6 text-center">
            Tekan <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded font-mono text-[10px]">0-9</kbd> untuk menjawab & lanjut otomatis
          </p>
        </div>

        {/* Side Panel: Keypad & Quick Controls */}
        <div className="w-full max-w-sm bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 shadow-2xl shadow-black/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Keypad Input
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Papan Angka
              </span>
            </div>

            {/* Grid Keypad 3x4 */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleDigitInput(num)}
                  className="py-4 bg-slate-800/80 hover:bg-blue-600/20 hover:border-blue-500/50 border border-slate-700/60 rounded-2xl font-mono text-2xl font-bold text-slate-100 transition-all active:scale-95 shadow-md flex items-center justify-center hover:text-blue-400"
                >
                  {num}
                </button>
              ))}

              {/* Navigation Up */}
              <button
                onClick={handleMoveUp}
                title="Ke soal sebelumnya (Atas)"
                className="py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl text-slate-300 flex items-center justify-center transition-all active:scale-95 shadow-md hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5"/>
                  <path d="m5 12 7-7 7 7"/>
                </svg>
              </button>

              {/* Digit 0 */}
              <button
                onClick={() => handleDigitInput(0)}
                className="py-4 bg-slate-800/80 hover:bg-blue-600/20 hover:border-blue-500/50 border border-slate-700/60 rounded-2xl font-mono text-2xl font-bold text-slate-100 transition-all active:scale-95 shadow-md flex items-center justify-center hover:text-blue-400"
              >
                0
              </button>

              {/* Navigation Down */}
              <button
                onClick={handleMoveDown}
                title="Ke soal berikutnya (Bawah)"
                className="py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl text-slate-300 flex items-center justify-center transition-all active:scale-95 shadow-md hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14"/>
                  <path d="m19 12-7 7-7-7"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Navigasi Soal:</span>
              <div className="flex gap-1 font-mono text-[11px]">
                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">↑ W</kbd>
                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">↓ S</kbd>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/60 py-3 text-center text-xs text-slate-500">
        Roemah Bimbel — Tes Pauli Digital Simulation
      </footer>
    </div>
  );
}
