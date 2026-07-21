import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * POST /api/attempts/[attemptId]/pauli-column
 *
 * Dipanggil dari frontend saat siswa pindah ke kolom berikutnya dalam Tes Pauli.
 * Menyimpan data mentah per-kolom: jumlah soal dikerjakan, jumlah benar, jumlah salah.
 *
 * Body: { kolomIndex: number; jumlahDikerjakan: number; jumlahBenar: number }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId } = await params;
    const body = await req.json();
    const { kolomIndex, jumlahDikerjakan, jumlahBenar } = body;

    if (
      kolomIndex === undefined ||
      jumlahDikerjakan === undefined ||
      jumlahBenar === undefined
    ) {
      return NextResponse.json(
        { error: "kolomIndex, jumlahDikerjakan, jumlahBenar wajib diisi" },
        { status: 400 }
      );
    }

    const jumlahSalah = jumlahDikerjakan - jumlahBenar;

    const result = await prisma.pauliColumnResult.upsert({
      where: { attemptId_kolomIndex: { attemptId, kolomIndex } },
      update: { jumlahDikerjakan, jumlahBenar, jumlahSalah },
      create: { attemptId, kolomIndex, jumlahDikerjakan, jumlahBenar, jumlahSalah },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("POST pauli-column error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * GET /api/attempts/[attemptId]/pauli-column
 *
 * Mengambil semua data kolom Pauli milik sesi ini (untuk hasil/grafik).
 */
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

    const columns = await prisma.pauliColumnResult.findMany({
      where: { attemptId },
      orderBy: { kolomIndex: "asc" },
    });

    return NextResponse.json(columns);
  } catch (error) {
    console.error("GET pauli-column error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
