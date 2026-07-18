import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { orderNum: "asc" } },
      },
    });
    if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
    return NextResponse.json(exam);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // =========================================================================
    // 1. VALIDASI UPDATE
    // =========================================================================
    const updateErrors: string[] = [];

    // Validasi akademik — cek penurunan target soal
    if (body.akademikTotalSoal !== undefined && body.akademikTotalSoal !== null) {
      const currentCount = await prisma.question.count({ where: { examId: id } });
      if (body.akademikTotalSoal < currentCount) {
        updateErrors.push(
          `Akademik: Sudah ada ${currentCount} soal terinput. Target tidak bisa diturunkan menjadi ${body.akademikTotalSoal}.`
        );
      }
    }

    // Validasi psikotest config — cek penurunan target per sub
    if (body.psikotestConfig) {
      try {
        const newConfig = JSON.parse(body.psikotestConfig) as Record<string, number>;
        const existingCounts = await prisma.question.groupBy({
          by: ["subCategory"],
          where: { examId: id },
          _count: { id: true },
        });

        for (const item of existingCounts) {
          const subCat = item.subCategory;
          if (subCat && newConfig[subCat] !== undefined) {
            if (newConfig[subCat] < item._count.id) {
              updateErrors.push(
                `Psikotest (${subCat}): Sudah ada ${item._count.id} soal terinput. Target tidak boleh dikurangi menjadi ${newConfig[subCat]}.`
              );
            }
          }
        }
      } catch (e) {
        console.error("Error parsing psikotestConfig", e);
      }
    }

    if (updateErrors.length > 0) {
      return NextResponse.json(
        { error: "Gagal menyimpan perubahan", details: updateErrors },
        { status: 400 }
      );
    }

    // =========================================================================
    // 2. VALIDASI PUBLISH
    // =========================================================================
    if (body.isPublished === true) {
      // Fetch exam SEKALI di sini — dipakai untuk semua validasi publish
      const examData = await prisma.exam.findUnique({ where: { id } });
      if (!examData) {
        return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
      }

      const publishErrors: string[] = [];

      if (examData.examType === "SKD") {
        const counts = await prisma.question.groupBy({
          by: ["category"],
          where: { examId: id },
          _count: { id: true },
        });
        const countMap: Record<string, number> = {};
        counts.forEach((c) => { countMap[c.category] = c._count.id; });

        if (examData.skdCategory) {
          // Sub-kategori: validasi hanya kategori tersebut
          const limits: Record<string, number> = { TWK: 30, TIU: 35, TKP: 45 };
          const required = limits[examData.skdCategory] ?? 0;
          const actual = countMap[examData.skdCategory] ?? 0;
          if (actual < required) {
            publishErrors.push(
              `${examData.skdCategory} kurang ${required - actual} soal (${actual}/${required})`
            );
          }
        } else {
          // Gabungan: validasi semua
          const twk = countMap["TWK"] ?? 0;
          const tiu = countMap["TIU"] ?? 0;
          const tkp = countMap["TKP"] ?? 0;
          if (twk < 30) publishErrors.push(`TWK kurang ${30 - twk} soal (${twk}/30)`);
          if (tiu < 35) publishErrors.push(`TIU kurang ${35 - tiu} soal (${tiu}/35)`);
          if (tkp < 45) publishErrors.push(`TKP kurang ${45 - tkp} soal (${tkp}/45)`);
        }

      } else if (examData.examType === "PSIKOTEST") {
        if (!examData.psikotestConfig) {
          publishErrors.push("Konfigurasi soal psikotest belum diatur");
        } else {
          const config = JSON.parse(examData.psikotestConfig) as Record<string, number>;
          const counts = await prisma.question.groupBy({
            by: ["subCategory"],
            where: { examId: id },
            _count: { id: true },
          });
          const countMap: Record<string, number> = {};
          counts.forEach((c) => { if (c.subCategory) countMap[c.subCategory] = c._count.id; });

          for (const [cat, required] of Object.entries(config)) {
            const actual = countMap[cat] ?? 0;
            if (actual < required) {
              publishErrors.push(`${cat} kurang ${required - actual} soal (${actual}/${required})`);
            }
          }
        }

      } else if (examData.examType === "AKADEMIK") {
        const total = await prisma.question.count({ where: { examId: id } });
        const akademikTotalSoal = examData.akademikTotalSoal ?? 0;
        if (akademikTotalSoal > 0 && total < akademikTotalSoal) {
          publishErrors.push(`Kurang ${akademikTotalSoal - total} soal (${total}/${akademikTotalSoal})`);
        } else if (total === 0) {
          publishErrors.push("Belum ada soal yang diinput");
        }
      }

      if (publishErrors.length > 0) {
        return NextResponse.json(
          { error: "Gagal mempublish ujian", details: publishErrors },
          { status: 400 }
        );
      }
    }

    // =========================================================================
    // 3. SIMPAN KE DATABASE
    // =========================================================================
    const exam = await prisma.exam.update({ where: { id }, data: body });
    return NextResponse.json(exam);

  } catch (error) {
    console.error("PATCH exam error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.exam.delete({ where: { id } });
    return NextResponse.json({ message: "Ujian dihapus" });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}