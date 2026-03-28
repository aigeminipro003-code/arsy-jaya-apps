# Changelog

Semua perubahan penting pada proyek ini didokumentasikan di file ini.  
Format mengikuti spirit [Keep a Changelog](https://keepachangelog.com/); urutan **terbaru di atas**.  
**Proses pencatatan wajib mengikuti `docs/SOP_PERUBAHAN.md`.**

---

## [Unreleased]

### Yang perlu dicatat di sini setelah merge/review
- Fitur banner PWA “Versi baru tersedia” jika branch **`UPDATE`** sudah digabung ke `main` (`PwaUpdatePrompt`, `registerType: 'prompt'`).

---

## 2026-03-28

### Ditambahkan
- **`docs/PANDUAN_AGEN_AI.md`**: ringkasan arsitektur, routing, Supabase, logika bisnis, pitfall.
- **`docs/SOP_PERUBAHAN.md`**: standar pencatatan perubahan + checklist.
- **`docs/CHANGELOG.md`**: riwayat terpusat (file ini).

### Diperbaiki (referensi commit terkait di GitHub)
- **Log Mesin** (`MachineLogs.jsx`): daftar maintenance & tinta memakai `select('*, machines(name)')` (hindari embed `profiles` yang mem-batalkan query); insert mengisi **`created_by`**; toast error saat load gagal; Edit/Hapus hanya admin.
- **SQL opsional**: `supabase/machine_logs.sql` untuk kolom `created_by` + RLS `trx_maintenance_log` / `trx_ink_log`.

### Catatan cabang
- Branch **`UPDATE`** di remote: fitur notifikasi pembaruan PWA (prompt + reload); belum tentu sama dengan `main` — cek `git log` / PR sebelum mengasumsikan.

---

## Riwayat fitur utama (kurasi — sebelum changelog terstruktur)

Ringkasan untuk konteks agen AI; detail implementasi ada di kode.

### Autentikasi & peran
- Login Supabase; profil `profiles.role` menentukan admin vs operator dan menu sidebar.

### Operator
- Dashboard, **Log Produksi** (`ProductionForm`: order vs non-order, cm, kalkulator layout), **Riwayat Tim**, **Stok Bahan** (`/materials`), **Log Mesin** (input + lihat).

### Admin
- Dashboard, manajemen bahan/mesin/user, riwayat editor, export CSV, log mesin (termasuk edit/hapus log).

### Stok & produksi
- `production_logs` mengurangi stok sesuai logika aplikasi/trigger DB; `stock_movements` untuk masuk & penyesuaian; material punya `total_stock_m`, lebar cm, harga.

### UX
- **`NumericStepInput`**: stepper seragam di form angka (material, history, dashboard target, machine logs, dll.).
- **`DimInput` / order**: memakai komponen stepper yang sama; layout grid responsif `isMobile` untuk field order.
- Tampilan riwayat/dimensi sering dalam **cm** untuk konsistensi.

### PWA
- Manifest + service worker via `vite-plugin-pwa`; deploy SPA dengan `vercel.json`.

---

## Jenis entri (kategori)

- **Ditambahkan**: fitur baru.
- **Diubah**: perilaku yang sudah ada dimodifikasi.
- **Diperbaiki**: bugfix.
- **Dihapus**: fitur dihilangkan.
- **Keamanan**: RLS, auth, data sensitif.

---

*Entri tanggal harus disesuaikan dengan tanggal merge/release aktual saat tim mengupdate dokumen ini.*
