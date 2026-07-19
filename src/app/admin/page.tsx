export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RecentAttempts from "@/components/RecentAttempts";

async function getStats() {
  try {
    const [totalExams, totalStudents, publishedExams, totalNews] = await Promise.all([
      prisma.exam.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.exam.count({ where: { isPublished: true } }),
      prisma.news.count({ where: { isPublished: true } }),
    ]);

    const recentAttempts = await prisma.examAttempt.findMany({
      where: { finishedAt: { not: null } },
      orderBy: { finishedAt: "desc" }, // Tampilkan yang terbaru di atas
      include: {
        user: { select: { name: true, email: true } },
        exam: { 
          select: { 
            title: true,
            examType: true,             // Tambahkan examType
            psikotestCategory: true,    // Opsional, berguna untuk badge
            akademikCategory: true,     // Opsional, berguna untuk badge
            skdCategory: true
          } 
        },
      },
    });

    const totalAttempts = await prisma.examAttempt.count({
      where: { finishedAt: { not: null } },
    });

    return { totalExams, totalStudents, publishedExams, totalNews, recentAttempts, totalAttempts };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      totalExams: 0,
      totalStudents: 0,
      publishedExams: 0,
      totalNews: 0,
      recentAttempts: [],
      totalAttempts: 0,
    };
  }
}

const IconExam = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IconUsers = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconCheck = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;
const IconNews = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>;

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    { label: "Total Ujian", value: stats.totalExams, icon: <IconExam />, sub: `${stats.publishedExams} published`, color: "text-blue-600 bg-blue-50" },
    { label: "Total Siswa", value: stats.totalStudents, icon: <IconUsers />, sub: "terdaftar", color: "text-green-600 bg-green-50" },
    { label: "Ujian Dikerjakan", value: stats.totalAttempts, icon: <IconCheck />, sub: "total attempt", color: "text-yellow-600 bg-yellow-50" },
    { label: "Berita Aktif", value: stats.totalNews, icon: <IconNews />, sub: "published", color: "text-purple-600 bg-purple-50" },
  ];

  // Serialize data untuk client component
  const serializedAttempts = stats.recentAttempts.map((a) => ({
    id: a.id,
    totalScore: a.totalScore,
    // Skor SKD
    twkScore: a.twkScore,
    tiuScore: a.tiuScore,
    tkpScore: a.tkpScore,
    // Skor Psikotest
    kecerdasanScore: a.kecerdasanScore,
    kecermatanScore: a.kecermatanScore,
    kepribadianScore: a.kepribadianScore,
    // Skor Akademik
    akademikScore: a.akademikScore,
    finishedAt: a.finishedAt!.toISOString(),
    user: { name: a.user.name, email: a.user.email },
    exam: { 
      title: a.exam.title,
      examType: a.exam.examType,
      psikotestCategory: a.exam.psikotestCategory,
      akademikCategory: a.exam.akademikCategory,
      skdCategory: a.exam.skdCategory,
    },
  }));

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Selamat datang di Admin Portal Roemah Bimbel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aktivitas terbaru — client component dengan search */}
        <RecentAttempts attempts={serializedAttempts} />

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-3">
            {[
              { href: "/admin/exams", icon: <IconExam />, label: "Buat Ujian Baru", desc: "Tambah paket soal baru" },
              { href: "/admin/news", icon: <IconNews />, label: "Tulis Berita", desc: "Publish informasi terbaru" },
              { href: "/admin/users", icon: <IconUsers />, label: "Kelola User", desc: "Manajemen akun siswa" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group"
              >
                <span className="text-blue-600">{action.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-400">{action.desc}</p>
                </div>
                <span className="ml-auto text-gray-300 group-hover:text-blue-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}