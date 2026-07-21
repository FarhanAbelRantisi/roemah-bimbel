"""
Prototype Engine Tes Pauli
===========================

Mengimplementasikan:
1. Pembuatan konfigurasi tes oleh admin (jumlah kolom dihitung otomatis).
2. Generator angka acak per kolom.
3. Pencatatan hasil kerja testee per kolom.
4. Kalkulasi metrik hasil sesi (Jumlah, Ketelitian, Median, Puncak,
   Bawah, Deviasi Konsistensi) -- BUKAN skor persen tunggal.
5. Perhitungan norma kelompok (mean & SD) dari histori sesi.
6. Konversi skor individu -> kategori (Rendah/Sedang/Tinggi) via Z-score.

Database: SQLite (untuk prototype). Skema mengikuti schema.sql.
"""

from __future__ import annotations
import sqlite3
import random
import statistics
import datetime as dt
from dataclasses import dataclass
from typing import Optional


DB_PATH = "pauli.db"


# =========================================================
# SETUP DATABASE
# =========================================================

def init_db(db_path: str = DB_PATH, schema_path: str = "schema.sql") -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    with open(schema_path, "r") as f:
        conn.executescript(f.read())
    conn.commit()
    return conn


# =========================================================
# 1. KONFIGURASI TES (INPUT ADMIN)
# =========================================================

@dataclass
class TestConfigInput:
    nama_config: str
    total_duration_sec: int      # contoh: 3600 = 60 menit
    signal_interval_sec: int     # contoh: 180  = 3 menit
    digit_min: int = 0
    digit_max: int = 9
    instruksi_teks: str = ""
    # Catatan: TIDAK ada angka_per_kolom. Soal digenerate on-demand
    # (lazy) tanpa batas kapasitas -- lihat digit_at() di bawah.
    # Ini meniru desain asli: testee tidak pernah didesain untuk
    # "menghabiskan" kolom, jadi tidak boleh ada limit soal yang
    # bisa membatasi orang yang sangat cepat.

    @property
    def jumlah_kolom(self) -> int:
        # Jumlah kolom TIDAK diinput manual -- turunan dari durasi & interval.
        if self.total_duration_sec % self.signal_interval_sec != 0:
            raise ValueError(
                "total_duration_sec harus kelipatan signal_interval_sec"
            )
        return self.total_duration_sec // self.signal_interval_sec


