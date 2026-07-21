"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import CustomModal, { ModalState } from "@/components/CustomModal";

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
  title: string;
  duration: number;
  isPremium?: boolean;
  isPublished?: boolean;
  examType: "SKD" | "PSIKOTEST" | "AKADEMIK" | "PSIKOTEST_TNI";
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
  const [modalConfig, setModalConfig] = useState<ModalState>({ isOpen: false, title: "" });

  const showAlert = (title: string, message?: string, details?: string[], type: "info" | "success" | "warning" | "danger" = "warning") => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
      details,
      confirmText: "Tutup",
      onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalConfig({
      isOpen: true,
      type: "danger",
      title,
      message,
      confirmText: "Hapus Permanen",
      cancelText: "Batal",
      onConfirm: () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
    });
  };

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
          showAlert("File Kosong", "File yang diunggah tidak memiliki data soal.", undefined, "warning");
          return;
        }

        // Validasi kolom wajib
        const required = ["content", "optionA", "optionB", "optionC", "optionD", "optionE"];
        const firstRow = rows[0];
        const missing = required.filter((col) => !(col in firstRow));
        if (missing.length > 0) {
          showAlert("Format File Salah", `Kolom wajib tidak lengkap: ${missing.join(", ")}`, undefined, "danger");
          return;
        }

        // ================================================================
        // Logika validasi & filter berbeda per examType
        // ================================================================
        const filteredRows: Record<string, string>[] = [];

        if (exam?.examType === "SKD") {
          const allowedCategories = exam?.skdCategory
            ? [exam.skdCategory]
            : ["TWK", "TIU", "TKP"];

          // Validasi kolom category wajib ada untuk SKD
          if (!("category" in firstRow)) {
            showAlert("Kolom Belum Lengkap", "Kolom 'category' wajib ada untuk ujian SKD!", undefined, "warning");
            return;
          }

          // Filter baris dengan kategori tidak sesuai
          const wrongCatRows = rows.filter((r) => !allowedCategories.includes(r.category));
          if (wrongCatRows.length > 0) {
            const wrongCats = [...new Set(wrongCatRows.map((r) => r.category))].join(", ");
            showAlert(
              "Kategori Tidak Sesuai",
              exam?.skdCategory
                ? `Ujian ini hanya menerima soal ${exam.skdCategory}. Ditemukan kategori: ${wrongCats}`
                : `Kategori tidak valid: ${wrongCats}. Hanya TWK, TIU, TKP yang diperbolehkan.`,
              undefined,
              "danger"
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
            showAlert("Soal Dilewati", `${totalSkipped} soal dilewati karena kuota sudah penuh:`, [skipMsg], "warning");
          }

        } else if (exam?.examType === "PSIKOTEST") {
          // Psikotest: validasi subCategory sesuai config
          const config = getPsikotestConfig();
          const allowedSubs = Object.keys(config);

          if (allowedSubs.length === 0) {
            showAlert("Konfigurasi Belum Diatur", "Konfigurasi psikotest belum diatur di ujian ini.", undefined, "warning");
            return;
          }

          // Validasi kolom subCategory
          if (!("subCategory" in firstRow)) {
            showAlert("Kolom Belum Lengkap", `Kolom 'subCategory' wajib ada untuk ujian Psikotest!\nIsi dengan: ${allowedSubs.join(", ")}`, undefined, "warning");
            return;
          }

          const wrongSubRows = rows.filter((r) => !allowedSubs.includes(r.subCategory));
          if (wrongSubRows.length > 0) {
            const wrongSubs = [...new Set(wrongSubRows.map((r) => r.subCategory))].join(", ");
            showAlert("Sub-Kategori Tidak Sesuai", `Sub-kategori tidak valid: ${wrongSubs}\nYang diperbolehkan: ${allowedSubs.join(", ")}`, undefined, "danger");
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
            showAlert("Soal Dilewati", `${totalSkipped} soal dilewati karena kuota sudah penuh:`, [skipMsg], "warning");
          }

        } else if (exam?.examType === "AKADEMIK") {
          filteredRows.push(...rows);
        }

        if (filteredRows.length === 0) {
          showAlert("Kuota Penuh", "Tidak ada soal yang dapat diimport karena kuota seluruh kategori/sub-kategori telah terisi penuh.", undefined, "warning");
          return;
        }

        const processImport = async () => {
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

              if (exam?.examType === "SKD") {
                payload.category = exam?.skdCategory || row.category;
              } else if (exam?.examType === "PSIKOTEST" || exam?.examType === "PSIKOTEST_TNI") {
                payload.category = "TWK"; // placeholder
                payload.subCategory = row.subCategory || (exam?.psikotestCategory && exam.psikotestCategory !== "GABUNGAN_TNI" ? exam.psikotestCategory : null);
              } else if (exam?.examType === "AKADEMIK") {
                payload.category = "TWK"; // placeholder
                payload.subCategory = exam?.akademikCategory || null;
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
          showAlert("Import Selesai", `Proses import telah selesai.`, [`Berhasil: ${success} soal`, `Gagal: ${failed} soal`], "success");
        };

        setModalConfig({
          isOpen: true,
          type: "info",
          title: "Konfirmasi Import",
          message: `Sistem akan memasukkan ${filteredRows.length} soal ke dalam ujian ini. Lanjutkan?`,
          confirmText: "Ya, Import",
          cancelText: "Batal",
          onConfirm: () => {
            setModalConfig((prev) => ({ ...prev, isOpen: false }));
            processImport();
          },
          onCancel: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
        });

      } catch {
        showAlert("Gagal Membaca File", "Terjadi kesalahan saat membaca file Excel. Pastikan format file sesuai dengan template.", undefined, "danger");
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
  const getPsikotestConfig = (): Record<string, any> => {
    if (!exam?.psikotestConfig) return {};
    try { return JSON.parse(exam.psikotestConfig); } catch { return {}; }
  };

  const getSubCategories = (): string[] => {
    if (!exam) return [];
    if (exam.examType === "SKD") {
      if (exam.skdCategory) return [exam.skdCategory];
      return ["TWK", "TIU", "TKP"];
    }
    if (exam.examType === "PSIKOTEST") {
      const config = getPsikotestConfig();
      const keys = Object.keys(config);
      if (keys.length > 0) return keys;
      if (exam.psikotestCategory) return [exam.psikotestCategory];
      return ["KECERDASAN"];
    }
    if (exam.examType === "PSIKOTEST_TNI") {
      if (exam.psikotestCategory === "PAULI") return ["PAULI"];
      if (exam.psikotestCategory === "GABUNGAN_TNI") {
        return ["VERBAL", "MATEMATIKA_DASAR", "LOGIKA", "DERET_ANGKA", "DERET_GAMBAR", "KUBUS"];
      }
      if (exam.psikotestCategory) return [exam.psikotestCategory];
      return ["VERBAL"];
    }
    if (exam.examType === "AKADEMIK") return [exam.akademikCategory ?? ""];
    return [];
  };

  const subCategoryCount = (sub: string) => {
    if (exam?.examType === "SKD") {
      return questions.filter((q) => q.category === sub).length;
    }
    return questions.filter((q) => (q.subCategory || "").toUpperCase() === sub.toUpperCase()).length;
  };

  const getLimit = (sub: string): number => {
    if (exam?.examType === "SKD") {
      return sub === "TWK" ? 30 : sub === "TIU" ? 35 : 45;
    }
    if (exam?.examType === "PSIKOTEST" || exam?.examType === "PSIKOTEST_TNI") {
      const config = getPsikotestConfig();
      if (config[sub] !== undefined && typeof config[sub] === "number") return config[sub];
      for (const k of Object.keys(config)) {
        if (k.toUpperCase() === sub.toUpperCase() && typeof config[k] === "number") return config[k];
      }
      return Infinity;
    }
    if (exam?.examType === "AKADEMIK") {
      return exam?.akademikTotalSoal ?? Infinity;
    }
    return Infinity;
  };

  const openCreate = () => {
    setEditId(null);

    let defaultCat: Category = "TWK";
    let defaultSub = "";

    if (exam?.examType === "SKD") {
      defaultCat = activeTab;
    } else {
      const subs = getSubCategories();
      defaultSub = (activeSubTab && activeSubTab !== "ALL") ? activeSubTab : (subs[0] || exam?.psikotestCategory || "");
    }

    setForm({
      ...emptyQuestion(),
      category: defaultCat,
      subCategory: defaultSub,
    });

    setImageFile(null);
    setImagePreview(null);
    setFormErrors({});
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
    setFormErrors({});
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

        // Set active sub tab untuk Psikotest/TNI/Akademik
        if (examData.examType !== "SKD") {
          let defaultSub = "";
          if (examData.examType === "PSIKOTEST") {
            if (examData.psikotestConfig) {
              try {
                const config = JSON.parse(examData.psikotestConfig);
                defaultSub = Object.keys(config)[0] || "";
              } catch { }
            }
            if (!defaultSub && examData.psikotestCategory) {
              defaultSub = examData.psikotestCategory;
            }
          } else if (examData.examType === "PSIKOTEST_TNI") {
            if (examData.psikotestCategory === "PAULI") {
              defaultSub = "PAULI";
            } else if (examData.psikotestCategory === "GABUNGAN_TNI") {
              defaultSub = "VERBAL";
            } else if (examData.psikotestCategory) {
              defaultSub = examData.psikotestCategory;
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

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateQuestionForm = () => {
    const errs: Record<string, string> = {};
    if (!form.content.trim()) errs.content = "Teks soal wajib diisi";

    OPTIONS.forEach((opt) => {
      const val = form[`option${opt}` as keyof typeof form] as string;
      if (!val || !val.trim()) {
        errs[`option${opt}`] = `Opsi ${opt} wajib diisi`;
      }
    });

    if (form.category !== "TKP" && !form.correctOption) {
      errs.correctOption = "Jawaban benar wajib dipilih";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isQuestionLimitReached = (): boolean => {
    if (editId) return false;
    if (exam?.examType === "SKD") {
      const cat = form.category || activeTab;
      const limits: Record<Category, number> = { TWK: 30, TIU: 35, TKP: 45 };
      return categoryCount(cat) >= (limits[cat] ?? 30);
    }
    if (exam?.examType === "PSIKOTEST" || exam?.examType === "PSIKOTEST_TNI") {
      const sub = form.subCategory || (activeSubTab !== "ALL" ? activeSubTab : "") || getSubCategories()[0];
      if (!sub) return false;
      const limit = getLimit(sub);
      return limit !== Infinity && subCategoryCount(sub) >= limit;
    }
    if (exam?.examType === "AKADEMIK") {
      const limit = exam?.akademikTotalSoal ?? Infinity;
      return limit !== Infinity && questions.length >= limit;
    }
    return false;
  };

  const handleSave = async () => {
    if (!validateQuestionForm()) return;
    if (isQuestionLimitReached()) {
      showAlert("Batas Maksimal Tercapai", "Jumlah soal untuk kategori ini sudah mencapai batas maksimal.");
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
        showAlert("Gagal Menyimpan", data.error || "Gagal memperbarui soal.", undefined, "danger");
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
        showAlert("Gagal Menyimpan", data.error || "Gagal menambahkan soal.", undefined, "danger");
        setSaving(false);
        return;
      }
    }

    await fetchQuestions();
    setSaving(false);
    setShowModal(false);
    setImageFile(null);
    setImagePreview(null);
    setFormErrors({});
  };

  const handleSaveAndNext = async () => {
    if (!validateQuestionForm()) return;
    if (isQuestionLimitReached()) {
      showAlert("Batas Maksimal Tercapai", "Batas maksimal jumlah soal untuk sub-kategori ini telah tercapai.");
      return;
    }

    setSaving(true);

    let imageUrl = form.imageUrl ?? "";
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (uploaded) imageUrl = uploaded;
      else {
        showAlert("Gagal Upload", "Gagal mengupload gambar pendukung.", undefined, "danger");
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
      showAlert("Gagal Menyimpan", data.error || "Gagal menyimpan soal.", undefined, "danger");
      setSaving(false);
      return;
    }

    await fetchQuestions();
    setSaving(false);

    // Cek apakah setelah simpan soal ini sudah penuh
    const sub = form.subCategory || getSubCategories()[0];
    const currentCount = subCategoryCount(sub);
    const limit = getLimit(sub);

    if (limit !== Infinity && currentCount >= limit) {
      setShowModal(false);
      setFormErrors({});
      showAlert("Kuota Terpenuhi", "Soal berhasil disimpan! Kuota jumlah soal untuk sub-kategori ini telah terpenuhi.", undefined, "success");
    } else {
      // Reset form tapi pertahankan subCategory & category
      setForm({
        ...emptyQuestion(),
        category: form.category,
        subCategory: form.subCategory,
      });
      setImageFile(null);
      setImagePreview(null);
      setFormErrors({});
    }
  };

  const handleDelete = (qid: string) => {
    showConfirm("Hapus Soal", "Apakah Anda yakin ingin menghapus soal ini?", async () => {
      await fetch(`/api/exams/${id}/questions/${qid}`, { method: "DELETE" });
      await fetchQuestions();
    });
  };

  const categoryLimits: Record<Category, number> = {
    TWK: 30,
    TIU: 35,
    TKP: 45,
  };

  return (
    <div>
      {/* Top Navigation */}
      <div className="mb-4">
        <Link
          href="/admin/exams"
          className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Kembali ke Kelola Ujian</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 md:p-6 mb-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-2">
          {/* Category & Status Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${exam?.examType === "PSIKOTEST_TNI"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
              {exam?.examType === "PSIKOTEST_TNI" ? "PSIKOTEST TNI" : exam?.examType?.replace(/_/g, " ")}
            </span>

            {(() => {
              const subLabel = (() => {
                if (!exam) return null;
                const formatTitle = (str: string) => str.split(/[\s_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
                if (exam.examType === "SKD") return exam.skdCategory || "Gabungan";
                if (exam.examType === "PSIKOTEST_TNI") {
                  if (exam.psikotestCategory === "GABUNGAN_TNI") return "Gabungan TNI";
                  if (exam.psikotestCategory === "PAULI") return "Pauli";
                  return exam.psikotestCategory ? formatTitle(exam.psikotestCategory) : "Gabungan TNI";
                }
                if (exam.examType === "PSIKOTEST") {
                  if (exam.psikotestCategory === "GABUNGAN") return "Gabungan";
                  if (exam.psikotestCategory) return formatTitle(exam.psikotestCategory);
                  if (exam.psikotestConfig) {
                    try {
                      const keys = Object.keys(JSON.parse(exam.psikotestConfig));
                      if (keys.length > 1) return "Gabungan";
                      if (keys.length === 1) return formatTitle(keys[0]);
                    } catch { }
                  }
                  return "Kecerdasan";
                }
                if (exam.examType === "AKADEMIK") {
                  return exam.akademikCategory ? exam.akademikCategory.replace(/_/g, " ") : "Akademik";
                }
                return null;
              })();

              if (!subLabel) return null;
              return (
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                  Sub: {subLabel}
                </span>
              );
            })()}

            <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">
              {exam?.duration} Menit
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-tight">
            {exam?.title || "..."}
          </h1>

          <p className="text-xs text-slate-400 font-mono">ID: {id}</p>
        </div>

        {/* Action Buttons */}
        {exam?.psikotestCategory !== "PAULI" && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
            <button
              onClick={downloadTemplate}
              className="px-3.5 py-2.5 border border-gray-200 text-gray-700 text-xs md:text-sm font-semibold rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
              title="Download Template Excel"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              <span>Template</span>
            </button>

            <label className={`px-3.5 py-2.5 border border-emerald-200 bg-emerald-50/50 text-emerald-700 text-xs md:text-sm font-semibold rounded-xl cursor-pointer flex items-center gap-2 hover:bg-emerald-100/60 transition-colors shadow-sm ${importing ? "opacity-50 pointer-events-none" : ""}`}>
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
              <span>{importing ? "Mengimport..." : "Import Excel"}</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            <button
              onClick={openCreate}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              <span>Tambah Soal</span>
            </button>
          </div>
        )}
      </div>

      {/* Special Pauli Banner Config */}
      {exam?.examType === "PSIKOTEST_TNI" && exam?.psikotestCategory === "PAULI" && (
        <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 text-white rounded-3xl p-6 md:p-8 mb-6 shadow-xl relative overflow-hidden border border-emerald-500/20">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Ujian Psikotes Pauli
                    </span>
                    <span className="bg-white/10 text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded-full">
                      Sistem Otomatis
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white">Konfigurasi Lembar Kerja Pauli</h3>
                </div>
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-3xl">
              Soal Ujian Pauli di-generate secara acak (angka 0–9) oleh sistem secara otomatis saat ujian dimulai. Admin tidak perlu menginputkan butir soal satu per satu.
            </p>

            {/* Config metrics grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mb-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Total Durasi Ujian
                </span>
                <p className="text-lg font-bold text-white">
                  {(exam?.duration ?? 0) * 60} Detik
                  <span className="text-xs font-normal text-slate-300 ml-1">({exam?.duration ?? 0} Menit)</span>
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mb-2">
                  <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Interval Per Kolom
                </span>
                <p className="text-lg font-bold text-white">
                  {getPsikotestConfig().signal_interval_sec ?? 180} Detik
                  <span className="text-xs font-normal text-slate-300 ml-1">({(getPsikotestConfig().signal_interval_sec ?? 180) / 60} Menit)</span>
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mb-2">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                  Jumlah Lembar Kolom
                </span>
                <p className="text-lg font-bold text-white">
                  {Math.floor(((exam?.duration ?? 0) * 60) / (getPsikotestConfig().signal_interval_sec ?? 180))} Kolom Kerja
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar per Kategori SKD */}
      {exam?.examType === "SKD" && (
        <div className={`grid gap-4 mb-6 ${exam?.skdCategory ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"}`}>
          {(exam?.skdCategory
            ? [exam.skdCategory as Category]
            : ["TWK", "TIU", "TKP"] as Category[]
          ).map((cat) => {
            const count = categoryCount(cat);
            const limit = categoryLimits[cat];
            const pct = Math.round((count / limit) * 100);
            const isFilled = count >= limit;
            return (
              <div key={cat} className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{cat}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isFilled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700"}`}>
                    {count}/{limit} Soal
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${isFilled ? "bg-emerald-500" : "bg-blue-600"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-2 flex items-center justify-between">
                  <span>Target Soal</span>
                  <span>{pct}% Terpenuhi</span>
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Bar per Sub-Kategori Psikotest / Psikotest TNI */}
      {(exam?.examType === "PSIKOTEST" || (exam?.examType === "PSIKOTEST_TNI" && exam?.psikotestCategory !== "PAULI")) && (
        <div className={`grid gap-4 mb-6 ${getSubCategories().length > 1 ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" : "grid-cols-1"}`}>
          {getSubCategories().map((sub) => {
            const count = subCategoryCount(sub);
            const limit = getLimit(sub);
            const pct = limit === Infinity || limit === 0 ? 0 : Math.round((count / limit) * 100);
            const isFilled = limit !== Infinity && count >= limit;

            const labelMap: Record<string, string> = {
              GABUNGAN_TNI: "Gabungan TNI",
              VERBAL: "Verbal",
              MATEMATIKA_DASAR: "Matematika Dasar",
              LOGIKA: "Logika",
              DERET_ANGKA: "Deret Angka",
              DERET_GAMBAR: "Deret Gambar",
              KUBUS: "Kubus",
            };
            const formattedSub = labelMap[sub] || (sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase());

            return (
              <div key={sub} className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-xs font-bold text-slate-800">{formattedSub}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isFilled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-purple-50 text-purple-700"}`}>
                    {count}/{limit === Infinity ? "∞" : limit} Soal
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${isFilled ? "bg-emerald-500" : exam?.examType === "PSIKOTEST_TNI" ? "bg-blue-600" : "bg-purple-600"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-2 flex items-center justify-between">
                  <span>Progres Pengisian</span>
                  <span>{pct}% Terpenuhi</span>
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Bar Akademik */}
      {exam?.examType === "AKADEMIK" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-bold text-slate-800">
              {exam?.akademikCategory?.replace(/_/g, " ")}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {questions.length}/{exam?.akademikTotalSoal ?? "∞"} Soal
            </span>
          </div>
          {exam?.akademikTotalSoal && (
            <>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${questions.length >= exam.akademikTotalSoal ? "bg-emerald-500" : "bg-amber-500"}`}
                  style={{ width: `${Math.min((questions.length / exam.akademikTotalSoal) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-2 flex items-center justify-between">
                <span>Kebutuhan Soal Akademik</span>
                <span>{Math.round((questions.length / exam.akademikTotalSoal) * 100)}% Terpenuhi</span>
              </p>
            </>
          )}
        </div>
      )}

      {/* Tab Navigasi Kategori (SKD) */}
      {exam?.examType === "SKD" && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {(exam?.skdCategory
            ? [exam.skdCategory as Category]
            : ["TWK", "TIU", "TKP"] as Category[]
          ).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 ${activeTab === cat
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === cat ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {categoryCount(cat)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Tab Navigasi Sub-Kategori (Psikotest / Psikotest TNI / Akademik) */}
      {(exam?.examType === "PSIKOTEST" || exam?.examType === "PSIKOTEST_TNI" || exam?.examType === "AKADEMIK") && exam?.psikotestCategory !== "PAULI" && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {getSubCategories().map((sub) => {
            const isActive = activeSubTab?.toUpperCase() === sub.toUpperCase();
            const isAkademik = exam?.examType === "AKADEMIK";
            const isTni = exam?.examType === "PSIKOTEST_TNI";

            const labelMap: Record<string, string> = {
              GABUNGAN_TNI: "Gabungan TNI",
              VERBAL: "Verbal",
              MATEMATIKA_DASAR: "Matematika Dasar",
              LOGIKA: "Logika",
              DERET_ANGKA: "Deret Angka",
              DERET_GAMBAR: "Deret Gambar",
              KUBUS: "Kubus",
            };
            const formattedSub = labelMap[sub] || (sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase());

            const activeClass = isAkademik
              ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
              : isTni
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "bg-purple-600 text-white shadow-md shadow-purple-500/20";

            return (
              <button
                key={sub}
                onClick={() => setActiveSubTab(sub)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold border transition-all flex items-center gap-1.5 ${isActive
                  ? activeClass
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <span>{formattedSub}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {subCategoryCount(sub)}/{getLimit(sub) === Infinity ? "∞" : getLimit(sub)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Daftar Soal */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && exam?.psikotestCategory !== "PAULI" && (
          <div className="bg-white border border-slate-200/80 rounded-3xl py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            {(() => {
              const rawLabel = exam?.examType === "SKD" ? activeTab : activeSubTab;
              const formattedLabel = rawLabel
                ? rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1).toLowerCase()
                : "";

              return (
                <p className="text-xs md:text-sm font-medium text-slate-500">
                  Belum ada soal {formattedLabel}. Klik tombol <span className="font-semibold text-slate-800">&quot;Tambah Soal&quot;</span> untuk mulai menambahkan.
                </p>
              );
            })()}
          </div>
        )}

        {filtered.map((q, idx) => (
          <div
            key={q.id}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {/* Badge kategori */}
                  {exam?.examType === "SKD" ? (
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {q.category}
                    </span>
                  ) : exam?.examType === "AKADEMIK" ? (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {q.subCategory ?? exam?.akademikCategory ?? "-"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200">
                      {q.subCategory ?? exam?.akademikCategory ?? "-"}
                    </span>
                  )}

                  {q.category === "TKP" && q.aspect && (
                    <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full">
                      {q.aspect}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono">Soal #{idx + 1}</span>
                </div>

                <p className="text-sm font-medium text-slate-800 mb-3 whitespace-pre-wrap leading-relaxed">{q.content}</p>

                {/* Gambar soal */}
                {q.imageUrl && q.imageUrl.trim() !== "" && (
                  <div className="mb-3">
                    <img
                      src={q.imageUrl}
                      alt="Gambar soal"
                      className="max-h-48 w-auto object-contain rounded-xl border border-slate-200 bg-slate-50 p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Option Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {OPTIONS.map((opt) => (
                    <div
                      key={opt}
                      className={`text-xs px-3 py-2 rounded-xl border transition-colors ${q.category !== "TKP" && q.correctOption === opt
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold shadow-sm"
                        : "border-slate-100 bg-slate-50 text-slate-600"
                        }`}
                    >
                      <span className="font-bold text-slate-800">{opt}.</span>{" "}
                      {q[`option${opt}` as keyof Question] as string}
                      {q.category === "TKP" && (
                        <span className="ml-1 font-bold text-blue-600">
                          ({q[`score${opt}` as keyof Question]})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => openEdit(q)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors"
                  title="Edit Soal"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-xl transition-colors"
                  title="Hapus Soal"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
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
                      ? `${exam.skdCategory} ${categoryCount(exam.skdCategory as Category)}/${exam.skdCategory === "TWK" ? 30 : exam.skdCategory === "TIU" ? 35 : 45
                      }`
                      : `TWK ${categoryCount("TWK")}/30 · TIU ${categoryCount("TIU")}/35 · TKP ${categoryCount("TKP")}/45`
                  )}
                  {(exam?.examType === "PSIKOTEST" || exam?.examType === "PSIKOTEST_TNI") && (
                    Object.entries(getPsikotestConfig())
                      .map(([sub, limit]) => `${sub} ${subCategoryCount(sub)}/${limit}`)
                      .join(" · ")
                  )}
                  {exam?.examType === "AKADEMIK" && (
                    `${exam?.akademikCategory?.replace(/_/g, " ")} ${questions.length}/${exam?.akademikTotalSoal ?? "∞"}`
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
                  {exam?.skdCategory ? (
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

              {(exam?.examType === "PSIKOTEST" || exam?.examType === "PSIKOTEST_TNI") && (
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
                      const isFull = limit !== Infinity && count >= limit && !editId;

                      const labelMap: Record<string, string> = {
                        GABUNGAN_TNI: "Gabungan TNI",
                        VERBAL: "Verbal",
                        MATEMATIKA_DASAR: "Matematika Dasar",
                        LOGIKA: "Logika",
                        DERET_ANGKA: "Deret Angka",
                        DERET_GAMBAR: "Deret Gambar",
                        KUBUS: "Kubus",
                      };
                      const formattedSub = labelMap[sub] || (sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase());

                      return (
                        <option key={sub} value={sub} disabled={isFull}>
                          {formattedSub} ({count}/{limit === Infinity ? "∞" : limit}) {isFull ? "— PENUH" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {exam?.examType === "AKADEMIK" && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  <p className="text-xs text-blue-600 font-semibold">
                    Kategori: {exam?.akademikCategory?.replace(/_/g, " ")}
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

              {/* Konten Soal */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Teks Soal
                </label>
                <textarea
                  rows={3}
                  placeholder="Tulis soal di sini..."
                  value={form.content}
                  onChange={(e) => {
                    setForm({ ...form, content: e.target.value });
                    if (formErrors.content) setFormErrors({ ...formErrors, content: "" });
                  }}
                  className={`w-full border ${formErrors.content ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none`}
                />
                {formErrors.content && (
                  <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    <span>{formErrors.content}</span>
                  </p>
                )}
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
                    <svg className="w-7 h-7 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
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
                    <div key={opt} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-500 w-5">{opt}</span>
                        <input
                          type="text"
                          placeholder={`Opsi ${opt}`}
                          value={form[`option${opt}` as keyof typeof form] as string}
                          onChange={(e) => {
                            setForm({ ...form, [`option${opt}`]: e.target.value });
                            if (formErrors[`option${opt}`]) setFormErrors({ ...formErrors, [`option${opt}`]: "" });
                          }}
                          className={`flex-1 border ${formErrors[`option${opt}`] ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                        />
                        {form.category !== "TKP" && (
                          <input
                            type="radio"
                            name="correctOption"
                            checked={form.correctOption === opt}
                            onChange={() => {
                              setForm({ ...form, correctOption: opt });
                              if (formErrors.correctOption) setFormErrors({ ...formErrors, correctOption: "" });
                            }}
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
                      {formErrors[`option${opt}`] && (
                        <p className="text-xs text-red-500 font-medium ml-7 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                          <span>{formErrors[`option${opt}`]}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {formErrors.correctOption && (
                  <p className="text-xs text-red-500 font-medium mt-2 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    <span>{formErrors.correctOption}</span>
                  </p>
                )}
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

                {/* correctOption2 — hanya Psikotest */}
                {exam?.examType === "PSIKOTEST" && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Jawaban Benar Ke-2 <span className="text-gray-400 font-normal normal-case">(opsional)</span>
                    </label>
                    <select
                      value={form.correctOption2 ?? ""}
                      onChange={(e) => setForm({ ...form, correctOption2: e.target.value })}
                      className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">— Tidak ada (1 Jawaban) —</option>
                      {OPTIONS.filter((o) => o !== form.correctOption).map((o) => (
                        <option key={o} value={o}>Opsi {o}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>

              {/* Edit mode: Simpan Perubahan */}
              {editId && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Memproses..." : "Simpan Perubahan"}
                </button>
              )}

              {/* Create mode: Simpan & Simpan & Lanjut */}
              {!editId && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                  >
                    {saving ? "Memproses..." : "Simpan"}
                  </button>

                  <button
                    onClick={handleSaveAndNext}
                    disabled={saving || isQuestionLimitReached()}
                    className="flex-1 bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Simpan & Lanjut →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <CustomModal {...modalConfig} />
    </div>
  );
}