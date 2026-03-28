# Panduan agen AI — Arsy Jaya Printing (STOK / Produksi)

Dokumen ini merangkum **fitur, logika bisnis, struktur kode, dan integrasi Supabase** agar agen atau developer lain bisa berkontribusi tanpa harus membaca seluruh repo secara linear.  
**Selalu perbarui `docs/CHANGELOG.md` mengikuti `docs/SOP_PERUBAHAN.md` setelah perbaikan yang sudah diverifikasi.**

---

## 1. Ringkasan produk

Aplikasi web internal untuk **mencatat produksi percetakan**, **mengelola stok bahan (meter / roll)**, **dashboard admin**, dan **log mesin** (maintenance & ganti tinta).  
Autentikasi via **Supabase Auth**; peran **`admin`** vs **`operator`** mengatur akses halaman.

---

## 2. Stack teknis

| Layer | Teknologi |
|--------|-----------|
| UI | React 19, React Router 7, inline styles + variabel CSS (`index.css`) |
| Build | Vite 7, `@vitejs/plugin-react`, Tailwind 4 (`@tailwindcss/vite`) |
| Backend data | Supabase (Postgres + Auth + Row Level Security) |
| Deploy | Vercel (`vercel.json`: SPA rewrite ke `index.html`) |
| PWA | `vite-plugin-pwa` — manifest, service worker, mode pembaruan (lihat §10) |