def create_config(conn: sqlite3.Connection, cfg: TestConfigInput) -> int:
    cur = conn.execute(
        """INSERT INTO test_configs
           (nama_config, total_duration_sec, signal_interval_sec,
            digit_min, digit_max, instruksi_teks)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (cfg.nama_config, cfg.total_duration_sec, cfg.signal_interval_sec,
         cfg.digit_min, cfg.digit_max, cfg.instruksi_teks),
    )
    conn.commit()
    return cur.lastrowid


def create_norm_group(conn: sqlite3.Connection, jenis_seleksi: str,
                       batch: Optional[str] = None,
                       keterangan: Optional[str] = None) -> int:
    cur = conn.execute(
        """INSERT INTO norm_groups (jenis_seleksi, batch, keterangan)
           VALUES (?, ?, ?)""",
        (jenis_seleksi, batch, keterangan),
    )
    conn.commit()
    return cur.lastrowid


# =========================================================
# 2. GENERATOR SOAL (LAZY, TANPA BATAS KAPASITAS)
# =========================================================
#
# Tidak ada list angka yang di-pregenerate dengan panjang tertentu.
# Sebagai gantinya, setiap digit dihitung deterministik dari
# (seed, kolom_index, posisi_index):
#   - Testee bisa "meminta" digit sebanyak apapun dalam satu kolom,
#     tidak akan pernah kehabisan soal.
#   - Digit yang sama selalu bisa direproduksi ulang (untuk audit/
#     replay) tanpa perlu menyimpan seluruh deretnya di database.
#   - Memory-nya O(1) -- tidak perlu simpan array besar di server.

def digit_at(seed: int, kolom_index: int, posisi_index: int,
             digit_min: int = 0, digit_max: int = 9) -> int:
    """Menghitung satu digit soal secara deterministik berdasarkan posisinya.

    Posisi yang sama (seed, kolom_index, posisi_index) akan selalu
    menghasilkan digit yang sama -- ini yang membuatnya reproducible
    tanpa perlu menyimpan seluruh deret angka di database.
    """
    combined = hash((seed, kolom_index, posisi_index))
    rng = random.Random(combined)
    return rng.randint(digit_min, digit_max)


def generate_batch(seed: int, kolom_index: int, start_pos: int, count: int,
                    digit_min: int = 0, digit_max: int = 9) -> list[int]:
    """Ambil `count` digit berikutnya mulai dari start_pos.

    Dipanggil berulang oleh frontend setiap kali testee mendekati
    ujung batch yang sedang ditampilkan (mis. minta 20 digit lagi),
    bukan sekali di awal dengan panjang fixed.
    """
    return [digit_at(seed, kolom_index, start_pos + i, digit_min, digit_max)
            for i in range(count)]


# =========================================================
# 3. SESI TES
# =========================================================

def start_session(conn: sqlite3.Connection, testee_ref: str, config_id: int,
                   norm_group_id: int, seed: Optional[int] = None) -> int:
    cur = conn.execute(
        """INSERT INTO test_sessions
           (testee_ref, config_id, norm_group_id, random_seed, started_at, status)
           VALUES (?, ?, ?, ?, ?, 'in_progress')""",
        (testee_ref, config_id, norm_group_id, seed,
         dt.datetime.now(dt.timezone.utc).isoformat()),
    )
    conn.commit()
    return cur.lastrowid


def record_column_result(conn: sqlite3.Connection, session_id: int, kolom_index: int,
                          jumlah_dikerjakan: int, jumlah_benar: int,
                          waktu_mulai: str, waktu_selesai: str) -> None:
    jumlah_salah = jumlah_dikerjakan - jumlah_benar
    conn.execute(
        """INSERT INTO column_results
           (session_id, kolom_index, jumlah_dikerjakan, jumlah_benar,
            jumlah_salah, waktu_mulai, waktu_selesai)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (session_id, kolom_index, jumlah_dikerjakan, jumlah_benar,
         jumlah_salah, waktu_mulai, waktu_selesai),
    )
    conn.commit()


# =========================================================
# 4. KALKULASI SKOR SESI (metrik klasik, bukan persen gabungan)
# =========================================================

