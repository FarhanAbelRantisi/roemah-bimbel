import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questions = await prisma.question.findMany({
      where: { examId: id },
      orderBy: { orderNum: "asc" },
    });
    return NextResponse.json(questions);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Ambil examType untuk tahu konteks soal
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: { examType: true },
    });

    const count = await prisma.question.count({ where: { examId: id } });
    const isTKP = body.category === "TKP";
    const isPsikotest = exam?.examType === "PSIKOTEST" || exam?.examType === "PSIKOTEST_TNI";
    const isAkademik = exam?.examType === "AKADEMIK";

    const question = await prisma.question.create({
      data: {
        examId: id,
        orderNum: count + 1,
        // SKD: pakai category enum. Psikotest & Akademik: default TWK, pakai subCategory
        category: (isPsikotest || isAkademik) ? "TWK" : body.category,
        subCategory: (isPsikotest || isAkademik) ? body.subCategory : null,
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

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("POST question error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}