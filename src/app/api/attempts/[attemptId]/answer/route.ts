import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { attemptId } = await params;
    const body = await req.json();
    const { questionId, selected, selected2, isFlagged } = body;

    const updateResult = await prisma.answer.updateMany({
      where: { attemptId, questionId },
      data: {
        ...(selected !== undefined && { selected }),
        ...(selected2 !== undefined && { selected2 }),
        ...(isFlagged !== undefined && { isFlagged }),
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: "Answer not found or not updated" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Save answer error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}