def finalize_session(conn: sqlite3.Connection, session_id: int) -> dict:
    rows = conn.execute(
        """SELECT kolom_index, jumlah_dikerjakan, jumlah_benar, jumlah_salah
           FROM column_results WHERE session_id = ? ORDER BY kolom_index""",
        (session_id,),
    ).fetchall()

    if not rows:
        raise ValueError("Sesi belum memiliki data kolom, tidak bisa dihitung.")

    per_kolom = [r["jumlah_dikerjakan"] for r in rows]

    jumlah_total = sum(per_kolom)
    total_benar = sum(r["jumlah_benar"] for r in rows)
    total_salah = sum(r["jumlah_salah"] for r in rows)
    rasio_ketelitian = total_benar / jumlah_total if jumlah_total else 0.0
    median_per_kolom = statistics.median(per_kolom)
    puncak = max(per_kolom)
    bawah = min(per_kolom)

    # Deviasi konsistensi: rata-rata selisih absolut antar kolom berurutan.
    # Semakin kecil -> semakin konsisten (grafik landai).
    if len(per_kolom) > 1:
        selisih = [abs(per_kolom[i] - per_kolom[i - 1]) for i in range(1, len(per_kolom))]
        deviasi_konsistensi = sum(selisih) / len(selisih)
    else:
        deviasi_konsistensi = 0.0

    conn.execute(
        """INSERT OR REPLACE INTO session_scores
           (session_id, jumlah_total, total_benar, total_salah,
            rasio_ketelitian, median_per_kolom, puncak, bawah,
            deviasi_konsistensi)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (session_id, jumlah_total, total_benar, total_salah,
         rasio_ketelitian, median_per_kolom, puncak, bawah,
         deviasi_konsistensi),
    )
    conn.execute(
        "UPDATE test_sessions SET status = 'completed', finished_at = ? WHERE id = ?",
        (dt.datetime.now(dt.timezone.utc).isoformat(), session_id),
    )
    conn.commit()

    return {
        "jumlah_total": jumlah_total,
        "total_benar": total_benar,
        "total_salah": total_salah,
        "rasio_ketelitian": round(rasio_ketelitian, 4),
        "median_per_kolom": median_per_kolom,
        "puncak": puncak,
        "bawah": bawah,
        "deviasi_konsistensi": round(deviasi_konsistensi, 4),
    }


# =========================================================
# 5. NORMA KELOMPOK (mean & SD dari histori sesi 'completed')
# =========================================================

# Metrik mana yang dinormakan, dan apakah "semakin besar semakin baik" (True)
# atau "semakin kecil semakin baik" (False) -- dipakai saat klasifikasi.
NORMED_METRICS = {
    "jumlah_total": True,
    "rasio_ketelitian": True,
    "deviasi_konsistensi": False,   # makin kecil = makin konsisten = makin baik
}


def recompute_norm_stats(conn: sqlite3.Connection, norm_group_id: int) -> dict:
    rows = conn.execute(
        """SELECT s.jumlah_total, s.rasio_ketelitian, s.deviasi_konsistensi
           FROM session_scores s
           JOIN test_sessions t ON t.id = s.session_id
           WHERE t.norm_group_id = ? AND t.status = 'completed'""",
        (norm_group_id,),
    ).fetchall()

    if len(rows) < 2:
        raise ValueError(
            "Minimal 2 sesi 'completed' diperlukan untuk menghitung norma "
            "(idealnya puluhan/ratusan untuk norma yang stabil)."
        )

    result = {}
    for metric in NORMED_METRICS:
        values = [r[metric] for r in rows]
        mean_v = statistics.mean(values)
        sd_v = statistics.stdev(values)  # sample SD
        conn.execute(
            """INSERT INTO norm_stats (norm_group_id, metric_name, n, mean_value, sd_value)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(norm_group_id, metric_name)
               DO UPDATE SET n=excluded.n, mean_value=excluded.mean_value,
                             sd_value=excluded.sd_value, updated_at=datetime('now')""",
            (norm_group_id, metric, len(values), mean_v, sd_v),
        )
        result[metric] = {"n": len(values), "mean": mean_v, "sd": sd_v}

    conn.commit()
    return result


# =========================================================
# 6. KLASIFIKASI SKOR INDIVIDU -> Rendah / Sedang / Tinggi
# =========================================================

def classify_session(conn: sqlite3.Connection, session_id: int) -> dict:
    session = conn.execute(
        "SELECT norm_group_id FROM test_sessions WHERE id = ?", (session_id,)
    ).fetchone()
    if session is None:
        raise ValueError("Session tidak ditemukan.")
    norm_group_id = session["norm_group_id"]

    score = conn.execute(
        "SELECT * FROM session_scores WHERE session_id = ?", (session_id,)
    ).fetchone()
    if score is None:
        raise ValueError("Skor sesi belum dihitung. Jalankan finalize_session dulu.")

    norms = conn.execute(
        "SELECT metric_name, mean_value, sd_value FROM norm_stats WHERE norm_group_id = ?",
        (norm_group_id,),
    ).fetchall()
    norm_map = {r["metric_name"]: (r["mean_value"], r["sd_value"]) for r in norms}

    hasil = {}
    for metric, higher_is_better in NORMED_METRICS.items():
        if metric not in norm_map:
            hasil[metric] = {"z": None, "kategori": "NORMA_BELUM_TERSEDIA"}
            continue
        mean_v, sd_v = norm_map[metric]
        raw_value = score[metric]
        z = (raw_value - mean_v) / sd_v if sd_v > 0 else 0.0
        if not higher_is_better:
            z = -z  # balik arah agar z besar selalu berarti "lebih baik"

        if z >= 1.0:
            kategori = "Tinggi"
        elif z <= -1.0:
            kategori = "Rendah"
        else:
            kategori = "Sedang"

        hasil[metric] = {"raw": raw_value, "z": round(z, 2), "kategori": kategori}

    return hasil