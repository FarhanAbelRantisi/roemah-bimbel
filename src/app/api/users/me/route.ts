import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { skdTrack } = body;

    if (!["CPNS", "KEDINASAN"].includes(skdTrack)) {
      return NextResponse.json({ error: "Nilai skdTrack tidak valid" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { skdTrack },
      select: { id: true, skdTrack: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("PATCH /api/users/me error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
