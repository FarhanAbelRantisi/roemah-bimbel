"""
Demo end-to-end:
1. Admin buat norm_group 'TNI' dan config tes.
2. Simulasikan beberapa testee mengerjakan sesi (data disimulasikan acak,
   di aplikasi nyata ini datang dari input frontend/timer).
3. Hitung skor tiap sesi.
4. Recompute norma dari histori.
5. Klasifikasikan sesi testee terbaru terhadap norma.
"""

import os
import random
import datetime as dt

from engine import (
    init_db, TestConfigInput, create_config, create_norm_group,
    start_session, record_column_result, finalize_session,
    recompute_norm_stats, classify_session, digit_at, generate_batch,
)

DB_FILE = "pauli.db"
if os.path.exists(DB_FILE):
    os.remove(DB_FILE)  # fresh demo setiap dijalankan

conn = init_db(DB_FILE, "schema.sql")

# --- 1. Admin setup ---
norm_group_id = create_norm_group(conn, jenis_seleksi="TNI", batch="2026-A")

cfg = TestConfigInput(
    nama_config="Pauli Standar TNI 60 Menit",
    total_duration_sec=3600,     # 60 menit
    signal_interval_sec=180,     # aba-aba tiap 3 menit
    digit_min=0,
    digit_max=9,
    # tidak ada angka_per_kolom -- soal digenerate lazy tanpa batas
)
print(f"Jumlah kolom otomatis: {cfg.jumlah_kolom}")  # -> 20 kolom

config_id = create_config(conn, cfg)
cfg_row = conn.execute("SELECT * FROM test_configs WHERE id = ?", (config_id,)).fetchone()

# --- Contoh pemakaian generator lazy: frontend minta digit sedikit demi
#     sedikit sesuai kebutuhan tampilan, bukan sekaligus dengan batas fixed ---
print("\n=== Contoh Generator Lazy (kolom ke-0, seed=42) ===")
batch_1 = generate_batch(seed=42, kolom_index=0, start_pos=0, count=10)
print(f"Batch pertama (posisi 0-9)  : {batch_1}")
batch_2 = generate_batch(seed=42, kolom_index=0, start_pos=10, count=10)
print(f"Batch kedua   (posisi 10-19): {batch_2}")
# Reproducibility check: minta ulang posisi yang sama -> hasil harus identik
ulang = generate_batch(seed=42, kolom_index=0, start_pos=0, count=10)
assert ulang == batch_1, "Generator harus deterministik untuk posisi yang sama!"
print("Reproducibility check: OK (posisi sama -> digit sama)")


def simulate_session(testee_ref: str, rata2_kerja: int, variasi: int, tingkat_error: float):
    """Simulasikan satu sesi testee mengerjakan seluruh kolom."""
    session_id = start_session(conn, testee_ref, config_id, norm_group_id, seed=42)
    now = dt.datetime.now(dt.timezone.utc)
    for k in range(cfg.jumlah_kolom):
        jumlah = max(0, int(random.gauss(rata2_kerja, variasi)))
        salah = int(jumlah * tingkat_error)
        benar = jumlah - salah
        waktu_mulai = (now + dt.timedelta(seconds=k * cfg.signal_interval_sec)).isoformat()
        waktu_selesai = (now + dt.timedelta(seconds=(k + 1) * cfg.signal_interval_sec)).isoformat()
        record_column_result(conn, session_id, k, jumlah, benar, waktu_mulai, waktu_selesai)
    return finalize_session(conn, session_id), session_id


# --- 2. Simulasikan beberapa testee historis (untuk membangun norma) ---
print("\n=== Simulasi histori testee (untuk norma) ===")
historis = [
    ("T001", 40, 5, 0.03),
    ("T002", 35, 8, 0.06),
    ("T003", 45, 4, 0.02),
    ("T004", 30, 10, 0.10),
    ("T005", 50, 6, 0.01),
    ("T006", 38, 7, 0.05),
]
for ref, mean_kerja, var, err in historis:
    score, _ = simulate_session(ref, mean_kerja, var, err)
    print(f"{ref}: {score}")

# --- 3. Recompute norma dari histori di atas ---
print("\n=== Recompute Norma Kelompok 'TNI' ===")
norms = recompute_norm_stats(conn, norm_group_id)
for metric, stat in norms.items():
    print(f"{metric}: n={stat['n']}, mean={stat['mean']:.2f}, sd={stat['sd']:.2f}")

# --- 4. Testee baru, dibandingkan ke norma di atas ---
print("\n=== Testee Baru ===")
score_baru, session_baru_id = simulate_session("T_BARU", 48, 3, 0.015)
print(f"Skor mentah T_BARU: {score_baru}")

klasifikasi = classify_session(conn, session_baru_id)
print("\nKlasifikasi terhadap norma kelompok 'TNI':")
for metric, hasil in klasifikasi.items():
    print(f"  {metric}: {hasil}")

conn.close()