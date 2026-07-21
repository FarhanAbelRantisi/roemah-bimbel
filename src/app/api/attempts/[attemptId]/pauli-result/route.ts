import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { computePauliMetrics, classifyPauliSession } from "@/lib/pauli-engine";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId } = await params;

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        user: { select: { name: true, email: true } },
        exam: { select: { title: true, examType: true, psikotestCategory: true } },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
    }

    const columns = await prisma.pauliColumnResult.findMany({
      where: { attemptId },
      orderBy: { kolomIndex: "asc" },
    });

    const cols = columns.map((c) => ({
      kolomIndex: c.kolomIndex,
      jumlahDikerjakan: c.jumlahDikerjakan,
      jumlahBenar: c.jumlahBenar,
    }));

    let skorMentah = null;
    let klasifikasiNorma = null;

    if (cols.length > 0) {
      const metrics = computePauliMetrics(cols);
      skorMentah = {
        jumlah_total: metrics.jumlahTotal,
        total_benar: metrics.totalBenar,
        total_salah: metrics.totalSalah,
        rasio_ketelitian: metrics.rasioKetelitian,
        median_per_kolom: metrics.medianPerKolom,
        puncak: metrics.puncak,
        bawah: metrics.bawah,
        deviasi_konsistensi: metrics.deviasiKonsistensi,
      };

      klasifikasiNorma = await classifyPauliSession(metrics, "TNI");
    }

    const output = {
      testee_ref: attempt.user?.name || attempt.user?.email || "PESERTA",
      session_id: attempt.id,
      jenis_seleksi: attempt.exam?.examType === "PSIKOTEST_TNI" ? "TNI" : "PSIKOTEST",
      waktu_mulai: attempt.startedAt,
      waktu_selesai: attempt.finishedAt,
      skor_mentah: skorMentah,
      klasifikasi_vs_norma_TNI: klasifikasiNorma,
      grafik_per_kolom: columns.map((c) => ({
        kolom: c.kolomIndex + 1,
        jumlah_dikerjakan: c.jumlahDikerjakan,
        jumlah_salah: c.jumlahSalah,
      })),
    };

    return NextResponse.json(output);
  } catch (error) {
    console.error("GET pauli-result error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
