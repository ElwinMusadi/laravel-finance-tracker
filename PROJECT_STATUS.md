# Status Proyek

> **Tanggal snapshot:** 8 September 2026
> **Cakupan:** Analisis statis codebase dan pengujian otomatis. Tidak mencakup profiling runtime atau penelusuran UI manual.

---

## Ringkasan Eksekutif

Laravel Finance Tracker adalah aplikasi keuangan pribadi untuk satu pengguna yang dibangun dengan Laravel, Inertia, dan React. Domain inti—pembukuan bergaya entri ganda melalui lima tipe bagan akun—sudah diimplementasikan dan diuji. Aplikasi mendukung autentikasi, akun, kontak, transaksi, dan budget.

Kesenjangan utama yang tersisa adalah tidak adanya kepemilikan data melalui `user_id` pada data keuangan. Aplikasi berjalan sebagai single-tenant secara praktik, tetapi belum mencegah pengguna terautentikasi lain mengakses data yang sama. Sebagian komponen antarmuka masih berupa scaffold dari starter kit.

---

## 1. Stack dan Versi Utama

| Lapisan | Paket / Alat | Versi |
|---|---|---|
| Runtime | PHP | 8.3 |
| Framework | `laravel/framework` | 13.29.0 |
| Autentikasi | `laravel/fortify` | 1.39.0 |
| Jembatan SPA | `inertiajs/inertia-laravel` / `@inertiajs/react` | 3.3.1 / ^3.0.0 |
| UI | React + TypeScript | ^19.2.0 / ^5.7.2 |
| Styling | Tailwind CSS v4 + shadcn/ui | ^4.0.0 |
| Grafik | Recharts | 3.8.0 |
| Analisis statis | Larastan (PHPStan level 7) | 3.10.0 |
| Gaya kode | Laravel Pint | 1.30.5 |
| Pengujian | Pest | 4.7.8 |
| Tipe rute | Laravel Wayfinder | 0.1.21 |
| DB produksi / tes | MySQL / SQLite in-memory | — |

---

## 2. Arsitektur dan Model Data

### Struktur backend

```text
app/
├── Http/Controllers/   AccountController, BudgetController, ContactController,
│                       DashboardController, TransactionController
├── Http/Requests/      Store*/Update* untuk empat model domain
├── Models/             Account, Budget, Contact, Transaction, User
└── Services/
    ├── AccountTypeMatrix   Aturan kombinasi tipe akun
    └── LedgerService       Saldo, kekayaan bersih, agregasi pemasukan/pengeluaran
```

### Model domain

| Model | Kolom penting | Catatan |
|---|---|---|
| `Account` | `name`, `type`, `contact_id`, `is_active` | Lima tipe: `asset`, `liability`, `revenue`, `expense`, `equity` |
| `Contact` | `name`, `is_active` | Terhubung ke akun |
| `Transaction` | `transaction_date`, `source_account_id`, `destination_account_id`, `amount`, `description` | Entri ganda; belum memiliki `user_id` |
| `Budget` | `account_id`, `period_month`, `amount` | Berbasis periode; belum memiliki `user_id` |

> Tidak ada `user_id` pada model domain. Semua data saat ini dibagikan kepada setiap pengguna yang telah login.

### Struktur frontend

```text
resources/js/
├── pages/       dasbor, akun, kontak, transaksi, budget, welcome
├── components/  empat modal formulir, sidebar, navigasi, grafik, dan komponen UI
├── hooks/       use-transaction-modal, use-flash-toast, use-appearance, …
├── layouts/     app-sidebar-layout dengan TransactionFormModal global
├── actions/     binding controller Wayfinder
└── routes/      binding named-route Wayfinder
```

Modal transaksi global menggunakan hook `useTransactionModal`, dipasang pada `AppSidebarLayout`, dan dapat dipicu dari sidebar atau tabel transaksi.

---

## 3. Status Fitur

