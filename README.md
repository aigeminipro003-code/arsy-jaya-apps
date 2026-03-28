# ⚡ Arsy Jaya Printing LOG

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

**Arsy Jaya APPS Pro** adalah sistem manajemen produksi dan inventaris kustom yang dirancang khusus untuk industri percetakan. Aplikasi ini berfokus pada presisi pelacakan bahan (Net vs Bruto) dan efisiensi tim secara real-time.

### Dokumentasi teknis & SOP perubahan

- **[Panduan agen AI / developer](docs/PANDUAN_AGEN_AI.md)** — arsitektur, routing, Supabase, logika bisnis, pitfall.
- **[SOP pencatatan perubahan](docs/SOP_PERUBAHAN.md)** — kapan dan bagaimana mencatat fix/fitur yang sudah terverifikasi.
- **[Changelog](docs/CHANGELOG.md)** — riwayat perubahan terkurasi.

---

## 🚀 Fitur Utama

### 👨‍💼 Admin Dashboard
- **Production Intelligence:** Pantau efisiensi produksi (%) dan rasio waste harian.
- **Fuel-Gauge Inventory:** Visualisasi stok bahan dengan indikator warna (Kritis, Warning, Aman).
- **Export Power:** Generate laporan produksi ke format CSV dalam satu klik.
- **Audit Trail:** Transparansi penuh dengan catatan alasan setiap kali ada perubahan data.

### 👷 Operator Tools
- **Fast Logging:** Input meteran gambar (Net) dan meteran bahan (Bruto) dengan keypad yang dioptimalkan.
- **Live Team Feed:** Pantau progres produksi tim secara real-time tanpa akses edit yang berisiko.
- **Low Stock Alert:** Informasi stok bahan terkini agar tidak terjadi keterlambatan produksi.

## 🛠️ Stack Teknologi
- **Frontend:** React.js dengan Vite (Super Fast Build).
- **Styling:** Tailwind CSS (Custom Dark Theme).
- **Icons:** Lucide-React (Minimalist style).
- **Database & Auth:** Supabase (PostgreSQL) dengan Row Level Security (RLS).

## 📦 Instalasi & Pengembangan

Jika Anda ingin menjalankan proyek ini secara lokal:

1. Clone repositori:
   ```bash
   git clone [https://github.com/username/arsy-jaya-apps.git](https://github.com/username/arsy-jaya-apps.git)
