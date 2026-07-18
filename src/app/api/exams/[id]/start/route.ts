import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: "User ID tidak ditemukan" }, { status: 401 });
    }

    // Ambil data exam
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: { isPremium: true, isPublished: true },
    });

    if (!exam) {
      return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
    }

    if (!exam.isPublished) {
      return NextResponse.json({ error: "Ujian belum tersedia" }, { status: 403 });
    }

    // Cek akses premium
    if (exam.isPremium) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPremium: true },
      });

      if (!user?.isPremium) {
        return NextResponse.json(
          { error: "PREMIUM_REQUIRED" },
          { status: 403 }
        );
      }
    }

    // Cek attempt yang sudah selesai
    const finished = await prisma.examAttempt.findFirst({
      where: {
        userId: userId,
        examId: id,
        finishedAt: { not: null },
      },
    });

    if (finished) {
      return NextResponse.json(
        { error: "Kamu sudah mengerjakan ujian ini" },
        { status: 400 }
      );
    }

    // Cek attempt yang belum selesai
    const existing = await prisma.examAttempt.findFirst({
      where: {
        userId: userId,
        examId: id,
        finishedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json({ attemptId: existing.id });
    }

    // Ambil semua soal
    const questions = await prisma.question.findMany({
      where: { examId: id },
      orderBy: { orderNum: "asc" },
    });

    // Buat attempt baru
    const attempt = await prisma.examAttempt.create({
      data: {
        userId: userId,
        examId: id,
        answers: {
          create: questions.map((q) => ({
            questionId: q.id,
          })),
        },
      },
    });

    return NextResponse.json({ attemptId: attempt.id });
  } catch (error) {
    console.error("Start exam error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}