| Fitur | Status | Detail |
|---|---|---|
| Autentikasi | Selesai | Login Fortify, profil, ubah password, tampilan, 2FA, dan passkey. Pendaftaran dinonaktifkan. |
| Akun | Selesai | CRUD, validasi, status aktif, saldo awal, dan tautan kontak. |
| Kontak | Selesai | CRUD dan perlindungan penghapusan saat masih terhubung ke akun. |
| Transaksi | Selesai | CRUD, filter bulan/akun, paginasi, serta validasi matriks tipe akun. |
| Budget | Selesai | CRUD, rekap pemakaian, dan indikator progres. |
| Dasbor | Selesai | Metrik ringkasan dan transaksi terbaru. Grafik masih menggunakan data contoh. |
| Bahasa Indonesia | Selesai | Locale Laravel, validasi, pesan flash, halaman, autentikasi, pengaturan, dan komponen aktif telah dialihbahasakan. |

---

## 4. Risiko dan Kesenjangan

### Tinggi

1. **Kepemilikan data belum ada.** Semua data keuangan tidak dibatasi oleh pengguna. Tambahkan `user_id`, scope kueri, policy, dan pengujian isolasi tenant sebelum mendukung lebih dari satu pengguna.
2. **Notifikasi flash perlu dipastikan dipasang pada layout.** Pastikan `useFlashToast()` dipanggil agar pesan sukses dan gagal dapat terlihat pengguna.

### Sedang

3. **Grafik dasbor bersifat statis.** `ChartAreaInteractive` masih memakai data contoh. Kirim agregasi harian dari `DashboardController` dan gunakan pada grafik.
4. **Tautan sidebar scaffold.** Sejumlah tautan placeholder masih mengarah ke `#`; hapus atau implementasikan sebelum dirilis.
5. **Dua lockfile frontend.** `package-lock.json` dan `pnpm-lock.yaml` sama-sama tersedia. Pilih satu manajer paket untuk hasil build yang konsisten.

### Rendah

6. Ganti `usePage<any>()` dengan tipe props Inertia yang eksplisit.
7. Hapus impor `tw-animate-css` yang duplikat bila masih ada.
8. Hapus pengguna fallback scaffold pada sidebar.

---

## 5. Roadmap

### P0 — Keamanan data

- [ ] Tetapkan aplikasi sebagai single-user secara eksplisit atau tambahkan `user_id` pada semua model domain.
- [ ] Tambahkan policy dan isolasi kueri berdasarkan pengguna.
- [ ] Pastikan notifikasi flash ditampilkan pada semua halaman aplikasi.

### P1 — Kelengkapan fungsi

- [ ] Hubungkan grafik dasbor dengan transaksi nyata.
- [ ] Selesaikan atau hapus navigasi placeholder.
- [ ] Tetapkan satu manajer paket frontend.

### P2 — Kualitas dan UX

- [ ] Tambahkan tipe props Inertia pada layout dan komponen.
- [ ] Kurangi prop global yang tidak diperlukan.
- [ ] Tambahkan pengukuran cakupan tes pada CI.

### P3 — Pengembangan fitur

- [ ] Ekspor CSV/Excel untuk akun dan transaksi.
- [ ] Pencarian lintas entitas.
- [ ] Jadwal transaksi berulang.
- [ ] Notifikasi pelampauan budget.
- [ ] Laporan perbandingan periode.
- [ ] Dukungan multi-mata uang.

---

## 6. Bukti Validasi

Jalankan perintah berikut setelah perubahan:

```text
php artisan config:clear
vendor/bin/pest --compact
vendor/bin/pint --dirty --format agent
vendor/bin/phpstan analyse
npm run build
```

Pengujian sebelumnya mencatat 89 tes lulus, 2 dilewati, dan tidak ada kegagalan. Hasil harus diperbarui setelah seluruh perubahan lokalisasi divalidasi.

---

## 7. Batasan Analisis

- Tidak ada sesi browser langsung; perilaku rendering React dan modal belum diverifikasi secara manual.
- Tidak ada laporan cakupan tes.
- Analisis performa dan audit keamanan OWASP belum dilakukan.
- Dokumentasi ini mencerminkan snapshot codebase pada tanggal yang tercantum.