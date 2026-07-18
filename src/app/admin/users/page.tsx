"use client";
import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STUDENT";
  isPremium: boolean;
  createdAt: string;
  _count: { attempts: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (isMounted) {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const handleUpdate = async (userId: string, data: Partial<User>) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      alert(result.error);
      return;
    }
    await fetchUsers();
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Yakin hapus akun "${userName}"? Semua data ujian user ini akan ikut terhapus.`)) return;

    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    const result = await res.json();

    if (!res.ok) {
      alert(result.error);
      return;
    }
    await fetchUsers();
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalAdmin = users.filter((u) => u.role === "ADMIN").length;
  const totalPremium = users.filter((u) => u.isPremium).length;
  const totalStudent = users.filter((u) => u.role === "STUDENT").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen User</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola akun siswa dan admin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Siswa", value: totalStudent, color: "bg-blue-50 text-blue-600" },
          { label: "Total Admin", value: totalAdmin, color: "bg-purple-50 text-purple-600" },
          { label: "User Premium", value: totalPremium, color: "bg-yellow-50 text-yellow-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className={`text-2xl font-bold ${stat.color.split(" ")[1]}`}>{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Nama</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Email</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Role</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Premium</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Ujian</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Bergabung</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {/* Nama */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                          {user.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Premium */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.isPremium
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-400"
                      }`}>
                        {user.isPremium ? "Premium" : "Free"}
                      </span>
                    </td>

                    {/* Jumlah ujian */}
                    <td className="px-6 py-4 text-gray-600">
                      {user._count.attempts} ujian
                    </td>

                    {/* Tanggal bergabung */}
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(user.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Toggle Premium */}
                        <button
                          onClick={() => handleUpdate(user.id, { isPremium: !user.isPremium })}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                            user.isPremium
                              ? "border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                          title={user.isPremium ? "Cabut Premium" : "Set Premium"}
                        >
                          {user.isPremium ? "⭐ Cabut" : "⭐ Premium"}
                        </button>

                        {/* Toggle Role */}
                        <button
                          onClick={() =>
                            handleUpdate(user.id, {
                              role: user.role === "ADMIN" ? "STUDENT" : "ADMIN",
                            })
                          }
                          className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                            user.role === "ADMIN"
                              ? "border-purple-200 text-purple-600 hover:bg-purple-50"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                          title={user.role === "ADMIN" ? "Jadikan Student" : "Jadikan Admin"}
                        >
                          {user.role === "ADMIN" ? "👤 Demote" : "🔑 Admin"}
                        </button>

                        {/* Hapus */}
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 font-medium transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {search ? `Tidak ada user dengan kata kunci "${search}"` : "Belum ada user terdaftar"}
          </div>
        )}
      </div>
    </div>
  );
}