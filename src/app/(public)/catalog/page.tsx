import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import CatalogClient from "./CatalogClient";

interface Exam {
  id: string;
  title: string;
  duration: number;
  isPremium: boolean;
  isPublished: boolean;
  examType: "SKD" | "PSIKOTEST" | "AKADEMIK";
  skdCategory: string | null; 
  psikotestCategory: string | null;
  akademikCategory: string | null;
  _count: { questions: number };
}

async function getExams(): Promise<Exam[]> {
  try {
    const exams = await prisma.exam.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true } } },
    });
    return exams.map((e) => ({
      id: e.id,
      title: e.title,
      duration: e.duration,
      isPremium: e.isPremium,
      isPublished: e.isPublished,
      examType: e.examType as "SKD" | "PSIKOTEST" | "AKADEMIK",
      skdCategory: e.skdCategory,
      psikotestCategory: e.psikotestCategory,
      akademikCategory: e.akademikCategory,
      _count: e._count,
    }));
  } catch {
    return [];
  }
}

async function getFinishedAttempts(userId: string) {
  try {
    const attempts = await prisma.examAttempt.findMany({
      where: { userId, finishedAt: { not: null } },
      select: { examId: true, totalScore: true },
    });
    return attempts;
  } catch {
    return [];
  }
}

export default async function CatalogPage() {
  const session = await auth();
  const exams = await getExams();

  const finishedExamIds = new Set<string>();
  const scoreMap: Record<string, number> = {};

  if (session?.user?.id) {
    const attempts = await getFinishedAttempts(session.user.id);
    attempts.forEach((a) => {
      finishedExamIds.add(a.examId);
      scoreMap[a.examId] = a.totalScore;
    });
  }

  const userSession = session?.user
    ? {
        id: session.user.id ?? "",
        isPremium: (session.user as { isPremium?: boolean }).isPremium ?? false,
      }
    : null;

  return (
    <CatalogClient
      exams={exams}
      finishedExamIds={Array.from(finishedExamIds)}
      scoreMap={scoreMap}
      userSession={userSession}
    />
  );
}