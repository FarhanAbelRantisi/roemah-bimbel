"use client";
import { useState, useEffect, useCallback } from "react";

interface News {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl: string | null;
  isPublished: boolean;
  createdAt: string;
}

const CATEGORIES = ["UPDATE", "FEATURE", "EVENT", "TIPS", "PENGUMUMAN"];

const emptyForm = () => ({
  title: "",
  content: "",
  category: "UPDATE",
  imageUrl: "",
  isPublished: false,
});

export default function AdminNewsPage() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    const res = await fetch("/api/news");
    const data = await res.json();
    setNewsList(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const res = await fetch("/api/news");
      const data = await res.json();
      if (isMounted) {
        setNewsList(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url;
  };

  const handleSave = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);

    let imageUrl = form.imageUrl;
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (uploaded) imageUrl = uploaded;
    }

    const payload = { ...form, imageUrl };

    if (editId) {
      await fetch(`/api/news/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    await fetchNews();
    setSaving(false);
    setShowModal(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus berita ini?")) return;
    await fetch(`/api/news/${id}`, { method: "DELETE" });
    await fetchNews();
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    await fetch(`/api/news/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !current }),
    });
    await fetchNews();
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = (news: News) => {
    setEditId(news.id);
    setForm({
      title: news.title,
      content: news.content,
      category: news.category,
      imageUrl: news.imageUrl ?? "",
      isPublished: news.isPublished,
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const categoryColor: Record<string, string> = {
    UPDATE: "bg-blue-100 text-blue-700",
    FEATURE: "bg-purple-100 text-purple-700",
    EVENT: "bg-green-100 text-green-700",
    TIPS: "bg-yellow-100 text-yellow-700",
    PENGUMUMAN: "bg-red-100 text-red-700",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">News & CMS</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola berita dan pengumuman</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Tulis Berita
        </button>
      </div>

      {/* List berita */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat data...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {newsList.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white border border-gray-200 rounded-xl">
              Belum ada berita. Tulis berita pertamamu!
            </div>
          )}
          {newsList.map((news) => (
            <div
              key={news.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4"
            >
              {/* Thumbnail */}
              {news.imageUrl && (
                <div className="w-24 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  <img
                    src={news.imageUrl}
                    alt={news.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor[news.category] ?? "bg-gray-100 text-gray-600"}`}>
                    {news.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(news.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 truncate">{news.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{news.content}</p>
              </div>

              {/* Aksi */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTogglePublish(news.id, news.isPublished)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                    news.isPublished
                      ? "border-green-200 text-green-700 hover:bg-green-50"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {news.isPublished ? "✓ Published" : "Draft"}
                </button>
                <button
                  onClick={() => openEdit(news)}
                  className="text-xs border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(news.id)}
                  className="text-xs border border-red-100 px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-red-500"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editId ? "Edit Berita" : "Tulis Berita Baru"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Kategori
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Judul */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Judul
                </label>
                <input
                  type="text"
                  placeholder="Judul berita..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Gambar */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Gambar <span className="font-normal text-gray-300 normal-case">(opsional)</span>
                </label>
                {(imagePreview || form.imageUrl) ? (
                  <div className="relative mb-2">
                    <img
                      src={imagePreview || form.imageUrl || ""}
                      alt="Preview"
                      className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                        setForm({ ...form, imageUrl: "" });
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <svg className="w-7 h-7 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span className="text-sm text-gray-500">Klik untuk upload gambar</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Konten */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Konten
                </label>
                <textarea
                  rows={8}
                  placeholder="Tulis konten berita di sini..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Publish */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isPublished" className="text-sm text-gray-700">
                  Langsung publish
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Publish Berita"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}