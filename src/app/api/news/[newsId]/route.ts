import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ newsId: string }> }
) {
  try {
    const { newsId } = await params;
    const news = await prisma.news.findUnique({ where: { id: newsId } });

    if (!news) {
      return NextResponse.json({ error: "Berita tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(news);
  } catch (error) {
    console.error("GET news by id error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ newsId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newsId } = await params;
    const body = await req.json();

    const news = await prisma.news.update({
      where: { id: newsId },
      data: body,
    });

    return NextResponse.json(news);
  } catch (error) {
    console.error("PATCH news error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ newsId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newsId } = await params;
    await prisma.news.delete({ where: { id: newsId } });
    return NextResponse.json({ message: "Berita dihapus" });
  } catch (error) {
    console.error("DELETE news error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}