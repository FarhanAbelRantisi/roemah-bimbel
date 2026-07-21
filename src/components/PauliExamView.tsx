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
      }

      if (totalTimeLeftRef.current <= 0) {
        clearInterval(timer);
        onFinishRef.current();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [signalIntervalSec]);

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

  // Keydown listener
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans selection:bg-none">
      {/* Header Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Tes Pauli
          </span>
          <h1 className="text-sm font-bold text-gray-800 mt-1">
            Peserta: {candidateName}
          </h1>
        </div>

        <button
          onClick={nextColumn}
          disabled={isSubmitting}
          className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
        >
          Selesai Ujian
        </button>
      </header>

      {/* Flash Message Banner */}
      {flashMessage && (
        <div className="bg-indigo-600 text-white py-2.5 text-center font-bold text-sm shadow-md animate-bounce">
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
                      ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20 scale-105 shadow-sm"
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
                      <span className={`px-3 py-1 rounded-lg ${isCurrent ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"}`}>
                        {val}
                      </span>
                    ) : isCurrent ? (
                      <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg animate-pulse">?</span>
                    ) : (
                      <span className="text-gray-300">...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Gunakan tombol ⬆/⬇ atau panah keyboard untuk berpindah antar soal
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
                className="py-4 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-gray-200 rounded-xl font-mono text-2xl font-bold text-gray-800 transition-all active:scale-95 shadow-sm"
              >
                {num}
              </button>
            ))}

            {/* Row 4: Up Button (Atas) | 0 | Down Button (Bawah) */}
            <button
              onClick={handleMoveUp}
              title="Ke soal sebelumnya (Atas)"
              className="py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-xl font-bold text-xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
            >
              ⬆
            </button>
            <button
              onClick={() => handleDigitInput(0)}
              className="py-4 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-gray-200 rounded-xl font-mono text-2xl font-bold text-gray-800 transition-all active:scale-95 shadow-sm"
            >
              0
            </button>
            <button
              onClick={handleMoveDown}
              title="Ke soal berikutnya (Bawah)"
              className="py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-xl font-bold text-xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
            >
              ⬇
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
