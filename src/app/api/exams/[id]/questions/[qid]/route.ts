import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  try {
    const { id, qid } = await params;
    const body = await req.json();

    // Cek tipe exam
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: { examType: true },
    });

    const isTKP = body.category === "TKP";
    const isPsikotest = exam?.examType === "PSIKOTEST";
    const isAkademik = exam?.examType === "AKADEMIK";

    const question = await prisma.question.update({
      where: { id: qid },
      data: {
        // Logika yang sama persis dengan POST
        category: (isPsikotest || isAkademik) ? "TWK" : body.category,
        subCategory: (isPsikotest || isAkademik) ? (body.subCategory || null) : null,
        aspect: isTKP ? (body.aspect || null) : null,
        content: body.content,
        imageUrl: body.imageUrl || null,
        optionA: body.optionA,
        optionB: body.optionB,
        optionC: body.optionC,
        optionD: body.optionD,
        optionE: body.optionE,
        correctOption: isTKP ? null : (body.correctOption || null),
        correctOption2: isPsikotest ? (body.correctOption2 || null) : null,
        scoreA: isTKP ? 1 : null,
        scoreB: isTKP ? 2 : null,
        scoreC: isTKP ? 3 : null,
        scoreD: isTKP ? 4 : null,
        scoreE: isTKP ? 5 : null,
      },
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error("PATCH question error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  try {
    const { qid } = await params;
    await prisma.question.delete({ where: { id: qid } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}