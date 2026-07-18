import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const body = await req.json();

    // Cegah admin hapus/ubah dirinya sendiri
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Tidak bisa mengubah akun sendiri" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: body,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isPremium: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("PATCH user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Tidak bisa menghapus akun sendiri" },
        { status: 400 }
      );
    }

    // Delete related attempts first to prevent foreign key constraint errors
    await prisma.examAttempt.deleteMany({ where: { userId } });
    
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ message: "User dihapus" });
  } catch (error) {
    console.error("DELETE user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}