# SOP pencatatan perubahan (fix & fitur)

Tujuan: setiap perubahan yang **sudah fix, teruji, dan bebas error build** tercatat rapi agar tim dan agen AI lain bisa **audit cepat** tanpa membaca diff penuh.

---

## Kapan wajib mencatat

Lakukan **setelah** semua berikut terpenuhi:

1. Perubahan sudah diimplementasi sesuai permintaan.
2. **`npm run build`** sukses (wajib untuk perubahan frontend).
3. Tidak ada regresi yang disengaja yang belum didokumentasikan (jika ada trade-off, tulis di CHANGELOG).

---

## Di mana mencatat

| Dokumen | Isi |
|---------|-----|
| **`docs/CHANGELOG.md`** | Entri kronologis versi / tanggal — **ini sumber utama riwayat**. |
| **`docs/PANDUAN_AGEN_AI.md`** | Perbarui hanya jika ada **perubahan arsitektur, tabel baru, alur auth, atau pitfall baru**. Tidak perlu edit untuk setiap bug kecil. |

---

## Format entri di `CHANGELOG.md`

Gunakan urutan **terbaru di atas** (reverse chronological).

### Template satu entri

```markdown
## YYYY-MM-DD

### Ditambahkan / Diubah / Diperbaiki / Keamanan
- **Area singkat**: kalimat aktif apa yang berubah dan mengapa (satu ide per bullet).
```

**Contoh**

```markdown
## 2026-03-28

### Diperbaiki
- **Log Mesin**: query list tanpa embed `profiles` agar data tampil; insert mengisi `created_by` untuk RLS.

### Ditambahkan
- **PWA**: banner pembaruan versi (mode prompt) — _lihat branch UPDATE jika belum di-merge ke main_.
```

---

## Konvensi commit Git (disarankan)

- Satu tema utama per commit jika memungkinkan.
- Prefiks: `fix:`, `feat:`, `docs:`, `chore:`, `refactor:` (mirip Conventional Commits).
- Contoh: `fix(machine-logs): tampilkan data dan operator bisa input`

---

## Checklist sebelum merge ke `main`

- [ ] `npm run build` lokal sukses
- [ ] Entri relevan ditambahkan di **`docs/CHANGELOG.md`**
- [ ] Jika perilaku user-facing berubah signifikan, satu baris di **`PANDUAN_AGEN_AI.md`** (bagian fitur/logika) diperbarui
- [ ] Migration Supabase (jika ada) tercatat di CHANGELOG dan file `.sql` ada di `supabase/`

---

## Cabang & review

Jika tim memakai branch review (mis. **`UPDATE`**):

1. Commit di branch feature/review.
2. Isi CHANGELOG di branch yang sama (atau saat merge — yang penting **ada sebelum/saat release**).
3. Setelah merge ke `main`, pastikan CHANGELOG di `main` berisi gabungan entri.

---

## Yang tidak perlu dicatat

- Perubahan gaya/format kosmetik tanpa dampak perilaku.
- Eksperimen lokal yang tidak di-push.

---

*Dokumen ini adalah kontrak proses; penyimpangan hanya untuk alasan darurat dan sebaiknya ditambahkan catatan di CHANGELOG.*
