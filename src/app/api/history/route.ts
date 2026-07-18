import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attempts = await prisma.examAttempt.findMany({
      where: {
        userId: session.user.id,
        finishedAt: { not: null },
      },
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
          },
        },
        answers: {
          select: { selected: true },
        },
      },
      orderBy: { finishedAt: "desc" },
    });

    return NextResponse.json(attempts);
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}