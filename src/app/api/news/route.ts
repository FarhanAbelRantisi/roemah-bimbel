import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const onlyPublished = searchParams.get("published") === "true";

    const news = await prisma.news.findMany({
      where: onlyPublished ? { isPublished: true } : {},
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(news);
  } catch (error) {
    console.error("GET news error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, category, imageUrl, isPublished } = await req.json();

    if (!title || !content || !category) {
      return NextResponse.json({ error: "Title, konten, dan kategori wajib diisi" }, { status: 400 });
    }

    const news = await prisma.news.create({
      data: { title, content, category, imageUrl: imageUrl || null, isPublished: isPublished ?? false },
    });

    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    console.error("POST news error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}