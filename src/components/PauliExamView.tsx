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
  const [jumlahDikerjakan, setJumlahDikerjakan] = useState(0);
  const [jumlahBenar, setJumlahBenar] = useState(0);
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
  const jumlahDikerjakanRef = useRef(jumlahDikerjakan);
  const jumlahBenarRef = useRef(jumlahBenar);
  const isSubmittingRef = useRef(isSubmitting);
  const onFinishRef = useRef(onFinish);

  useEffect(() => { kolomIndexRef.current = kolomIndex; }, [kolomIndex]);
  useEffect(() => { jumlahDikerjakanRef.current = jumlahDikerjakan; }, [jumlahDikerjakan]);
  useEffect(() => { jumlahBenarRef.current = jumlahBenar; }, [jumlahBenar]);
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
    const currentD = jumlahDikerjakanRef.current;
    const currentB = jumlahBenarRef.current;

    await saveColumnResult(currentK, currentD, currentB);

    if (currentK + 1 >= totalColumns) {
      onFinishRef.current();
    } else {
      setKolomIndex(currentK + 1);
      setPosisiIndex(0);
      setJumlahDikerjakan(0);
      setJumlahBenar(0);
      kolomTimeLeftRef.current = signalIntervalSec;
      setFlashMessage(`Garis! Pindah ke Kolom Berikutnya`);
      setTimeout(() => setFlashMessage(null), 2500);
    }
    setIsSubmitting(false);
  }, [saveColumnResult, signalIntervalSec, totalColumns]);

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

  // Digits for display (show current position and next 8 pairs)
  const currentDigitA = digitAt(seed, kolomIndex, posisiIndex, 0, 9);
  const currentDigitB = digitAt(seed, kolomIndex, posisiIndex + 1, 0, 9);
  const expectedAnswer = (currentDigitA + currentDigitB) % 10;

  // Handle digit input
  const handleDigitInput = useCallback((inputVal: number) => {
    const isCorrect = inputVal === expectedAnswer;
    setJumlahDikerjakan((prev) => prev + 1);
    if (isCorrect) setJumlahBenar((prev) => prev + 1);
    setPosisiIndex((prev) => prev + 1);
  }, [expectedAnswer]);

  // Keydown listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleDigitInput(parseInt(e.key, 10));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigitInput]);

  // Generate preview rows
  const previewRows = Array.from({ length: 8 }, (_, i) => {
    const idx = posisiIndex + i;
    const dA = digitAt(seed, kolomIndex, idx, 0, 9);
    const dB = digitAt(seed, kolomIndex, idx + 1, 0, 9);
    return { idx, dA, dB, target: (dA + dB) % 10 };
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
            {previewRows.map((row, i) => (
              <div
                key={row.idx}
                className={`flex items-center justify-between px-6 py-3 rounded-xl border transition-all ${
                  i === 0
                    ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 scale-105 shadow-sm"
                    : "bg-gray-50/50 border-gray-100 opacity-60"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400 font-mono w-6">#{row.idx + 1}</span>
                  <span className={`text-2xl font-bold font-mono ${i === 0 ? "text-gray-900" : "text-gray-500"}`}>
                    {row.dA} + {row.dB}
                  </span>
                </div>
                <div className="font-mono font-bold text-lg">
                  {i === 0 ? (
                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg animate-pulse">?</span>
                  ) : (
                    <span className="text-gray-300">...</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Tekan angka <strong>0-9</strong> pada keyboard atau tombol layar di bawah
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
            <div />
            <button
              onClick={() => handleDigitInput(0)}
              className="py-4 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-gray-200 rounded-xl font-mono text-2xl font-bold text-gray-800 transition-all active:scale-95 shadow-sm"
            >
              0
            </button>
            <div />
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
