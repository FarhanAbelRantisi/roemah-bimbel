import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
        exam: {
          select: {
            title: true,
            duration: true,
            examType: true,
            skdCategory: true,
            psikotestCategory: true,
            psikotestConfig: true,
            akademikCategory: true,
          }
        },
        answers: {
          include: { question: true },
          orderBy: { question: { orderNum: "asc" } },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
    }

    if (attempt.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const startTime = new Date(attempt.startedAt);
    const durationInSeconds = attempt.exam.duration * 60;
    
    const secondsElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    
    const remainingTime = Math.max(0, durationInSeconds - secondsElapsed);

    return NextResponse.json({
      ...attempt,
      remainingTime
    });
  } catch (error) {
    console.error("Get attempt error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;

    // hapus attempt + answers (relasi)
    await prisma.answer.deleteMany({
      where: { attemptId },
    });

    await prisma.examAttempt.delete({
      where: { id: attemptId },
    });

    return NextResponse.json({ message: "Attempt berhasil dihapus" });
  } catch (error) {
    console.error("Delete attempt error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}