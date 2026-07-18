"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";

const downloadTemplate = () => {
  const templateData = [
    {
      category: "TWK",
      content: "Contoh soal TWK di sini",
      optionA: "Pilihan A",
      optionB: "Pilihan B",
      optionC: "Pilihan C",
      optionD: "Pilihan D",
      optionE: "Pilihan E",
      correctOption: "A",
      note: "TWK/TIU: isi correctOption (A-E). TKP: kosongkan correctOption",
    },
    {
      category: "TIU",
      content: "Contoh soal TIU di sini",
      optionA: "Pilihan A",
      optionB: "Pilihan B",
      optionC: "Pilihan C",
      optionD: "Pilihan D",
      optionE: "Pilihan E",
      correctOption: "B",
      note: "",
    },
    {
      category: "TKP",
      content: "Contoh soal TKP di sini",
      optionA: "Pilihan A (skor 1)",
      optionB: "Pilihan B (skor 2)",
      optionC: "Pilihan C (skor 3)",
      optionD: "Pilihan D (skor 4)",
      optionE: "Pilihan E (skor 5)",
      correctOption: "",
      note: "TKP: A=1, B=2, C=3, D=4, E=5 otomatis",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set lebar kolom
  ws["!cols"] = [
    { wch: 6 },  // category
    { wch: 40 }, // content
    { wch: 20 }, // optionA
    { wch: 20 }, // optionB
    { wch: 20 }, // optionC
    { wch: 20 }, // optionD
    { wch: 20 }, // optionE
    { wch: 14 }, // correctOption
    { wch: 50 }, // note
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Soal");
  XLSX.writeFile(wb, "template_soal_roemah_bimbel.xlsx");
};

type Category = "TWK" | "TIU" | "TKP";

interface ExamDetail {
  id: string;
  examType: "SKD" | "PSIKOTEST" | "AKADEMIK";
  skdCategory?: string;
  psikotestCategory?: string;
  psikotestConfig?: string;
  akademikCategory?: string;
  akademikTotalSoal?: number;
}

interface Question {
  id: string;
  category: Category;
  subCategory?: string;
  content: string;
  imageUrl?: string;
  orderNum: number;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  aspect?: string;
  correctOption?: string;
  correctOption2?: string;
  scoreA?: number;
  scoreB?: number;
  scoreC?: number;
  scoreD?: number;
  scoreE?: number;
}

const emptyQuestion = (): Omit<Question, "id" | "orderNum"> => ({
  category: "TWK",
  subCategory: "",
  content: "",
  imageUrl: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  optionE: "",
  aspect: "",
  correctOption: "A",
  correctOption2: "",
  scoreA: 1,
  scoreB: 2,
  scoreC: 3,
  scoreD: 4,
  scoreE: 5,
});

const OPTIONS = ["A", "B", "C", "D", "E"] as const;

export default function AdminExamDetailPage() {
  const { id } = useParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyQuestion());
  const [activeTab, setActiveTab] = useState<Category>("TWK");
  const [saving, setSaving] = useState(false);

  const [importing, setImporting] = useState(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [exam, setExam] = useState<ExamDetail | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<string>("");

  const filtered = exam?.examType === "SKD"
    ? questions.filter((q) => q.category === activeTab)
    : questions.filter((q) => q.subCategory === activeSubTab);


  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, string>[];

        if (rows.length === 0) {
          alert("File kosong atau format tidak sesuai!");
          return;
        }

        // Validasi kolom wajib
        const required = ["content", "optionA", "optionB", "optionC", "optionD", "optionE"];
        const firstRow = rows[0];
        const missing = required.filter((col) => !(col in firstRow));
        if (missing.length > 0) {
          alert(`Kolom tidak lengkap: ${missing.join(", ")}`);
          return;
        }

        // ================================================================
        // Logika validasi & filter berbeda per examType
        // ================================================================
        const filteredRows: Record<string, string>[] = [];

        if (exam?.examType === "SKD") {
          const allowedCategories = exam.skdCategory
            ? [exam.skdCategory]
            : ["TWK", "TIU", "TKP"];

          // Validasi kolom category wajib ada untuk SKD
          if (!("category" in firstRow)) {
            alert("Kolom 'category' wajib ada untuk ujian SKD!");
            return;
          }

          // Filter baris dengan kategori tidak sesuai
          const wrongCatRows = rows.filter((r) => !allowedCategories.includes(r.category));
          if (wrongCatRows.length > 0) {
            const wrongCats = [...new Set(wrongCatRows.map((r) => r.category))].join(", ");
            alert(
              exam.skdCategory
                ? `Ujian ini hanya menerima soal ${exam.skdCategory}. Ditemukan kategori: ${wrongCats}`
                : `Kategori tidak valid: ${wrongCats}. Hanya TWK, TIU, TKP yang diperbolehkan.`
            );
            return;
          }

          // Filter baris yang melebihi limit per kategori
          const limits: Record<string, number> = { TWK: 30, TIU: 35, TKP: 45 };
          const counts: Record<string, number> = {
            TWK: categoryCount("TWK"),
            TIU: categoryCount("TIU"),
            TKP: categoryCount("TKP"),
          };
          const skipped: Record<string, number> = { TWK: 0, TIU: 0, TKP: 0 };

          for (const row of rows) {
            const cat = row.category;
            if (!allowedCategories.includes(cat)) continue;
            if (counts[cat] < limits[cat]) {
              filteredRows.push(row);
              counts[cat]++;
            } else {
              skipped[cat] = (skipped[cat] ?? 0) + 1;
            }
          }

          const totalSkipped = Object.values(skipped).reduce((a, b) => a + b, 0);
          if (totalSkipped > 0) {
            const skipMsg = Object.entries(skipped)
              .filter(([, v]) => v > 0)
              .map(([k, v]) => `${k}: ${v} soal`)
              .join(", ");
            alert(`⚠️ ${totalSkipped} soal dilewati karena melebihi batas:\n${skipMsg}`);
          }

        } else if (exam?.examType === "PSIKOTEST") {
          // Psikotest: validasi subCategory sesuai config
          const config = getPsikotestConfig();
          const allowedSubs = Object.keys(config);

          if (allowedSubs.length === 0) {
            alert("Konfigurasi psikotest belum diatur!");
            return;
          }

          // Validasi kolom subCategory
          if (!("subCategory" in firstRow)) {
            alert("Kolom 'subCategory' wajib ada untuk ujian Psikotest!\nIsi dengan: " + allowedSubs.join(", "));
            return;
          }

          const wrongSubRows = rows.filter((r) => !allowedSubs.includes(r.subCategory));
          if (wrongSubRows.length > 0) {
            const wrongSubs = [...new Set(wrongSubRows.map((r) => r.subCategory))].join(", ");
            alert(`Sub-kategori tidak valid: ${wrongSubs}\nYang diperbolehkan: ${allowedSubs.join(", ")}`);
            return;
          }

          // Filter melebihi limit per subCategory
          const counts: Record<string, number> = {};
          allowedSubs.forEach((sub) => { counts[sub] = subCategoryCount(sub); });
          const skipped: Record<string, number> = {};

          for (const row of rows) {
            const sub = row.subCategory;
            if (!allowedSubs.includes(sub)) continue;
            const limit = config[sub] ?? 0;
            if (counts[sub] < limit) {
              filteredRows.push(row);
              counts[sub]++;
            } else {
              skipped[sub] = (skipped[sub] ?? 0) + 1;
            }
          }

          const totalSkipped = Object.values(skipped).reduce((a, b) => a + b, 0);
          if (totalSkipped > 0) {
            const skipMsg = Object.entries(skipped)
              .filter(([, v]) => v > 0)
              .map(([k, v]) => `${k}: ${v} soal`)
              .join(", ");
            alert(`⚠️ ${totalSkipped} soal dilewati karena melebihi batas:\n${skipMsg}`);
          }

        } else if (exam?.examType === "AKADEMIK") {
          filteredRows.push(...rows);
        }

        if (filteredRows.length === 0) {
          alert("Tidak ada soal yang bisa diimport — semua kategori sudah penuh!");
          return;
        }

        const confirm_import = confirm(`Akan mengimport ${filteredRows.length} soal. Lanjutkan?`);
        if (!confirm_import) return;

        setImporting(true);
        let success = 0;
        let failed = 0;

        for (const row of filteredRows) {
          try {
            const payload: Record<string, string | null> = {
              content: row.content,
              optionA: row.optionA,
              optionB: row.optionB,
              optionC: row.optionC,
              optionD: row.optionD,
              optionE: row.optionE,
              correctOption: row.correctOption || null,
              correctOption2: row.correctOption2 || null,
            };

            // Tambah field sesuai examType
            if (exam?.examType === "SKD") {
              payload.category = exam.skdCategory || row.category;
            } else if (exam?.examType === "PSIKOTEST") {
              payload.category = "TWK"; // placeholder
              payload.subCategory = row.subCategory;
            } else if (exam?.examType === "AKADEMIK") {
              payload.category = "TWK"; // placeholder
              payload.subCategory = exam.akademikCategory || null;
            }

            const res = await fetch(`/api/exams/${id}/questions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (res.ok) success++;
            else failed++;
          } catch {
            failed++;
          }
        }

        await fetchQuestions();
        setImporting(false);
        alert(`Import selesai!\n✅ Berhasil: ${success} soal\n❌ Gagal: ${failed} soal`);

      } catch {
        alert("Gagal membaca file. Pastikan format Excel sesuai template.");
        setImporting(false);
      }
    };

    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      console.error("Upload gagal:", await res.text());
      return null;
    }
    const data = await res.json();
    return data.url;
  };

  const categoryCount = (cat: Category) =>
    questions.filter((q) => q.category === cat).length;

  // Ganti categoryCount & categoryLimits dengan yang lebih fleksibel
  const getPsikotestConfig = (): Record<string, number> => {
    if (!exam?.psikotestConfig) return {};
    try { return JSON.parse(exam.psikotestConfig); } catch { return {}; }
  };

  const getSubCategories = (): string[] => {
    if (!exam) return [];
    if (exam.examType === "SKD") {
      if (exam.skdCategory) return [exam.skdCategory];
      return ["TWK", "TIU", "TKP"];
    }
    if (exam.examType === "PSIKOTEST") return Object.keys(getPsikotestConfig());
    if (exam.examType === "AKADEMIK") return [exam.akademikCategory ?? ""];
    return [];
  };

  const subCategoryCount = (sub: string) =>
    exam?.examType === "SKD"
      ? questions.filter((q) => q.category === sub).length
      : questions.filter((q) => q.subCategory === sub).length;

  const getLimit = (sub: string): number => {
    if (exam?.examType === "SKD") {
      return sub === "TWK" ? 30 : sub === "TIU" ? 35 : 45;
    }
    if (exam?.examType === "PSIKOTEST") {
      return getPsikotestConfig()[sub] ?? 0;
    }
    return Infinity; // Akademik tidak ada limit ketat
  };

  const openCreate = () => {
    setEditId(null);
    
    let defaultCat: Category = "TWK";
    let defaultSub = "";

    if (exam?.examType === "SKD") {
      // Jika sedang di tab TWK, set form ke TWK
      defaultCat = activeTab; 
    } else {
      // Jika sedang di tab Kecerdasan, set form ke Kecerdasan
      defaultSub = activeSubTab; 
    }

    setForm({
      ...emptyQuestion(),
      category: defaultCat,
      subCategory: defaultSub,
    });
    
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = (q: Question) => {
    setEditId(q.id);
    setForm({
      category: q.category,
      subCategory: q.subCategory ?? "",
      content: q.content,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      optionE: q.optionE,
      aspect: q.aspect ?? "",
      correctOption: q.correctOption ?? "A",
      correctOption2: q.correctOption2 ?? "",
      scoreA: q.scoreA,
      scoreB: q.scoreB,
      scoreC: q.scoreC,
      scoreD: q.scoreD,
      scoreE: q.scoreE,
    });
    setImagePreview(null);
    setImageFile(null);
    setShowModal(true);
  };

  const fetchQuestions = useCallback(async () => {
    const res = await fetch(`/api/exams/${id}/questions`);
    const data = await res.json();
    setQuestions(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      const [examRes, questionsRes] = await Promise.all([
        fetch(`/api/exams/${id}`),
        fetch(`/api/exams/${id}/questions`),
      ]);
      const examData = await examRes.json();
      const questionsData = await questionsRes.json();

      if (isMounted) {
        setExam(examData);
        setQuestions(questionsData);

        // Set active tab sesuai skdCategory
        if (examData.examType === "SKD" && examData.skdCategory) {
          setActiveTab(examData.skdCategory as Category);
        }

        // Set active sub tab untuk Psikotest/Akademik
        if (examData.examType !== "SKD") {
          let defaultSub = "";
          if (examData.examType === "PSIKOTEST" && examData.psikotestConfig) {
            try {
              const config = JSON.parse(examData.psikotestConfig);
              defaultSub = Object.keys(config)[0] || "";
            } catch {
              defaultSub = "";
            }
          } else if (examData.examType === "AKADEMIK") {
            defaultSub = examData.akademikCategory || "";
          }
          if (defaultSub) setActiveSubTab(defaultSub);
        }

        setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [id]);

  const checkCategoryLimit = (category: Category): boolean => {
    if (editId) return true;
    if (exam?.examType !== "SKD") return true; // Psikotest & Akademik: cek di API
    const limits: Record<Category, number> = { TWK: 30, TIU: 35, TKP: 45 };
    return categoryCount(category) < limits[category];
  };

  const handleSave = async () => {
    if (!form.content) return;
    if (!checkCategoryLimit(form.category)) {
      alert(`Kategori ${form.category} sudah mencapai batas maksimal!`);
      return;
    }

    setSaving(true);
    let imageUrl = form.imageUrl ?? "";
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (uploaded) imageUrl = uploaded;
    }

    const payload = { ...form, imageUrl: imageUrl || null };

    if (editId) {
      const res = await fetch(`/api/exams/${id}/questions/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(`Gagal menyimpan: ${data.error}`);
        setSaving(false);
        return;
      }
    } else {
      const res = await fetch(`/api/exams/${id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(`Gagal menyimpan: ${data.error}`);
        setSaving(false);
        return;
      }
    }

    await fetchQuestions();
    setSaving(false);
    setShowModal(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSaveAndNext = async () => {
    if (!form.content) return;
    if (!checkCategoryLimit(form.category)) {
      alert(`Kategori ${form.category} sudah mencapai batas maksimal!`);
      return;
    }

    setSaving(true);

    let imageUrl = form.imageUrl ?? "";
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (uploaded) imageUrl = uploaded;
      else {
        alert("Gagal mengupload gambar!");
        setSaving(false);
        return;
      }
    }

    const res = await fetch(`/api/exams/${id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, imageUrl: imageUrl || null }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(`Gagal menyimpan soal: ${data.error}`);
      setSaving(false);
      return;
    }

    await fetchQuestions();
    setSaving(false);

    // Reset form tapi pertahankan subCategory & category
    setForm({
      ...emptyQuestion(),
      category: form.category,
      subCategory: form.subCategory,
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleDelete = async (qid: string) => {
    if (!confirm("Yakin hapus soal ini?")) return;
    await fetch(`/api/exams/${id}/questions/${qid}`, { method: "DELETE" });
    await fetchQuestions();
  };

  const categoryLimits: Record<Category, number> = {
    TWK: 30,
    TIU: 35,
    TKP: 45,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/exams"
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ← Kembali
          </Link>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">
              Input Soal
            </h1>
            <p className="text-xs text-gray-500">Exam ID: {id}</p>
          </div>
        </div>

        {/* ACTION BUTTON */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={downloadTemplate}
            className="flex-1 md:flex-none border border-gray-200 text-gray-600 text-xs md:text-sm px-3 py-2 rounded-lg"
          >
            ⬇ Template
          </button>

          <label className={`flex-1 md:flex-none border border-green-200 text-green-700 text-xs md:text-sm px-3 py-2 rounded-lg text-center cursor-pointer ${importing ? "opacity-50 pointer-events-none" : ""}`}>
            {importing ? "Mengimport..." : "📂 Import"}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          <button
            onClick={openCreate}
            className="flex-1 md:flex-none bg-blue-600 text-white text-xs md:text-sm px-3 py-2 rounded-lg"
          >
            + Soal
          </button>
        </div>
      </div>

      {/* Progress Bar per Kategori */}
      {exam?.examType === "SKD" && (
        <div className={`grid gap-4 mb-6 ${
          exam.skdCategory ? "grid-cols-1" : "grid-cols-3"
        }`}>
          {(exam.skdCategory
            ? [exam.skdCategory as Category]
            : ["TWK", "TIU", "TKP"] as Category[]
          ).map((cat) => {
            const count = categoryCount(cat);
            const limit = categoryLimits[cat];
            const pct = Math.round((count / limit) * 100);
            return (
              <div key={cat} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">{cat}</span>
                  <span className="text-sm text-gray-500">{count}/{limit}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${
                    count >= limit ? "bg-green-500" : "bg-blue-500"
                  }`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{pct}% terpenuhi</p>
              </div>
            );
          })}
        </div>
      )}

      {exam?.examType === "PSIKOTEST" && (
        <div className={`grid gap-4 mb-6 ${
          getSubCategories().length > 1 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1"
        }`}>
          {getSubCategories().map((sub) => {
            const count = subCategoryCount(sub);
            const limit = getLimit(sub);
            const pct = Math.round((count / limit) * 100);
            
            // Format teks: KECERDASAN -> Kecerdasan
            const formattedSub = sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();

            return (
              <div key={sub} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-700">{formattedSub}</span>
                  <span className={`text-sm font-medium ${count >= limit ? "text-green-600" : "text-gray-500"}`}>
                    {count}/{limit}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      count >= limit ? "bg-green-500" : "bg-purple-500"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }} 
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 uppercase">{pct}% Terpenuhi</p>
              </div>
            );
          })}
        </div>
      )}

      {exam?.examType === "AKADEMIK" && (
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">
            {exam.akademikCategory?.replace(/_/g, " ")}
          </span>
          <span className="text-sm text-gray-500">
            {questions.length}/{exam.akademikTotalSoal ?? "∞"}
          </span>
        </div>
        {exam.akademikTotalSoal && (
          <>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  questions.length >= exam.akademikTotalSoal ? "bg-green-500" : "bg-orange-500"
                }`}
                style={{ width: `${Math.min((questions.length / exam.akademikTotalSoal) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {Math.round((questions.length / exam.akademikTotalSoal) * 100)}% terpenuhi
            </p>
          </>
        )}
      </div>
    )}

      {/* Tab Kategori */}
      {exam?.examType === "SKD" && (
        <div className="flex gap-2 mb-4">
          {(exam.skdCategory
            ? [exam.skdCategory as Category]
            : ["TWK", "TIU", "TKP"] as Category[]
          ).map((cat) => (
            <button key={cat} onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === cat
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
              {cat} ({categoryCount(cat)})
            </button>
          ))}
        </div>
      )}

      {(exam?.examType === "PSIKOTEST" || exam?.examType === "AKADEMIK") && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {getSubCategories().map((sub) => {
            const isActive = activeSubTab === sub;
            const isAkademik = exam?.examType === "AKADEMIK";

            // Format teks: KECERDASAN -> Kecerdasan
            const formattedSub = sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();

            const activeClass = isAkademik 
              ? "bg-orange-50 text-orange-600 border-orange-200" 
              : "bg-purple-600 text-white";

            return (
              <button
                key={sub}
                onClick={() => setActiveSubTab(sub)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  isActive
                    ? activeClass
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {formattedSub} ({subCategoryCount(sub)}/{getLimit(sub) === Infinity ? "∞" : getLimit(sub)})
              </button>
            );
          })}
        </div>
      )}

      {/* Daftar Soal */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl py-12 text-center text-gray-400">
              {(() => {
                const rawLabel = exam?.examType === "SKD" ? activeTab : activeSubTab;
                
                const formattedLabel = rawLabel
                  ? rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1).toLowerCase()
                  : "";

                return (
                  <>
                    Belum ada soal {formattedLabel}. Klik &quot;Tambah Soal&quot; untuk mulai.
                  </>
                );
              })()}
            </div>
        )}

        {filtered.map((q, idx) => (
          <div
            key={q.id}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {/* Badge kategori — tampilkan subCategory untuk Psikotest/Akademik */}
                  {exam?.examType === "SKD" ? (
                    <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                      {q.category}
                    </span>
                  ) : exam?.examType === "AKADEMIK" ? (
                    <span className="text-xs font-semibold bg-orange-50 text-orange-600 px-2 py-0.5 rounded">
                      {q.subCategory ?? exam?.akademikCategory ?? "-"}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold bg-purple-50 text-purple-600 px-2 py-0.5 rounded">
                      {q.subCategory ?? exam?.akademikCategory ?? "-"}
                    </span>
                  )}
                  {q.category === "TKP" && q.aspect && (
                    <span className="text-xs font-medium bg-purple-50 text-purple-600 px-2 py-0.5 rounded">
                      {q.aspect}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">Soal #{idx + 1}</span>
                </div>

                <p className="text-sm text-gray-800 mb-3">{q.content}</p>

                {/* Tampilkan gambar kalau ada */}
                {q.imageUrl && q.imageUrl.trim() !== "" && (
                <div className="mb-3">
                  <img
                    src={q.imageUrl}
                    alt="Gambar soal"
                    className="max-h-40 w-auto object-contain rounded-lg border border-gray-200 bg-gray-50"
                    onError={(e) => {
                      // Jika gambar gagal dimuat (broken link), sembunyikan elemennya
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {OPTIONS.map((opt) => (
                    <div
                      key={opt}
                      className={`text-xs px-2 py-1 rounded border ${
                        q.category !== "TKP" && q.correctOption === opt
                          ? "border-green-300 bg-green-50 text-green-700 font-medium"
                          : "border-gray-100 bg-gray-50 text-gray-600"
                      }`}
                    >
                      <span className="font-semibold">{opt}.</span>{" "}
                      {q[`option${opt}` as keyof Question] as string}
                      {q.category === "TKP" && (
                        <span className="ml-1 text-blue-500">
                          ({q[`score${opt}` as keyof Question]})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(q)}
                  className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="text-xs border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 text-red-500"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah/Edit Soal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editId ? "Edit Soal" : `Tambah Soal #${questions.length + 1}`}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {exam?.examType === "SKD" && (
                    exam?.skdCategory
                      ? `${exam.skdCategory} ${categoryCount(exam.skdCategory as Category)}/${
                          exam.skdCategory === "TWK" ? 30 : exam.skdCategory === "TIU" ? 35 : 45
                        }`
                      : `TWK ${categoryCount("TWK")}/30 · TIU ${categoryCount("TIU")}/35 · TKP ${categoryCount("TKP")}/45`
                  )}
                  {exam?.examType === "PSIKOTEST" && (
                    Object.entries(getPsikotestConfig())
                      .map(([sub, limit]) => `${sub} ${subCategoryCount(sub)}/${limit}`)
                      .join(" · ")
                  )}
                  {exam?.examType === "AKADEMIK" && (
                    `${exam.akademikCategory?.replace(/_/g, " ")} ${questions.length}/${exam.akademikTotalSoal ?? "∞"}`
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-light"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Kategori */}
              {exam?.examType === "SKD" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Kategori
                  </label>
                  {exam.skdCategory ? (
                    // Sub-kategori: tampilkan info saja, tidak bisa diubah
                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-blue-600 font-semibold">
                        Kategori: {exam.skdCategory} — {
                          exam.skdCategory === "TWK" ? "Tes Wawasan Kebangsaan" :
                          exam.skdCategory === "TIU" ? "Tes Intelegensia Umum" :
                          "Tes Karakteristik Pribadi"
                        }
                      </p>
                    </div>
                  ) : (
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                      className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="TWK" disabled={categoryCount("TWK") >= 30 && form.category !== "TWK"}>
                        TWK — Tes Wawasan Kebangsaan ({categoryCount("TWK")}/30)
                        {categoryCount("TWK") >= 30 ? " ✓ Penuh" : ""}
                      </option>
                      <option value="TIU" disabled={categoryCount("TIU") >= 35 && form.category !== "TIU"}>
                        TIU — Tes Intelegensia Umum ({categoryCount("TIU")}/35)
                        {categoryCount("TIU") >= 35 ? " ✓ Penuh" : ""}
                      </option>
                      <option value="TKP" disabled={categoryCount("TKP") >= 45 && form.category !== "TKP"}>
                        TKP — Tes Karakteristik Pribadi ({categoryCount("TKP")}/45)
                        {categoryCount("TKP") >= 45 ? " ✓ Penuh" : ""}
                      </option>
                    </select>
                  )}
                </div>
              )}

              {exam?.examType === "PSIKOTEST" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Sub-Kategori
                  </label>
                  <select
                    value={form.subCategory ?? ""}
                    onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
                    className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getSubCategories().map((sub) => {
                      const count = subCategoryCount(sub);
                      const limit = getLimit(sub);
                      const isFull = count >= limit && !editId;

                      return (
                        <option key={sub} value={sub} disabled={isFull}>
                          {sub} ({count}/{limit}) {isFull ? "— PENUH" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {exam?.examType === "AKADEMIK" && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  <p className="text-xs text-blue-600 font-semibold">
                    Kategori: {exam.akademikCategory?.replace(/_/g, " ")}
                  </p>
                </div>
              )}

              {/* Aspek — hanya SKD TKP */}
              {exam?.examType === "SKD" && form.category === "TKP" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Aspek TKP
                  </label>
                  <select
                    value={form.aspect ?? ""}
                    onChange={(e) => setForm({ ...form, aspect: e.target.value })}
                    className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Pilih Aspek —</option>
                    <option value="Profesionalisme">Profesionalisme</option>
                    <option value="Jejaring Kerja">Jejaring Kerja</option>
                    <option value="Sosial Budaya">Sosial Budaya</option>
                    <option value="Anti Radikalisme">Anti Radikalisme</option>
                    <option value="Teknologi Informasi dan Komunikasi">Teknologi Informasi dan Komunikasi</option>
                    <option value="Pelayanan Publik">Pelayanan Publik</option>
                  </select>
                </div>
              )}

              {/* correctOption2 — hanya Psikotest */}
              {exam?.examType === "PSIKOTEST" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Jawaban Benar Ke-2 <span className="text-gray-300 font-normal normal-case">(opsional)</span>
                  </label>
                  <select
                    value={form.correctOption2 ?? ""}
                    onChange={(e) => setForm({ ...form, correctOption2: e.target.value })}
                    className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Tidak ada —</option>
                    {OPTIONS.filter((o) => o !== form.correctOption).map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Konten Soal */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Teks Soal
                </label>
                <textarea
                  rows={3}
                  placeholder="Tulis soal di sini..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Gambar Soal (opsional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Gambar Soal <span className="text-gray-300 font-normal normal-case">(opsional)</span>
                </label>

                {/* Preview gambar */}
                {imagePreview && (
                  <div className="relative mb-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
                    />
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                        setForm({ ...form, imageUrl: "" });
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg hover:bg-red-600"
                    >
                      Hapus
                    </button>
                  </div>
                )}

                {/* Tampilkan gambar lama saat edit */}
                {!imagePreview && form.imageUrl && (
                  <div className="relative mb-2">
                    <img
                      src={form.imageUrl}
                      alt="Gambar soal"
                      className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
                    />
                    <button
                      onClick={() => setForm({ ...form, imageUrl: "" })}
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg hover:bg-red-600"
                    >
                      Hapus
                    </button>
                  </div>
                )}

                {/* Input file */}
                {!imagePreview && !form.imageUrl && (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <span className="text-2xl mb-1">🖼️</span>
                    <span className="text-sm text-gray-500">Klik untuk upload gambar</span>
                    <span className="text-xs text-gray-400 mt-0.5">PNG, JPG, JPEG (maks. 2MB)</span>
                    <input
                      type="file"
                      accept="image/png,image/jpg,image/jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          alert("Ukuran gambar maksimal 2MB!");
                          return;
                        }
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Opsi Jawaban */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Pilihan Jawaban
                </label>
                <div className="flex flex-col gap-2">
                  {OPTIONS.map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-500 w-5">{opt}</span>
                      <input
                        type="text"
                        placeholder={`Opsi ${opt}`}
                        value={form[`option${opt}` as keyof typeof form] as string}
                        onChange={(e) =>
                          setForm({ ...form, [`option${opt}`]: e.target.value })
                        }
                        className="flex-1 border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {form.category !== "TKP" && (
                        <input
                          type="radio"
                          name="correctOption"
                          checked={form.correctOption === opt}
                          onChange={() => setForm({ ...form, correctOption: opt })}
                          className="w-4 h-4 accent-blue-600"
                          title="Jawaban benar"
                        />
                      )}
                      {form.category === "TKP" && (
                        <span className="w-16 text-center text-sm font-semibold text-blue-600 border border-blue-100 bg-blue-50 rounded-lg px-2 py-2">
                          {OPTIONS.indexOf(opt) + 1}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {form.category !== "TKP" && (
                  <p className="text-xs text-gray-400 mt-1">
                    ● Pilih radio button di kanan untuk menandai jawaban benar
                  </p>
                )}
                {form.category === "TKP" && (
                  <p className="text-xs text-gray-400 mt-1">
                    ● Nilai tetap A=1, B=2, C=3, D=4, E=5 — urutan diacak saat ujian
                  </p>
                )}
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Selesai
              </button>

              {/* Simpan & Tutup — hanya saat edit */}
              {editId && (
                <button
                  onClick={handleSave}
                  className="flex-1 border border-blue-200 text-blue-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  Simpan Perubahan
                </button>
              )}

              {/* Simpan & Lanjut — hanya saat tambah baru */}
              {!editId && (
                <>
                  <button
                    onClick={handleSaveAndNext}
                    className="flex-1 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Simpan & Lanjut →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}