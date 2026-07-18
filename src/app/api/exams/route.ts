import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;

    const { searchParams } = new URL(req.url);
    const onlyPublished = searchParams.get("published") === "true";
    const examType = searchParams.get("examType"); // filter opsional

    // Jika bukan ADMIN, selalu paksa untuk hanya melihat ujian yang dipublish
    const forcePublished = role !== "ADMIN" || onlyPublished;

    const exams = await prisma.exam.findMany({
      where: {
        ...(forcePublished ? { isPublished: true } : {}),
        ...(examType ? { examType: examType as any } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true } } },
    });
    return NextResponse.json(exams);
  } catch (error) {
    console.error("GET /api/exams error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, duration, isPremium, examType, psikotestCategory, psikotestConfig, akademikCategory } = body;

    if (!title || !duration) {
      return NextResponse.json({ error: "Title dan durasi wajib diisi" }, { status: 400 });
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        duration: Number(duration),
        isPremium: isPremium ?? false,
        examType: examType ?? "SKD",
        skdCategory: examType === "SKD" ? (body.skdCategory || null) : null,
        psikotestCategory: examType === "PSIKOTEST" ? psikotestCategory : null,
        psikotestConfig: examType === "PSIKOTEST" ? psikotestConfig : null,
        akademikCategory: examType === "AKADEMIK" ? akademikCategory : null,
        akademikTotalSoal: body.akademikTotalSoal || null,
      },
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error("POST /api/exams error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}