Variabel lingkungan: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` di `.env` (lihat `src/lib/supabaseClient.js`).

---

## 3. Autentikasi & peran

- **`src/context/AuthContext.jsx`**: session Supabase, fetch `profiles` (role, `display_name`).
- **`isAdmin`** = `profile.role === 'admin'`.
- **`ProtectedRoute`** (`App.jsx`): tanpa session → `/login`; `adminOnly` → non-admin diarahkan ke `/`.

**Alur default setelah login**

- **Admin** → redirect `/` ke **`/admin`** (Admin Dashboard).
- **Operator** → **`/`** = Operator Dashboard.

---

## 4. Routing (sumber kebenaran: `src/App.jsx`)

| Path | Komponen | Akses |
|------|-----------|--------|
| `/login` | `Login` | Publik (jika sudah login → redirect) |
| `/` | `OperatorDashboard` atau redirect `/admin` | Terautentikasi |
| `/production` | `ProductionForm` | Terautentikasi |
| `/team-history` | `TeamHistory` | Terautentikasi |
| `/materials` | `MaterialManagement` | Terautentikasi (operator: stok) |
| `/machine-logs` | `MachineLogs` | Terautentikasi (admin & operator) |
| `/admin` | `AdminDashboard` | Admin |
| `/admin/users` | `UserManagement` | Admin |
| `/admin/materials` | `MaterialManagement` | Admin |
| `/admin/machines` | `MachineManagement` | Admin |
| `/admin/history` | `HistoryEditor` | Admin |
| `/admin/export` | `CSVExporter` | Admin |

Navigasi sidebar: `Sidebar.jsx` / `BottomNav.jsx` (mobile) — item berbeda untuk admin vs operator.

---

## 5. Basis data Supabase (tabel yang dipakai di kode)

Schema dasar ada di **`supabase/schema.sql`** dan RLS contoh di **`supabase/rls.sql`**.  
Beberapa fitur memakai tabel **yang mungkin ditambahkan di luar file schema repo** — cek query di kode.

### Tabel inti (umum di schema)

- **`profiles`**: `id` (UUID = `auth.users`), `display_name`, `role` (`admin` \| `operator`).
- **`machines`**: mesin cetak; ada konsep `is_active` (dipakai di `ProductionForm`, `MachineManagement`).
- **`materials`**: bahan, `width_cm`, `total_stock_m`, `min_stock_m`, harga, dll.
- **`production_logs`**: log produksi operator (`operator_id`, `machine_id`, `material_id`, netto/bruto meter, `category`, `notes`, field opsional order).
- **`stock_movements`**: arus stok (masuk/koreksi/adjustment), terkait bahan & operator.
- **`app_settings`**: key-value (mis. `daily_target_m`, template WA admin).

### Tabel log mesin (maintenance & tinta)

- **`trx_maintenance_log`**
- **`trx_ink_log`**

**Penting:** query list **jangan** memakai embed `profiles:created_by(...)` kecuali FK di database memang ke `profiles.id` — jika salah, **seluruh SELECT bisa gagal** dan UI kosong meski insert sukses.  
Saat ini kode memakai `select('*, machines(name)')` + **`created_by`** di-set saat insert dari `user.id`.  
RLS & kolom: lihat **`supabase/machine_logs.sql`** (jalankan di Supabase jika perlu).

---

## 6. Logika bisnis utama

### 6.1 Log produksi — `ProductionForm.jsx`

- Alur wizard: mesin → material → kategori → input → konfirmasi → insert `production_logs`.
- **Mode Order** (`category === 'order'`): kalkulator ukuran cetak (cm), margin samping, gap antar netto, orientasi/rotasi, `OrderLayoutPreview`.
- **Mode non-order** (`tes_warna`, `maintenance`, `kerusakan`): input bruto/netto **cm**, `LengthUsagePreview`.
- Stok: cek `finalBrutoM` vs `materials.total_stock_m` sebelum submit.
- Payload insert menyertakan field order bila relevan (`order_panjang_cm`, `order_lebar_cm`, `jumlah_lembar`, dll.).

### 6.2 Stok bahan — `MaterialManagement.jsx`

- CRUD bahan, tambah stok (`stock_movements`), koreksi stok, harga (per m / per roll).
- Input angka memakai **`NumericStepInput`** (stepper custom, tanpa spinner native).

### 6.3 Admin dashboard — `AdminDashboard.jsx`

- Ringkasan stok, aktivitas, pengaturan global (`app_settings`: target harian netto, WA).
- Leaderboard operator (pernah diubah ke agregasi **pekan ini** — cek kode terkini).

### 6.4 Riwayat & editor — `HistoryEditor.jsx`, `TeamHistory.jsx`, `Dashboard.jsx`

- Riwayat produksi; penyuntingan oleh admin di `HistoryEditor` (termasuk dampak ke stok / `stock_movements` jika mengubah riwayat masuk).
- Tampilan panjang sering dalam **cm** untuk konsistensi UX.

### 6.5 Log mesin — `MachineLogs.jsx`

- Dua tab: **Maintenance** (`trx_maintenance_log`), **Ink** (`trx_ink_log`).
- **Operator**: tambah log, lihat daftar; **Edit/Hapus** hanya **admin** (`isAdmin`).
- Simpan insert dengan payload eksplisit + `created_by` untuk kepatuhan RLS.

### 6.6 Komponen UI bersama

- **`components/ui/NumericStepInput.jsx`**: input angka + stepper; `step="any"` + `bumpStep` untuk Rp.
- **`components/ui/Toast.jsx`** + **`useToast`**: notifikasi singkat.
- **`hooks/useBreakpoint.js`**: `isMobile` untuk layout responsif.

---

## 7. Gaya kode & konvensi

- Banyak halaman memakai **inline `style={{}}`** (bukan Tailwind class di JSX).
- Ikuti pola file yang ada; hindari refactor besar tanpa permintaan eksplisit.
- Setelah perubahan signifikan: **`npm run build`** harus sukses sebelum dianggap selesai.

---

## 8. Pitfall yang sudah dikenal

1. **Supabase embed salah** → query gagal diam-diam jika `catch` tidak menampilkan error ke user.
2. **RLS** → insert berhasil di satu role tapi select kosong jika policy memfilter `created_by` atau tidak ada policy SELECT.
3. **PWA dev** → service worker biasanya off di dev (`devOptions.enabled: false`); uji update di production/preview.
4. **SPA routing di Vercel** → butuh rewrite ke `index.html` (sudah di `vercel.json`).

---

## 9. File SQL tambahan di repo

| File | Fungsi |
|------|--------|
| `supabase/schema.sql` | Schema inti |
| `supabase/rls.sql` | Contoh RLS |
| `supabase/triggers.sql` | Trigger terkait |
| `supabase/machine_logs.sql` | Kolom `created_by` + policy untuk `trx_*` log mesin |

---

## 10. PWA & pembaruan aplikasi

- Konfigurasi: **`vite.config.js`** (`VitePWA`).
- **Branch `UPDATE` (GitHub)** mungkin berisi fitur **banner “Versi baru tersedia”** (`registerType: 'prompt'`, komponen `PwaUpdatePrompt`) — cek apakah sudah di-merge ke `main` saat Anda bekerja.

---

## 11. Dokumentasi perubahan

- **`docs/CHANGELOG.md`**: riwayat perubahan terkurasi.
- **`docs/SOP_PERUBAHAN.md`**: cara wajib mencatat setiap fix/feature yang sudah terverifikasi.

---

*Terakhir diselaraskan dengan struktur repo pada pembuatan dokumen ini; jika ada penyimpangan, utamakan kode dan migration di Supabase sebagai sumber kebenaran.*
