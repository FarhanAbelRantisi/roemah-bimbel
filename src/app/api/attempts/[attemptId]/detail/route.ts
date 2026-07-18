import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
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
        exam: {
          select: {
            title: true,
            duration: true,
            examType: true,
            psikotestCategory: true,
            psikotestConfig: true,
            akademikCategory: true,
          },
        },
        answers: {
          include: { question: true },
          orderBy: { question: { orderNum: "asc" } },
        },
      },
    });

    if (!attempt) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    if (attempt.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json(attempt);
  } catch (error) {
    console.error("GET attempt detail error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}