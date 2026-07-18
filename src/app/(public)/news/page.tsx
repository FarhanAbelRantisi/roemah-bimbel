import Link from "next/link";
import { prisma } from "@/lib/prisma";
export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getNews() {
  try {
    return await prisma.news.findMany({
      where: { isPublished: true },
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

export default async function NewsPage() {
  const newsList = await getNews();
  const featured = newsList[0];
  const rest = newsList.slice(1);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2">
          Berita & Informasi
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          News Center
        </h1>
        <p className="text-gray-500 mt-2">
          Tips belajar, pengumuman, dan informasi terbaru dari Roemah Bimbel.
        </p>
      </div>

      {newsList.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">📰</p>
          <p className="text-lg font-medium">Belum ada berita</p>
        </div>
      )}

      {/* Featured news */}
      {featured && (
        <Link href={`/news/${featured.id}`} className="block mb-10 group">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
            {featured.imageUrl && (
              <div className="w-full h-64 overflow-hidden bg-gray-100">
                <img
                  src={featured.imageUrl}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor[featured.category] ?? "bg-gray-100 text-gray-600"}`}>
                  {featured.category}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(featured.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </span>
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
                  Terbaru
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {featured.title}
              </h2>
              <p className="text-gray-500 line-clamp-2">{featured.content}</p>
            </div>
          </div>
        </Link>
      )}

      {/* Grid berita lainnya */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((news) => (
            <Link key={news.id} href={`/news/${news.id}`} className="group">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                {news.imageUrl ? (
                  <div className="w-full h-44 overflow-hidden bg-gray-100">
                    <img
                      src={news.imageUrl}
                      alt={news.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-4xl">
                    📰
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor[news.category] ?? "bg-gray-100 text-gray-600"}`}>
                      {news.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(news.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {news.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 flex-1">{news.content}</p>
                  <p className="text-blue-600 text-sm font-medium mt-3">Baca selengkapnya →</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
