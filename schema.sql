-- =========================================================
-- SKEMA DATABASE: TES PAULI ENGINE
-- =========================================================
-- Prinsip desain:
-- 1. Data mentah per-kolom disimpan apa adanya (tidak diagregasi
--    saat insert), supaya audit/grafik bisa direkonstruksi ulang.
-- 2. Norma kelompok TERPISAH dari sesi individu, dan dihitung ulang
--    (recomputed) secara periodik dari histori, bukan hardcode.
-- 3. Tidak ada kolom identitas personal wajib (nama, usia, dll).
--    Yang wajib hanya norm_group_id, supaya perbandingan tetap
--    apple-to-apple (mis. semua "Seleksi TNI" dibandingkan sesama
--    "Seleksi TNI").
-- =========================================================

-- ---------------------------------------------------------
-- 1. KELOMPOK NORMA
-- Merepresentasikan "populasi pembanding". Minimal ada 1 baris
-- untuk jenis_seleksi = 'TNI'. Bisa ditambah batch/tahun jika perlu
-- melihat tren, tapi TIDAK wajib.
-- ---------------------------------------------------------
CREATE TABLE norm_groups (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    jenis_seleksi   TEXT NOT NULL,          -- contoh: 'TNI'
    batch           TEXT,                   -- opsional, contoh: '2026-A'
    keterangan      TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------
-- 2. KONFIGURASI TES (diisi admin sebelum sesi dibuka)
-- jumlah_kolom TIDAK diinput manual — dihitung otomatis oleh
-- engine dari total_duration_sec / signal_interval_sec.
-- ---------------------------------------------------------
CREATE TABLE test_configs (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_config          TEXT NOT NULL,
    total_duration_sec   INTEGER NOT NULL,   -- contoh: 3600 (60 menit)
    signal_interval_sec  INTEGER NOT NULL,   -- contoh: 180 (3 menit)
    digit_min            INTEGER NOT NULL DEFAULT 0,
    digit_max            INTEGER NOT NULL DEFAULT 9,
    -- angka_per_kolom TIDAK ADA: soal digenerate on-demand (lazy),
    -- jadi tidak ada batas kapasitas yang perlu diinput admin.
    instruksi_teks       TEXT,
    created_at           TEXT DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------
-- 3. SESI TES (satu baris = satu kali testee mengerjakan tes)
-- ---------------------------------------------------------
CREATE TABLE test_sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    testee_ref      TEXT NOT NULL,      -- ID/kode peserta, BUKAN data pribadi
    config_id       INTEGER NOT NULL REFERENCES test_configs(id),
    norm_group_id   INTEGER NOT NULL REFERENCES norm_groups(id),
    random_seed     INTEGER,            -- untuk reproduksi soal jika diperlukan audit
    started_at      TEXT,
    finished_at     TEXT,
    status          TEXT NOT NULL DEFAULT 'in_progress'
                        CHECK (status IN ('in_progress','completed','aborted'))
);

-- ---------------------------------------------------------
-- 4. JAWABAN DETAIL (granular, per posisi soal dalam kolom)
-- Satu baris = satu posisi soal (pasangan digit yang berdekatan)
-- yang pernah dijawab peserta. Kalau peserta mengoreksi jawaban
-- SEBELUM kolom terkunci, baris yang sama di-UPDATE (bukan insert
-- baru) dan jumlah_edit bertambah -- ini yang membedakan "koreksi
-- sendiri" dari "salah dan tidak disadari".
--
-- Setelah kolom terkunci (waktu interval terlampaui), tidak ada
-- lagi UPDATE yang diperbolehkan pada kolom_index tersebut --
-- ditegakkan di level aplikasi (lihat is_kolom_locked di engine.py),
-- bukan di level SQL, karena butuh kalkulasi waktu relatif terhadap
-- started_at & signal_interval_sec milik config sesi ini.
-- ---------------------------------------------------------
CREATE TABLE jawaban_detail (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id              INTEGER NOT NULL REFERENCES test_sessions(id),
    kolom_index             INTEGER NOT NULL,
    posisi_index            INTEGER NOT NULL,   -- urutan pasangan digit dalam kolom
    jawaban_terakhir        INTEGER NOT NULL,   -- digit satuan hasil (0-9)
    benar                   INTEGER NOT NULL CHECK (benar IN (0,1)),
    jumlah_edit             INTEGER NOT NULL DEFAULT 0,  -- 0 = belum pernah dikoreksi
    waktu_submit_pertama    TEXT NOT NULL,
    waktu_submit_terakhir   TEXT NOT NULL,
    UNIQUE(session_id, kolom_index, posisi_index)
);

-- ---------------------------------------------------------
-- 5. SKOR HASIL AKHIR SESI (diturunkan, dihitung setelah sesi selesai)
-- Diagregasi dari jawaban_detail per session_id, dikelompokkan
-- per kolom_index untuk deviasi konsistensi, dan diringkas total
-- untuk metrik lainnya.
-- ---------------------------------------------------------
CREATE TABLE session_scores (
    session_id              INTEGER PRIMARY KEY REFERENCES test_sessions(id),
    jumlah_total            INTEGER NOT NULL,   -- total dikerjakan (produktivitas)
    total_benar             INTEGER NOT NULL,
    total_salah             INTEGER NOT NULL,   -- salah FINAL saat kolom terkunci
    jumlah_dibetulkan       INTEGER NOT NULL,   -- posisi yang sempat dikoreksi (jumlah_edit>0)
    rasio_ketelitian         REAL NOT NULL,      -- benar / dikerjakan
    median_per_kolom         REAL NOT NULL,
    puncak                  INTEGER NOT NULL,   -- nilai kolom tertinggi
    bawah                   INTEGER NOT NULL,   -- nilai kolom terendah
    deviasi_konsistensi     REAL NOT NULL,      -- rata2 |selisih antar kolom|
    computed_at             TEXT DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------
-- 6. STATISTIK NORMA (mean & SD per metrik, per kelompok norma)
-- Direcompute secara periodik dari seluruh session_scores yang
-- 'completed' dalam norm_group yang sama. Tabel ini yang dipakai
-- untuk konversi skor individu -> kategori Rendah/Sedang/Tinggi.
-- ---------------------------------------------------------
CREATE TABLE norm_stats (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    norm_group_id   INTEGER NOT NULL REFERENCES norm_groups(id),
    metric_name     TEXT NOT NULL,   -- contoh: 'jumlah_total'
    n               INTEGER NOT NULL,
    mean_value      REAL NOT NULL,
    sd_value        REAL NOT NULL,
    updated_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(norm_group_id, metric_name)
);

-- Index bantu untuk query umum
CREATE INDEX idx_sessions_norm_group ON test_sessions(norm_group_id, status);
CREATE INDEX idx_jawaban_detail_session ON jawaban_detail(session_id, kolom_index);