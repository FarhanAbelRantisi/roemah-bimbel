import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

async function getNews(newsId: string) {
  try {
    return await prisma.news.findUnique({
      where: { id: newsId, isPublished: true },
    });
  } catch {
    return null;
  }
}

async function getRelated(newsId: string, category: string) {
  try {
    return await prisma.news.findMany({
      where: {
        isPublished: true,
        category,
        NOT: { id: newsId },
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

const categoryColor: Record<string, string> = {
  UPDATE: "bg-blue-100 text-blue-700",
  FEATURE: "bg-purple-100 text-purple-700",
  EVENT: "bg-green-100 text-green-700",
  TIPS: "bg-yellow-100 text-yellow-700",
  PENGUMUMAN: "bg-red-100 text-red-700",
};

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ newsId: string }>;
}) {
  const { newsId } = await params;
  const news = await getNews(newsId);

  if (!news) notFound();

  const related = await getRelated(newsId, news.category);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span>›</span>
        <Link href="/news" className="hover:text-blue-600">News</Link>
        <span>›</span>
        <span className="text-gray-600 line-clamp-1">{news.title}</span>
      </div>

      {/* Header artikel */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor[news.category] ?? "bg-gray-100 text-gray-600"}`}>
            {news.category}
          </span>
          <span className="text-sm text-gray-400">
            {new Date(news.createdAt).toLocaleDateString("id-ID", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
          {news.title}
        </h1>
      </div>

      {/* Gambar */}
      {news.imageUrl && (
        <div className="w-full h-72 md:h-96 rounded-2xl overflow-hidden bg-gray-100 mb-8">
          <img
            src={news.imageUrl}
            alt={news.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Konten */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-10">
        <div className="prose prose-gray max-w-none">
          {news.content.split("\n").map((paragraph, i) =>
            paragraph.trim() ? (
              <p key={i} className="text-gray-700 leading-relaxed mb-4">
                {paragraph}
              </p>
            ) : (
              <br key={i} />
            )
          )}
        </div>
      </div>

      {/* Related news */}
      {related.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Berita Terkait
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((item) => (
              <Link key={item.id} href={`/news/${item.id}`} className="group">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  {item.imageUrl ? (
                    <div className="w-full h-32 overflow-hidden bg-gray-100">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-blue-50 flex items-center justify-center text-3xl">📰</div>
                  )}
                  <div className="p-4">
                    <p className="text-xs text-gray-400 mb-1">
                      {new Date(item.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="mt-8">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline"
        >
          ← Kembali ke News
        </Link>
      </div>
    </div>
  );
}