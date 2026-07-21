import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { computePauliMetrics, recomputePauliNorm } from "@/lib/pauli-engine";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { attemptId } = await params;

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
        answers: { include: { question: true } },
      },
    });

    if (!attempt) return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });

    const examType = attempt.exam.examType;

    let twkScore = 0, tiuScore = 0, tkpScore = 0;
    let kecerdasanScore = 0, kecermatanScore = 0, kepribadianScore = 0;
    let akademikScore = 0, pauliScore = 0;

    // ===== SKD =====
    if (examType === "SKD") {
      for (const answer of attempt.answers) {
        const q = answer.question;
        if (q.category === "TKP" && answer.selected) {
          const scoreMap: Record<string, number | null> = {
            A: q.scoreA, B: q.scoreB, C: q.scoreC, D: q.scoreD, E: q.scoreE,
          };
          tkpScore += scoreMap[answer.selected] ?? 0;
        } else if (q.category === "TWK" && answer.selected === q.correctOption) {
          twkScore += 5;
        } else if (q.category === "TIU" && answer.selected === q.correctOption) {
          tiuScore += 5;
        }
      }

    // ===== PSIKOTEST =====
    } else if (examType === "PSIKOTEST") {
      const correctPerSub: Record<string, number> = {};
      const totalSoalPerSub: Record<string, number> = {};

      // Normalisasi helper
      const getSub = (answer: typeof attempt.answers[0]) => {
        const raw = answer.question.subCategory?.trim() ||
                    attempt.exam.psikotestCategory?.trim() ||
                    "";
        return raw.toUpperCase(); // normalize ke uppercase
      };

      // Pass 1: hitung total soal per sub
      for (const answer of attempt.answers) {
        const sub = getSub(answer);
        totalSoalPerSub[sub] = (totalSoalPerSub[sub] ?? 0) + 1;
        correctPerSub[sub] = correctPerSub[sub] ?? 0;
      }

      // Pass 2: hitung benar
      for (const answer of attempt.answers) {
        const q = answer.question;
        const sub = getSub(answer);

        const hasSecondAnswer = !!(q.correctOption2 && q.correctOption2.trim() !== "");

        let isCorrect: boolean;
        if (hasSecondAnswer) {
          const correctSet = new Set([
            q.correctOption?.trim(),
            q.correctOption2?.trim(),
          ].filter(Boolean));
          const userSet = new Set([
            answer.selected?.trim(),
            answer.selected2?.trim(),
          ].filter(Boolean));

          isCorrect =
            userSet.size === 2 &&
            correctSet.size === 2 &&
            [...userSet].every((ans) => correctSet.has(ans as string));
        } else {
          const noExtraAnswer = !answer.selected2 || answer.selected2.trim() === "";
          isCorrect = answer.selected?.trim() === q.correctOption?.trim() && noExtraAnswer;
        }

        if (isCorrect) correctPerSub[sub]++;
      }

      // Pass 3: hitung skor dengan max nilai per kategori
      const maxScoreMap: Record<string, number> = {
        KECERDASAN: 100,
        KECERMATAN: 80,
        KEPRIBADIAN: 80,
      };

      for (const [sub, correct] of Object.entries(correctPerSub)) {
        const total = totalSoalPerSub[sub] || 1;
        const maxScore = maxScoreMap[sub] ?? 100; // default 100 kalau tidak dikenal
        const score = Math.round((correct / total) * maxScore);

        console.log(`sub="${sub}" correct=${correct} total=${total} maxScore=${maxScore} score=${score}`);

        // Match dengan trim + uppercase untuk safety
        const subNorm = sub.trim().toUpperCase();
        if (subNorm === "KECERDASAN") kecerdasanScore = score;
        else if (subNorm === "KECERMATAN") kecermatanScore = score;
        else if (subNorm === "KEPRIBADIAN") kepribadianScore = score;
      }

      console.log("final scores:", { kecerdasanScore, kecermatanScore, kepribadianScore });

    // ===== AKADEMIK =====
    } else if (examType === "AKADEMIK") {
      let correctCount = 0;
      const totalSoal = attempt.answers.length || 1;

      for (const answer of attempt.answers) {
        if (answer.selected === answer.question.correctOption) correctCount++;
      }

      akademikScore = Math.round((correctCount / totalSoal) * 100);

    // ===== PSIKOTEST TNI (non-Pauli) =====
    } else if (examType === "PSIKOTEST_TNI") {
      const psikotestCategory = attempt.exam.psikotestCategory?.trim().toUpperCase() ?? "";

      if (psikotestCategory === "PAULI") {
        // --- Pauli: input angka real-time, scoring berbasis kolom ---
        // Ambil data per kolom dari PauliColumnResult
        const columnRows = await prisma.pauliColumnResult.findMany({
          where: { attemptId },
          orderBy: { kolomIndex: "asc" },
        });

        if (columnRows.length > 0) {
          const cols = columnRows.map((c) => ({
            kolomIndex: c.kolomIndex,
            jumlahDikerjakan: c.jumlahDikerjakan,
            jumlahBenar: c.jumlahBenar,
          }));

          const metrics = computePauliMetrics(cols);
          // pauliScore = persentase ketelitian (0-100)
          pauliScore = Math.round(metrics.rasioKetelitian * 100);

          // Trigger recompute norma setelah sesi selesai (async, tidak blocking response)
          recomputePauliNorm("TNI").catch((e) =>
            console.error("[PauliNorm] Recompute error:", e)
          );
        }

      } else {
        // --- Sub non-Pauli (VERBAL, MATEMATIKA_DASAR, dll.) ---
        // Reuse logika scoring PSIKOTEST biasa
        const correctPerSub: Record<string, number> = {};
        const totalSoalPerSub: Record<string, number> = {};

        const getSub = (answer: typeof attempt.answers[0]) => {
          const raw = answer.question.subCategory?.trim() ||
                      attempt.exam.psikotestCategory?.trim() ||
                      "";
          return raw.toUpperCase();
        };

        for (const answer of attempt.answers) {
          const sub = getSub(answer);
          totalSoalPerSub[sub] = (totalSoalPerSub[sub] ?? 0) + 1;
          correctPerSub[sub] = correctPerSub[sub] ?? 0;
        }

        for (const answer of attempt.answers) {
          const q = answer.question;
          const sub = getSub(answer);
          const isCorrect = answer.selected?.trim() === q.correctOption?.trim();
          if (isCorrect) correctPerSub[sub]++;
        }

        let totalCorrect = 0;
        let totalSoal = 0;
        for (const [sub, correct] of Object.entries(correctPerSub)) {
          totalCorrect += correct;
          totalSoal += totalSoalPerSub[sub] || 1;
        }
        // Simpan sebagai kecerdasanScore (reuse kolom existing)
        kecerdasanScore = totalSoal > 0 ? Math.round((totalCorrect / totalSoal) * 100) : 0;
      }
    }

    // ===== TOTAL SCORE =====
    const totalScore = examType === "SKD"
      ? twkScore + tiuScore + tkpScore
      : examType === "PSIKOTEST"
      ? kecerdasanScore + kecermatanScore + kepribadianScore
      : examType === "PSIKOTEST_TNI"
      ? (attempt.exam.psikotestCategory?.toUpperCase() === "PAULI"
          ? pauliScore
          : kecerdasanScore)
      : akademikScore;

    const finished = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        finishedAt: new Date(),
        twkScore, tiuScore, tkpScore,
        kecerdasanScore, kecermatanScore, kepribadianScore,
        pauliScore,
        akademikScore,
        totalScore,
      },
    });

    return NextResponse.json(finished);
  } catch (error) {
    console.error("Finish exam error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}