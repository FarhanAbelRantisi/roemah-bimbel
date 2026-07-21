"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import CustomModal, { ModalState } from "@/components/CustomModal";

interface Exam {
  id: string;
  title: string;
  duration: number;
  isPremium: boolean;
  isPublished: boolean;
  examType: "SKD" | "PSIKOTEST" | "AKADEMIK" | "PSIKOTEST_TNI";
  skdCategory?: string;
  psikotestCategory?: string;
  psikotestConfig?: string;
  akademikCategory?: string;
  akademikTotalSoal?: number;
  _count: { questions: number };
}

const TNI_SUB_CATEGORIES = [
  { value: "GABUNGAN_TNI", label: "Gabungan (Verbal + Mtk + Logika + Deret + Kubus)" },
  { value: "VERBAL", label: "Verbal" },
  { value: "MATEMATIKA_DASAR", label: "Matematika Dasar" },
  { value: "LOGIKA", label: "Logika" },
  { value: "DERET_ANGKA", label: "Deret Angka" },
  { value: "DERET_GAMBAR", label: "Deret Gambar" },
  { value: "KUBUS", label: "Kubus" },
  { value: "PAULI", label: "Pauli" },
] as const;

const IconAlertTriangle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<ModalState>({ isOpen: false, title: "" });
  const [form, setForm] = useState({
    title: "",
    duration: "",
    isPremium: false,
    examType: "SKD" as "SKD" | "PSIKOTEST" | "AKADEMIK" | "PSIKOTEST_TNI",
    skdCategory: "",
    psikotestCategory: "KECERDASAN",
    psikotestSoalKecerdasan: "40",
    psikotestSoalKecermatan: "30",
    psikotestSoalKepribadian: "30",
    tniCategory: "GABUNGAN_TNI",
    tniSoalVerbal: "20",
    tniSoalMatematika: "20",
    tniSoalLogika: "20",
    tniSoalDeretAngka: "20",
    tniSoalDeretGambar: "20",
    tniSoalKubus: "20",
    tniJumlahSoalSingle: "50",
    pauliIntervalSec: "180",
    pauliAngkaPerKolom: "45",
    akademikCategory: "",
    akademikTotalSoal: "",
  });
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    duration: "",
    isPremium: false,
    examType: "SKD" as "SKD" | "PSIKOTEST" | "AKADEMIK" | "PSIKOTEST_TNI",
    skdCategory: "",
    psikotestCategory: "KECERDASAN",
    psikotestSoalKecerdasan: "",
    psikotestSoalKecermatan: "",
    psikotestSoalKepribadian: "",
    tniCategory: "GABUNGAN_TNI",
    tniSoalVerbal: "20",
    tniSoalMatematika: "20",
    tniSoalLogika: "20",
    tniSoalDeretAngka: "20",
    tniSoalDeretGambar: "20",
    tniSoalKubus: "20",
    tniJumlahSoalSingle: "50",
    pauliIntervalSec: "180",
    pauliAngkaPerKolom: "45",
    akademikCategory: "",
    akademikTotalSoal: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  const fetchExams = useCallback(async () => {
    const res = await fetch("/api/exams");
    const data = await res.json();
    setExams(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/exams");
      const data = await res.json();

      if (isMounted) {
        setExams(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const openEdit = (exam: Exam) => {
    setEditExam(exam);

    let kecerdasan = "";
    let kecermatan = "";
    let kepribadian = "";
    let tniCategory = exam.psikotestCategory || "GABUNGAN_TNI";
    let tniSoalVerbal = "20";
    let tniSoalMatematika = "20";
    let tniSoalLogika = "20";
    let tniSoalDeretAngka = "20";
    let tniSoalDeretGambar = "20";
    let tniSoalKubus = "20";
    let tniJumlahSoalSingle = "50";
    let pauliIntervalSec = "180";
    let pauliAngkaPerKolom = "45";

    const psiCat = exam.psikotestCategory || "KECERDASAN";

    if (exam.examType === "PSIKOTEST" && exam.psikotestConfig) {
      try {
        const config = JSON.parse(exam.psikotestConfig);
        const getVal = (key: string) => {
          for (const k of Object.keys(config)) {
            if (k.toUpperCase() === key.toUpperCase()) return String(config[k]);
          }
          return "";
        };
        if (psiCat === "GABUNGAN") {
          kecerdasan = getVal("KECERDASAN");
          kecermatan = getVal("KECERMATAN");
          kepribadian = getVal("KEPRIBADIAN");
        } else {
          kecerdasan = getVal(psiCat);
        }
      } catch (e) { }
    } else if (exam.examType === "PSIKOTEST_TNI" && exam.psikotestConfig) {
      try {
        const config = JSON.parse(exam.psikotestConfig);
        if (tniCategory === "GABUNGAN_TNI") {
          tniSoalVerbal = String(config.VERBAL || 20);
          tniSoalMatematika = String(config.MATEMATIKA_DASAR || 20);
          tniSoalLogika = String(config.LOGIKA || 20);
          tniSoalDeretAngka = String(config.DERET_ANGKA || 20);
          tniSoalDeretGambar = String(config.DERET_GAMBAR || 20);
          tniSoalKubus = String(config.KUBUS || 20);
        } else if (tniCategory === "PAULI") {
          pauliIntervalSec = String(config.signal_interval_sec || 180);
          pauliAngkaPerKolom = String(config.angka_per_kolom || 45);
        } else {
          tniJumlahSoalSingle = String(config[tniCategory] || 50);
        }
      } catch (e) { }
    }

    setEditForm({
      title: exam.title,
      duration: String(exam.duration),
      isPremium: exam.isPremium,
      examType: exam.examType,
      psikotestCategory: exam.examType === "PSIKOTEST" ? psiCat : "KECERDASAN",
      skdCategory: exam.skdCategory || "",
      psikotestSoalKecerdasan: kecerdasan,
      psikotestSoalKecermatan: kecermatan,
      psikotestSoalKepribadian: kepribadian,
      tniCategory,
      tniSoalVerbal,
      tniSoalMatematika,
      tniSoalLogika,
      tniSoalDeretAngka,
      tniSoalDeretGambar,
      tniSoalKubus,
      tniJumlahSoalSingle,
      pauliIntervalSec,
      pauliAngkaPerKolom,
      akademikCategory: exam.akademikCategory || "",
      akademikTotalSoal: exam.akademikTotalSoal ? String(exam.akademikTotalSoal) : "",
    });

    setEditModal(true);
  };

  const buildTniConfig = (f: typeof form | typeof editForm) => {
    if (f.tniCategory === "GABUNGAN_TNI") {
      return JSON.stringify({
        VERBAL: Number(f.tniSoalVerbal) || 20,
        MATEMATIKA_DASAR: Number(f.tniSoalMatematika) || 20,
        LOGIKA: Number(f.tniSoalLogika) || 20,
        DERET_ANGKA: Number(f.tniSoalDeretAngka) || 20,
        DERET_GAMBAR: Number(f.tniSoalDeretGambar) || 20,
        KUBUS: Number(f.tniSoalKubus) || 20,
      });
    } else if (f.tniCategory === "PAULI") {
      return JSON.stringify({
        PAULI: true,
        signal_interval_sec: Number(f.pauliIntervalSec) || 180,
        angka_per_kolom: Number(f.pauliAngkaPerKolom) || 45,
        digit_min: 0,
        digit_max: 9,
      });
    } else {
      return JSON.stringify({
        [f.tniCategory]: Number(f.tniJumlahSoalSingle) || 50,
      });
    }
  };

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

  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const validateEditForm = () => {
    const errs: Record<string, string> = {};
    if (!editForm.title.trim()) errs.title = "Judul ujian wajib diisi";
    if (!editForm.duration.trim() || Number(editForm.duration) <= 0) errs.duration = "Durasi ujian wajib diisi";

    if (editForm.examType === "AKADEMIK") {
      if (!editForm.akademikCategory) errs.akademikCategory = "Kategori akademik wajib dipilih";
      if (!editForm.akademikTotalSoal || Number(editForm.akademikTotalSoal) <= 0) errs.akademikTotalSoal = "Jumlah soal wajib diisi";
    } else if (editForm.examType === "PSIKOTEST") {
      if (editForm.psikotestCategory === "GABUNGAN") {
        if (!editForm.psikotestSoalKecerdasan || Number(editForm.psikotestSoalKecerdasan) <= 0) errs.psikotestSoalKecerdasan = "Wajib diisi";
        if (!editForm.psikotestSoalKecermatan || Number(editForm.psikotestSoalKecermatan) <= 0) errs.psikotestSoalKecermatan = "Wajib diisi";
        if (!editForm.psikotestSoalKepribadian || Number(editForm.psikotestSoalKepribadian) <= 0) errs.psikotestSoalKepribadian = "Wajib diisi";
      } else {
        if (!editForm.psikotestSoalKecerdasan || Number(editForm.psikotestSoalKecerdasan) <= 0) errs.psikotestSoalKecerdasan = "Jumlah soal wajib diisi";
      }
    } else if (editForm.examType === "PSIKOTEST_TNI") {
      if (editForm.tniCategory === "GABUNGAN_TNI") {
        if (!editForm.tniSoalVerbal || Number(editForm.tniSoalVerbal) <= 0) errs.tniSoalVerbal = "Wajib diisi";
        if (!editForm.tniSoalMatematika || Number(editForm.tniSoalMatematika) <= 0) errs.tniSoalMatematika = "Wajib diisi";
        if (!editForm.tniSoalLogika || Number(editForm.tniSoalLogika) <= 0) errs.tniSoalLogika = "Wajib diisi";
        if (!editForm.tniSoalDeretAngka || Number(editForm.tniSoalDeretAngka) <= 0) errs.tniSoalDeretAngka = "Wajib diisi";
        if (!editForm.tniSoalDeretGambar || Number(editForm.tniSoalDeretGambar) <= 0) errs.tniSoalDeretGambar = "Wajib diisi";
        if (!editForm.tniSoalKubus || Number(editForm.tniSoalKubus) <= 0) errs.tniSoalKubus = "Wajib diisi";
      } else if (editForm.tniCategory === "PAULI") {
        if (!editForm.pauliIntervalSec || Number(editForm.pauliIntervalSec) <= 0) errs.pauliIntervalSec = "Durasi per kolom wajib diisi";
      } else {
        if (!editForm.tniJumlahSoalSingle || Number(editForm.tniJumlahSoalSingle) <= 0) errs.tniJumlahSoalSingle = "Jumlah soal wajib diisi";
      }
    }
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateCreateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Judul ujian wajib diisi";
    if (!form.duration.trim() || Number(form.duration) <= 0) errs.duration = "Durasi ujian wajib diisi";

    if (form.examType === "AKADEMIK") {
      if (!form.akademikCategory) errs.akademikCategory = "Kategori akademik wajib dipilih";
      if (!form.akademikTotalSoal || Number(form.akademikTotalSoal) <= 0) errs.akademikTotalSoal = "Jumlah soal wajib diisi";
    } else if (form.examType === "PSIKOTEST") {
      if (form.psikotestCategory === "GABUNGAN") {
        if (!form.psikotestSoalKecerdasan || Number(form.psikotestSoalKecerdasan) <= 0) errs.psikotestSoalKecerdasan = "Wajib diisi";
        if (!form.psikotestSoalKecermatan || Number(form.psikotestSoalKecermatan) <= 0) errs.psikotestSoalKecermatan = "Wajib diisi";
        if (!form.psikotestSoalKepribadian || Number(form.psikotestSoalKepribadian) <= 0) errs.psikotestSoalKepribadian = "Wajib diisi";
      } else {
        if (!form.psikotestSoalKecerdasan || Number(form.psikotestSoalKecerdasan) <= 0) errs.psikotestSoalKecerdasan = "Jumlah soal wajib diisi";
      }
    } else if (form.examType === "PSIKOTEST_TNI") {
      if (form.tniCategory === "GABUNGAN_TNI") {
        if (!form.tniSoalVerbal || Number(form.tniSoalVerbal) <= 0) errs.tniSoalVerbal = "Wajib diisi";
        if (!form.tniSoalMatematika || Number(form.tniSoalMatematika) <= 0) errs.tniSoalMatematika = "Wajib diisi";
        if (!form.tniSoalLogika || Number(form.tniSoalLogika) <= 0) errs.tniSoalLogika = "Wajib diisi";
        if (!form.tniSoalDeretAngka || Number(form.tniSoalDeretAngka) <= 0) errs.tniSoalDeretAngka = "Wajib diisi";
        if (!form.tniSoalDeretGambar || Number(form.tniSoalDeretGambar) <= 0) errs.tniSoalDeretGambar = "Wajib diisi";
        if (!form.tniSoalKubus || Number(form.tniSoalKubus) <= 0) errs.tniSoalKubus = "Wajib diisi";
      } else if (form.tniCategory === "PAULI") {
        if (!form.pauliIntervalSec || Number(form.pauliIntervalSec) <= 0) errs.pauliIntervalSec = "Durasi per kolom wajib diisi";
      } else {
        if (!form.tniJumlahSoalSingle || Number(form.tniJumlahSoalSingle) <= 0) errs.tniJumlahSoalSingle = "Jumlah soal wajib diisi";
      }
    }
    setCreateErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEdit = async () => {
    if (!editExam) return;
    if (!validateEditForm()) return;
    setEditSaving(true);

    let psikotestConfig: string | null = null;
    if (editForm.examType === "PSIKOTEST") {
      if (editForm.psikotestCategory === "GABUNGAN") {
        psikotestConfig = JSON.stringify({
          KECERDASAN: Number(editForm.psikotestSoalKecerdasan),
          KECERMATAN: Number(editForm.psikotestSoalKecermatan),
          KEPRIBADIAN: Number(editForm.psikotestSoalKepribadian),
        });
      } else {
        psikotestConfig = JSON.stringify({
          [editForm.psikotestCategory]: Number(editForm.psikotestSoalKecerdasan),
        });
      }
    } else if (editForm.examType === "PSIKOTEST_TNI") {
      psikotestConfig = buildTniConfig(editForm);
    }

    const res = await fetch(`/api/exams/${editExam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title,
        duration: Number(editForm.duration),
        isPremium: editForm.isPremium,
        examType: editForm.examType,
        skdCategory: editForm.examType === "SKD" ? (editForm.skdCategory || null) : null,
        psikotestCategory:
          editForm.examType === "PSIKOTEST"
            ? editForm.psikotestCategory
            : editForm.examType === "PSIKOTEST_TNI"
              ? editForm.tniCategory
              : null,
        psikotestConfig,
        akademikCategory: editForm.examType === "AKADEMIK" ? editForm.akademikCategory : null,
        akademikTotalSoal:
          editForm.examType === "AKADEMIK" && editForm.akademikTotalSoal
            ? Number(editForm.akademikTotalSoal)
            : null,
      }),
    });

    if (res.ok) {
      await fetchExams();
      setEditModal(false);
    } else {
      const data = await res.json();
      showAlert("Gagal Menyimpan Ujian", data.error, data.details, "danger");
    }
    setEditSaving(false);
  };

  const handleCreate = async () => {
    if (!validateCreateForm()) return;
    setSaving(true);

    let psikotestConfig: string | null = null;
    if (form.examType === "PSIKOTEST") {
      if (form.psikotestCategory === "GABUNGAN") {
        psikotestConfig = JSON.stringify({
          KECERDASAN: Number(form.psikotestSoalKecerdasan),
          KECERMATAN: Number(form.psikotestSoalKecermatan),
          KEPRIBADIAN: Number(form.psikotestSoalKepribadian),
        });
      } else {
        psikotestConfig = JSON.stringify({
          [form.psikotestCategory]: Number(form.psikotestSoalKecerdasan),
        });
      }
    } else if (form.examType === "PSIKOTEST_TNI") {
      psikotestConfig = buildTniConfig(form);
    }

    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          duration: Number(form.duration),
          isPremium: form.isPremium,
          examType: form.examType,
          skdCategory: form.examType === "SKD" ? (form.skdCategory || null) : null,
          psikotestCategory:
            form.examType === "PSIKOTEST"
              ? (form.psikotestCategory || "KECERDASAN")
              : form.examType === "PSIKOTEST_TNI"
                ? form.tniCategory
                : null,
          psikotestConfig,
          akademikCategory: form.examType === "AKADEMIK" ? form.akademikCategory : null,
          akademikTotalSoal:
            form.examType === "AKADEMIK" && form.akademikTotalSoal
              ? Number(form.akademikTotalSoal)
              : null,
        }),
      });

      if (res.ok) {
        await fetchExams();
        setShowModal(false);
      } else {
        const data = await res.json();
        showAlert("Gagal Membuat Ujian", data.error, data.details, "danger");
      }
    } catch {
      showAlert("Kesalahan Server", "Gagal terhubung ke server", undefined, "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    showConfirm(
      "Hapus Paket Ujian",
      "Apakah Anda yakin ingin menghapus paket ujian ini? Seluruh soal dan riwayat pengerjaan peserta pada paket ujian ini akan terhapus secara permanen.",
      async () => {
        await fetch(`/api/exams/${id}`, { method: "DELETE" });
        await fetchExams();
      }
    );
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    if (current) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Batalkan Publish Ujian",
        message: "Ujian akan dikembalikan ke status Draft dan tidak dapat diakses oleh peserta.",
        confirmText: "Jadikan Draft",
        cancelText: "Batal",
        onConfirm: async () => {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          await fetch(`/api/exams/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPublished: false }),
          });
          await fetchExams();
        },
        onCancel: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    const res = await fetch(`/api/exams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: true }),
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert(
        "Gagal Publish Ujian",
        data.error || "Jumlah soal belum memenuhi syarat minimum untuk dipublish:",
        data.details,
        "danger"
      );
      return;
    }

    await fetchExams();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Ujian</h1>
          <p className="text-gray-500 text-sm mt-1">Buat dan kelola paket ujian</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Buat Ujian Baru
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Judul Ujian</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Durasi</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Soal</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Tipe</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => {
                  const subCatLabel = (() => {
                    const formatTitle = (str: string) => str.split(/[\s_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
                    if (exam.examType === "SKD") return exam.skdCategory || "Gabungan";
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
                    if (exam.examType === "PSIKOTEST_TNI") {
                      if (exam.psikotestCategory === "GABUNGAN_TNI") return "Gabungan TNI";
                      if (exam.psikotestCategory === "PAULI") return "Pauli";
                      return exam.psikotestCategory ? formatTitle(exam.psikotestCategory) : "Gabungan TNI";
                    }
                    if (exam.examType === "AKADEMIK") {
                      return exam.akademikCategory ? formatTitle(exam.akademikCategory) : "Akademik";
                    }
                    return null;
                  })();

                  return (
                    <tr key={exam.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{exam.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${exam.examType === "SKD" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                            exam.examType === "PSIKOTEST" ? "bg-purple-50 text-purple-600 border border-purple-100" :
                              exam.examType === "PSIKOTEST_TNI" ? "bg-green-50 text-green-700 border border-green-200 font-bold" :
                                "bg-orange-50 text-orange-600 border border-orange-100"
                            }`}>
                            {exam.examType === "PSIKOTEST_TNI" ? "PSIKOTEST TNI" : exam.examType}
                          </span>
                          {subCatLabel && (
                            <span className="text-xs px-2 py-0.5 rounded font-medium bg-gray-100 text-gray-700 border border-gray-200">
                              Sub: {subCatLabel}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{exam.duration} menit</td>
                      <td className="px-6 py-4 text-gray-600">{exam._count.questions} soal</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${exam.isPremium
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                          }`}>
                          {exam.isPremium ? "Premium" : "Gratis"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${exam.isPublished
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}>
                          {exam.isPublished ? "Diterbitkan" : "Draf"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/admin/exams/${exam.id}`}
                            className="text-blue-600 hover:underline font-medium text-xs px-2 py-1 rounded hover:bg-blue-50"
                          >
                            Input Soal
                          </Link>
                          <button
                            onClick={() => openEdit(exam)}
                            className="text-gray-600 hover:text-gray-900 font-medium text-xs border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleTogglePublish(exam.id, exam.isPublished)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${exam.isPublished
                              ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                          >
                            {exam.isPublished ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" /></svg>
                                <span>Jadikan Draf</span>
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.89 9 20l11-11" /></svg>
                                <span>Terbitkan</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(exam.id)}
                            className="inline-flex items-center gap-1 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && exams.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Belum ada ujian. Buat ujian pertamamu!
          </div>
        )}
      </div>

      {/* Modal Create Ujian*/}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Buat Ujian Baru</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Ujian</label>
                <input
                  type="text"
                  placeholder="Contoh: Try Out Nasional SKD #1"
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value });
                    if (createErrors.title) setCreateErrors({ ...createErrors, title: "" });
                  }}
                  className={`w-full border ${createErrors.title ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                />
                {createErrors.title && (
                  <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                    <IconAlertTriangle /> <span>{createErrors.title}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label>
                <input
                  type="number"
                  placeholder="Contoh: 100"
                  value={form.duration}
                  onChange={(e) => {
                    setForm({ ...form, duration: e.target.value });
                    if (createErrors.duration) setCreateErrors({ ...createErrors, duration: "" });
                  }}
                  className={`w-full border ${createErrors.duration ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                />
                {createErrors.duration && (
                  <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                    <IconAlertTriangle /> <span>{createErrors.duration}</span>
                  </p>
                )}
              </div>
              {/* Tipe Ujian */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Ujian</label>
                <select
                  value={form.examType}
                  onChange={(e) => setForm({ ...form, examType: e.target.value as any })}
                  className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SKD">SKD</option>
                  <option value="PSIKOTEST">Psikotest</option>
                  <option value="PSIKOTEST_TNI">Psikotest TNI</option>
                  <option value="AKADEMIK">Akademik</option>
                </select>
              </div>

              {form.examType === "SKD" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-Kategori SKD
                  </label>
                  <select
                    value={form.skdCategory}
                    onChange={(e) => setForm({ ...form, skdCategory: e.target.value })}
                    className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Gabungan (TWK + TIU + TKP)</option>
                    <option value="TWK">TWK — Tes Wawasan Kebangsaan (30 soal)</option>
                    <option value="TIU">TIU — Tes Intelegensia Umum (35 soal)</option>
                    <option value="TKP">TKP — Tes Karakteristik Pribadi (45 soal)</option>
                  </select>
                </div>
              )}

              {/* Psikotest fields */}
              {form.examType === "PSIKOTEST" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Psikotest</label>
                    <select
                      value={form.psikotestCategory}
                      onChange={(e) => setForm({ ...form, psikotestCategory: e.target.value })}
                      className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Kecerdasan">Kecerdasan</option>
                      <option value="Kecermatan">Kecermatan</option>
                      <option value="Kepribadian">Kepribadian</option>
                      <option value="GABUNGAN">Gabungan (Kecerdasan + Kecermatan + Kepribadian)</option>
                    </select>
                  </div>

                  {/* Input jumlah soal */}
                  {form.psikotestCategory === "GABUNGAN" ? (
                    <div className="bg-gray-50 rounded-lg p-3 flex flex-col gap-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Jumlah Soal per Sub-kategori</p>
                      {[
                        { key: "psikotestSoalKecerdasan", label: "Kecerdasan" },
                        { key: "psikotestSoalKecermatan", label: "Kecermatan" },
                        { key: "psikotestSoalKepribadian", label: "Kepribadian" },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-28">{label}</span>
                            <input
                              type="number"
                              min="1"
                              value={form[key as keyof typeof form] as string}
                              onChange={(e) => {
                                setForm({ ...form, [key]: e.target.value });
                                if (createErrors[key]) setCreateErrors({ ...createErrors, [key]: "" });
                              }}
                              className={`flex-1 border ${createErrors[key] ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2`}
                            />
                            <span className="text-xs text-gray-400">soal</span>
                          </div>
                          {createErrors[key] && (
                            <p className="text-xs text-red-500 font-medium ml-31 flex items-center gap-1">
                              <IconAlertTriangle /> <span>{createErrors[key]}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Jumlah Soal</span>
                        <input
                          type="number"
                          min="1"
                          value={form.psikotestSoalKecerdasan}
                          onChange={(e) => {
                            setForm({ ...form, psikotestSoalKecerdasan: e.target.value });
                            if (createErrors.psikotestSoalKecerdasan) setCreateErrors({ ...createErrors, psikotestSoalKecerdasan: "" });
                          }}
                          className={`flex-1 border ${createErrors.psikotestSoalKecerdasan ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2`}
                        />
                        <span className="text-xs text-gray-400">soal</span>
                      </div>
                      {createErrors.psikotestSoalKecerdasan && (
                        <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                          <IconAlertTriangle /> <span>{createErrors.psikotestSoalKecerdasan}</span>
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Psikotest TNI fields */}
              {form.examType === "PSIKOTEST_TNI" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Kategori Psikotest TNI</label>
                    <select
                      value={form.tniCategory}
                      onChange={(e) => setForm({ ...form, tniCategory: e.target.value })}
                      className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {TNI_SUB_CATEGORIES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {form.tniCategory === "GABUNGAN_TNI" && (
                    <div className="bg-gray-50 rounded-lg p-3 flex flex-col gap-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Jumlah Soal per Sub-kategori TNI</p>
                      {[
                        { key: "tniSoalVerbal", label: "Verbal" },
                        { key: "tniSoalMatematika", label: "Matematika Dasar" },
                        { key: "tniSoalLogika", label: "Logika" },
                        { key: "tniSoalDeretAngka", label: "Deret Angka" },
                        { key: "tniSoalDeretGambar", label: "Deret Gambar" },
                        { key: "tniSoalKubus", label: "Kubus" },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-36">{label}</span>
                            <input
                              type="number" min="1"
                              value={form[key as keyof typeof form] as string}
                              onChange={(e) => {
                                setForm({ ...form, [key]: e.target.value });
                                if (createErrors[key]) setCreateErrors({ ...createErrors, [key]: "" });
                              }}
                              className={`flex-1 border ${createErrors[key] ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2`}
                            />
                            <span className="text-xs text-gray-400">soal</span>
                          </div>
                          {createErrors[key] && (
                            <p className="text-xs text-red-500 font-medium ml-39 flex items-center gap-1">
                              <IconAlertTriangle /> <span>{createErrors[key]}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {form.tniCategory === "PAULI" && (
                    <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Real-Time Generator</span>
                        <p className="text-xs font-bold text-blue-900">Konfigurasi Lembar Kerja Tes Pauli</p>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Durasi per Kolom / Garis (Detik)</label>
                          <input
                            type="number" min="10"
                            value={form.pauliIntervalSec}
                            onChange={(e) => {
                              setForm({ ...form, pauliIntervalSec: e.target.value });
                              if (createErrors.pauliIntervalSec) setCreateErrors({ ...createErrors, pauliIntervalSec: "" });
                            }}
                            className={`w-full border ${createErrors.pauliIntervalSec ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 bg-white`}
                          />
                          <span className="text-[10px] text-gray-500 mt-0.5 block">Default: 180 detik (3 menit)</span>
                          {createErrors.pauliIntervalSec && (
                            <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                              <IconAlertTriangle /> <span>{createErrors.pauliIntervalSec}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-blue-800 bg-blue-100/60 rounded-lg px-3 py-2 border border-blue-200/50 flex items-start gap-1.5">
                        <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                        <span><strong>Informasi:</strong> Angka 0-9 untuk Tes Pauli di-generate secara acak oleh sistem saat siswa mengerjakan ujian. Admin <strong>tidak perlu menginputkan soal secara manual</strong>.</span>
                      </p>
                    </div>
                  )}

                  {form.tniCategory !== "GABUNGAN_TNI" && form.tniCategory !== "PAULI" && (
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Jumlah Soal Target</span>
                        <input
                          type="number" min="1"
                          value={form.tniJumlahSoalSingle}
                          onChange={(e) => {
                            setForm({ ...form, tniJumlahSoalSingle: e.target.value });
                            if (createErrors.tniJumlahSoalSingle) setCreateErrors({ ...createErrors, tniJumlahSoalSingle: "" });
                          }}
                          className={`flex-1 border ${createErrors.tniJumlahSoalSingle ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2`}
                        />
                        <span className="text-xs text-gray-400">soal</span>
                      </div>
                      {createErrors.tniJumlahSoalSingle && (
                        <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                          <IconAlertTriangle /> <span>{createErrors.tniJumlahSoalSingle}</span>
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Akademik fields */}
              {form.examType === "AKADEMIK" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori Akademik
                    </label>
                    <select
                      value={form.akademikCategory}
                      onChange={(e) => {
                        setForm({ ...form, akademikCategory: e.target.value });
                        if (createErrors.akademikCategory) setCreateErrors({ ...createErrors, akademikCategory: "" });
                      }}
                      className={`w-full border ${createErrors.akademikCategory ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                    >
                      <option value="">— Pilih Kategori —</option>
                      <option value="WAWASAN KEBANGSAAN">Wawasan Kebangsaan</option>
                      <option value="Pengetahuan Umum">Pengetahuan Umum</option>
                      <option value="Tes Potensi Akademik">Tes Potensi Akademik</option>
                      <option value="Tes Kompetensi Keahlian">Tes Kompetensi Keahlian</option>
                      <option value="Tes Pengetahuan Kepolisian">Tes Pengetahuan Kepolisian</option>
                      <option value="Tes Penalaran Numerik">Tes Penalaran Numerik</option>
                    </select>
                    {createErrors.akademikCategory && (
                      <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                        <IconAlertTriangle /> <span>{createErrors.akademikCategory}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">Jumlah Soal</span>
                      <input
                        type="number"
                        min="1"
                        value={form.akademikTotalSoal}
                        onChange={(e) => {
                          setForm({ ...form, akademikTotalSoal: e.target.value });
                          if (createErrors.akademikTotalSoal) setCreateErrors({ ...createErrors, akademikTotalSoal: "" });
                        }}
                        className={`flex-1 border ${createErrors.akademikTotalSoal ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2`}
                      />
                      <span className="text-xs text-gray-400">soal</span>
                    </div>
                    {createErrors.akademikTotalSoal && (
                      <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                        <IconAlertTriangle /> <span>{createErrors.akademikTotalSoal}</span>
                      </p>
                    )}
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPremium"
                  checked={form.isPremium}
                  onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isPremium" className="text-sm text-gray-700">Ujian Premium</label>
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
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Buat Ujian"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Ujian */}
      {editModal && editExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Ujian</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Ujian</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => {
                    setEditForm({ ...editForm, title: e.target.value });
                    if (editErrors.title) setEditErrors({ ...editErrors, title: "" });
                  }}
                  className={`w-full border ${editErrors.title ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                />
                {editErrors.title && (
                  <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                    <IconAlertTriangle /> <span>{editErrors.title}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label>
                <input
                  type="number"
                  value={editForm.duration}
                  onChange={(e) => {
                    setEditForm({ ...editForm, duration: e.target.value });
                    if (editErrors.duration) setEditErrors({ ...editErrors, duration: "" });
                  }}
                  className={`w-full border ${editErrors.duration ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                />
                {editErrors.duration && (
                  <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                    <IconAlertTriangle /> <span>{editErrors.duration}</span>
                  </p>
                )}
              </div>

              {/* Tipe Ujian */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Ujian</label>
                <select
                  value={editForm.examType}
                  onChange={(e) => setEditForm({ ...editForm, examType: e.target.value as any })}
                  className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SKD">SKD</option>
                  <option value="PSIKOTEST">Psikotest</option>
                  <option value="PSIKOTEST_TNI">Psikotest TNI</option>
                  <option value="AKADEMIK">Akademik</option>
                </select>
              </div>

              {/* SKD fields - Pastikan menggunakan editForm */}
              {editForm.examType === "SKD" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-Kategori SKD
                  </label>
                  <select
                    value={editForm.skdCategory} // Gunakan editForm
                    onChange={(e) => setEditForm({ ...editForm, skdCategory: e.target.value })} // Gunakan setEditForm
                    className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Gabungan (TWK + TIU + TKP)</option>
                    <option value="TWK">TWK — Tes Wawasan Kebangsaan (30 soal)</option>
                    <option value="TIU">TIU — Tes Intelegensia Umum (35 soal)</option>
                    <option value="TKP">TKP — Tes Karakteristik Pribadi (45 soal)</option>
                  </select>
                </div>
              )}

              {/* Psikotest fields */}
              {editForm.examType === "PSIKOTEST" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Psikotest</label>
                    <select
                      value={editForm.psikotestCategory}
                      onChange={(e) => setEditForm({ ...editForm, psikotestCategory: e.target.value })}
                      className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="KECERDASAN">Kecerdasan</option>
                      <option value="KECERMATAN">Kecermatan</option>
                      <option value="KEPRIBADIAN">Kepribadian</option>
                      <option value="GABUNGAN">Gabungan (Kecerdasan + Kecermatan + Kepribadian)</option>
                    </select>
                  </div>

                  {/* Input jumlah soal */}
                  {editForm.psikotestCategory === "GABUNGAN" ? (
                    <div className="bg-gray-50 rounded-lg p-3 flex flex-col gap-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Jumlah Soal per Sub-kategori</p>
                      {[
                        { key: "psikotestSoalKecerdasan", label: "Kecerdasan" },
                        { key: "psikotestSoalKecermatan", label: "Kecermatan" },
                        { key: "psikotestSoalKepribadian", label: "Kepribadian" },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-28">{label}</span>
                            <input
                              type="number"
                              min="1"
                              value={editForm[key as keyof typeof editForm] as string}
                              onChange={(e) => {
                                setEditForm({ ...editForm, [key]: e.target.value });
                                if (editErrors[key]) setEditErrors({ ...editErrors, [key]: "" });
                              }}
                              className={`flex-1 border ${editErrors[key] ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                            />
                            <span className="text-xs text-gray-400">soal</span>
                          </div>
                          {editErrors[key] && (
                            <p className="text-xs text-red-500 font-medium ml-31 flex items-center gap-1">
                              <IconAlertTriangle /> <span>{editErrors[key]}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Jumlah Soal</span>
                        <input
                          type="number"
                          min="1"
                          value={editForm.psikotestSoalKecerdasan}
                          onChange={(e) => {
                            setEditForm({ ...editForm, psikotestSoalKecerdasan: e.target.value });
                            if (editErrors.psikotestSoalKecerdasan) setEditErrors({ ...editErrors, psikotestSoalKecerdasan: "" });
                          }}
                          className={`flex-1 border ${editErrors.psikotestSoalKecerdasan ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                        />
                        <span className="text-xs text-gray-400">soal</span>
                      </div>
                      {editErrors.psikotestSoalKecerdasan && (
                        <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                          <IconAlertTriangle /> <span>{editErrors.psikotestSoalKecerdasan}</span>
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Psikotest TNI fields (Edit) */}
              {editForm.examType === "PSIKOTEST_TNI" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Kategori Psikotest TNI</label>
                    <select
                      value={editForm.tniCategory}
                      onChange={(e) => setEditForm({ ...editForm, tniCategory: e.target.value })}
                      className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {TNI_SUB_CATEGORIES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {editForm.tniCategory === "GABUNGAN_TNI" && (
                    <div className="bg-gray-50 rounded-lg p-3 flex flex-col gap-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Jumlah Soal per Sub-kategori TNI</p>
                      {[
                        { key: "tniSoalVerbal", label: "Verbal" },
                        { key: "tniSoalMatematika", label: "Matematika Dasar" },
                        { key: "tniSoalLogika", label: "Logika" },
                        { key: "tniSoalDeretAngka", label: "Deret Angka" },
                        { key: "tniSoalDeretGambar", label: "Deret Gambar" },
                        { key: "tniSoalKubus", label: "Kubus" },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-36">{label}</span>
                            <input
                              type="number" min="1"
                              value={editForm[key as keyof typeof editForm] as string}
                              onChange={(e) => {
                                setEditForm({ ...editForm, [key]: e.target.value });
                                if (editErrors[key]) setEditErrors({ ...editErrors, [key]: "" });
                              }}
                              className={`flex-1 border ${editErrors[key] ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2`}
                            />
                            <span className="text-xs text-gray-400">soal</span>
                          </div>
                          {editErrors[key] && (
                            <p className="text-xs text-red-500 font-medium ml-39 flex items-center gap-1">
                              <IconAlertTriangle /> <span>{editErrors[key]}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {editForm.tniCategory === "PAULI" && (
                    <div className="bg-green-50/70 border border-green-200 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-green-900">Konfigurasi Lembar Kerja Tes Pauli</p>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Interval Garis Pindah Kolom (Detik)</label>
                          <input
                            type="number" min="10"
                            value={editForm.pauliIntervalSec}
                            onChange={(e) => {
                              setEditForm({ ...editForm, pauliIntervalSec: e.target.value });
                              if (editErrors.pauliIntervalSec) setEditErrors({ ...editErrors, pauliIntervalSec: "" });
                            }}
                            className={`w-full border ${editErrors.pauliIntervalSec ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 bg-white`}
                          />
                          <span className="text-[10px] text-gray-500 mt-0.5 block">Default: 180 detik (3 menit per kolom)</span>
                          {editErrors.pauliIntervalSec && (
                            <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                              <IconAlertTriangle /> <span>{editErrors.pauliIntervalSec}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-green-800 bg-green-100/60 rounded-lg px-3 py-2 border border-green-200/50 flex items-start gap-1.5">
                        <svg className="w-4 h-4 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                        <span><strong>Informasi:</strong> Angka 0-9 untuk Tes Pauli di-generate secara acak oleh sistem saat siswa mengerjakan ujian. Admin <strong>tidak perlu menginputkan soal secara manual</strong>.</span>
                      </p>
                    </div>
                  )}

                  {editForm.tniCategory !== "GABUNGAN_TNI" && editForm.tniCategory !== "PAULI" && (
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Jumlah Soal Target</span>
                        <input
                          type="number" min="1"
                          value={editForm.tniJumlahSoalSingle}
                          onChange={(e) => {
                            setEditForm({ ...editForm, tniJumlahSoalSingle: e.target.value });
                            if (editErrors.tniJumlahSoalSingle) setEditErrors({ ...editErrors, tniJumlahSoalSingle: "" });
                          }}
                          className={`flex-1 border ${editErrors.tniJumlahSoalSingle ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"} text-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2`}
                        />
                        <span className="text-xs text-gray-400">soal</span>
                      </div>
                      {editErrors.tniJumlahSoalSingle && (
                        <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                          <IconAlertTriangle /> <span>{editErrors.tniJumlahSoalSingle}</span>
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Akademik fields */}
              {editForm.examType === "AKADEMIK" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Akademik</label>
                    <select
                      value={editForm.akademikCategory}
                      onChange={(e) => setEditForm({ ...editForm, akademikCategory: e.target.value })}
                      className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">— Pilih Kategori —</option>
                      <option value="WAWASAN_KEBANGSAAN">Wawasan Kebangsaan</option>
                      <option value="PENGETAHUAN_UMUM">Pengetahuan Umum</option>
                      <option value="TES_POTENSI_AKADEMIK">Tes Potensi Akademik</option>
                      <option value="TES_KOMPETENSI_KEAHLIAN">Tes Kompetensi Keahlian</option>
                      <option value="TES_PENGETAHUAN_KEPOLISIAN">Tes Pengetahuan Kepolisian</option>
                      <option value="TES_PENALARAN_NUMERIK">Tes Penalaran Numerik</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Jumlah Soal</span>
                    <input
                      type="number"
                      min="1"
                      value={editForm.akademikTotalSoal}
                      onChange={(e) => setEditForm({ ...editForm, akademikTotalSoal: e.target.value })}
                      className="flex-1 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-400">soal</span>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Akses Ujian</label>
                <select
                  value={editForm.isPremium ? "premium" : "free"}
                  onChange={(e) => setEditForm({ ...editForm, isPremium: e.target.value === "premium" })}
                  className="w-full border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleEdit}
                disabled={editSaving}
                className="flex-1 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {editSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomModal {...modalConfig} />
    </div>
  );
}