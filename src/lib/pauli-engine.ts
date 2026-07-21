/**
 * Pauli Engine — TypeScript port dari engine.py
 *
 * Mengimplementasikan:
 * 1. Kalkulasi metrik klasik dari hasil per-kolom
 * 2. Recompute norma kelompok (mean & SD) dari histori sesi
 * 3. Klasifikasi skor individu -> Rendah / Sedang / Tinggi via Z-score
 */

import { prisma } from "@/lib/prisma";

// =========================================================
// TIPE DATA
// =========================================================

export interface PauliColumnData {
  kolomIndex: number;
  jumlahDikerjakan: number;
  jumlahBenar: number;
}

export interface PauliSessionMetrics {
  jumlahTotal: number;     // total dikerjakan (produktivitas)
  totalBenar: number;
  totalSalah: number;
  rasioKetelitian: number; // benar / dikerjakan (0.0-1.0)
  medianPerKolom: number;
  puncak: number;          // kolom tertinggi
  bawah: number;           // kolom terendah
  deviasiKonsistensi: number; // rata-rata |selisih antar kolom| — semakin kecil semakin baik
}

export interface PauliClassification {
  raw: number;
  z: number;
  kategori: "Tinggi" | "Sedang" | "Rendah" | "NORMA_BELUM_TERSEDIA";
}

// Metrik yang dinormatisasi, dan apakah "lebih besar = lebih baik"
const NORMED_METRICS: Record<string, boolean> = {
  jumlah_total: true,
  rasio_ketelitian: true,
  deviasi_konsistensi: false, // semakin kecil = semakin konsisten = lebih baik
};

// =========================================================
// 1. KALKULASI METRIK SESI
// =========================================================

export function computePauliMetrics(columns: PauliColumnData[]): PauliSessionMetrics {
  if (columns.length === 0) {
    throw new Error("Tidak ada data kolom untuk dihitung.");
  }

  const perKolom = columns.map((c) => c.jumlahDikerjakan);
  const jumlahTotal = perKolom.reduce((a, b) => a + b, 0);
  const totalBenar = columns.reduce((a, c) => a + c.jumlahBenar, 0);
  const totalSalah = jumlahTotal - totalBenar;
  const rasioKetelitian = jumlahTotal > 0 ? totalBenar / jumlahTotal : 0;

  const sorted = [...perKolom].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianPerKolom =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  const puncak = Math.max(...perKolom);
  const bawah = Math.min(...perKolom);

  let deviasiKonsistensi = 0;
  if (perKolom.length > 1) {
    const selisih = perKolom
      .slice(1)
      .map((v, i) => Math.abs(v - perKolom[i]));
    deviasiKonsistensi = selisih.reduce((a, b) => a + b, 0) / selisih.length;
  }

  return {
    jumlahTotal,
    totalBenar,
    totalSalah,
    rasioKetelitian: Math.round(rasioKetelitian * 10000) / 10000,
    medianPerKolom,
    puncak,
    bawah,
    deviasiKonsistensi: Math.round(deviasiKonsistensi * 10000) / 10000,
  };
}

// =========================================================
// 2. RECOMPUTE NORMA KELOMPOK (dari histori sesi completed)
// =========================================================

export async function recomputePauliNorm(normGroup: string): Promise<void> {
  // Ambil semua data kolom dari attempt yang sudah selesai (finishedAt tidak null)
  // dan exam bertipe PSIKOTEST_TNI dengan sub PAULI
  const attempts = await prisma.examAttempt.findMany({
    where: {
      finishedAt: { not: null },
      exam: {
        examType: "PSIKOTEST_TNI",
        psikotestCategory: "PAULI",
      },
    },
    include: { pauliColumns: true },
  });

  if (attempts.length < 2) {
    console.warn(
      `[PauliNorm] Minimal 2 sesi diperlukan untuk recompute norma '${normGroup}'. ` +
      `Saat ini: ${attempts.length} sesi.`
    );
    return;
  }

  // Hitung metrik tiap sesi
  const allMetrics = attempts
    .filter((a) => a.pauliColumns.length > 0)
    .map((a) => {
      const cols: PauliColumnData[] = a.pauliColumns.map((c) => ({
        kolomIndex: c.kolomIndex,
        jumlahDikerjakan: c.jumlahDikerjakan,
        jumlahBenar: c.jumlahBenar,
      }));
      return computePauliMetrics(cols);
    });

  if (allMetrics.length < 2) return;

  // Hitung mean & SD per metrik, lalu upsert ke PauliNorm
  const metricKeys: Array<keyof PauliSessionMetrics> = [
    "jumlahTotal",
    "rasioKetelitian",
    "deviasiKonsistensi",
  ];

  // Mapping dari camelCase ke snake_case (sesuai NORMED_METRICS key)
  const camelToSnake: Record<string, string> = {
    jumlahTotal: "jumlah_total",
    rasioKetelitian: "rasio_ketelitian",
    deviasiKonsistensi: "deviasi_konsistensi",
  };

  for (const key of metricKeys) {
    const values = allMetrics.map((m) => m[key] as number);
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
    const sd = Math.sqrt(variance);
    const metricName = camelToSnake[key];

    await prisma.pauliNorm.upsert({
      where: { normGroup_metricName: { normGroup, metricName } },
      update: { n, meanValue: mean, sdValue: sd, updatedAt: new Date() },
      create: { normGroup, metricName, n, meanValue: mean, sdValue: sd },
    });
  }

  console.log(`[PauliNorm] Norma '${normGroup}' berhasil diupdate (n=${allMetrics.length})`);
}

// =========================================================
// 3. KLASIFIKASI SKOR INDIVIDU
// =========================================================

export async function classifyPauliSession(
  metrics: PauliSessionMetrics,
  normGroup: string
): Promise<Record<string, PauliClassification>> {
  const norms = await prisma.pauliNorm.findMany({ where: { normGroup } });
  const normMap = Object.fromEntries(
    norms.map((n) => [n.metricName, { mean: n.meanValue, sd: n.sdValue }])
  );

  const camelToSnake: Record<string, string> = {
    jumlahTotal: "jumlah_total",
    rasioKetelitian: "rasio_ketelitian",
    deviasiKonsistensi: "deviasi_konsistensi",
  };

  const result: Record<string, PauliClassification> = {};

  for (const [camelKey, higherIsBetter] of Object.entries(NORMED_METRICS).map(
    ([snakeKey, val]) => [
      Object.keys(camelToSnake).find((k) => camelToSnake[k] === snakeKey) ?? snakeKey,
      val,
    ] as [string, boolean]
  )) {
    const snakeKey = camelToSnake[camelKey] ?? camelKey;
    const rawValue = metrics[camelKey as keyof PauliSessionMetrics] as number;

    if (!normMap[snakeKey]) {
      result[camelKey] = { raw: rawValue, z: 0, kategori: "NORMA_BELUM_TERSEDIA" };
      continue;
    }

    const { mean, sd } = normMap[snakeKey];
    let z = sd > 0 ? (rawValue - mean) / sd : 0;
    if (!higherIsBetter) z = -z; // balik arah: z besar = lebih baik

    const kategori = z >= 1.0 ? "Tinggi" : z <= -1.0 ? "Rendah" : "Sedang";
    result[camelKey] = { raw: rawValue, z: Math.round(z * 100) / 100, kategori };
  }

  return result;
}
