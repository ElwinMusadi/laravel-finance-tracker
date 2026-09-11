# Status Proyek

> **Tanggal snapshot:** 11 September 2026
> **Cakupan:** Analisis statis codebase, modernisasi UI/UX, dan pengujian otomatis.

---

## Ringkasan Eksekutif

Laravel Finance Tracker adalah aplikasi keuangan pribadi yang dibangun dengan Laravel 13, Inertia.js v3, dan React 19. Aplikasi menggunakan arsitektur berbasis kategori (_category-driven_) untuk pencatatan transaksi (Pemasukan, Pengeluaran, Transfer, Utang, dan Piutang), batas budget terintegrasi pada kategori pengeluaran, akun dengan label bebas, serta relasi kontak untuk pencatatan utang-piutang.

Seluruh antarmuka (UI/UX) telah dimodernisasi mengikuti standar aplikasi finansial modern:

- Sistem umpan balik notifikasi instan (Sonner flash toast).
- Konfirmasi aksi destruktif seragam (`ConfirmDialog`).
- Dasbor interaktif dengan grafik perbandingan arus kas riil 6 bulan terakhir (Recharts) dan kartu KPI modern.
- Halaman riwayat transaksi dengan pencarian deskripsi, filter multi-kriteria, badge nominal terwarnai, dan paginasi.
- Halaman akun dengan tampilan ganda (kartu dompet visual dan tabel) serta ringkasan total saldo aset.
- Halaman budget dengan visualisasi _progress bar_ dan indikator status kesehatan anggaran.
- Navigasi sidebar bersih tanpa tautan placeholder dan menggunakan SPA navigation (`<Link>`).

---

## 1. Stack dan Versi Utama

| Lapisan           | Paket / Alat                                     | Versi            |
| ----------------- | ------------------------------------------------ | ---------------- |
| Runtime           | PHP                                              | 8.3              |
| Framework         | `laravel/framework`                              | 13.29.0          |
| Autentikasi       | `laravel/fortify`                                | 1.39.0           |
| Jembatan SPA      | `inertiajs/inertia-laravel` / `@inertiajs/react` | 3.3.1 / ^3.0.0   |
| UI                | React + TypeScript                               | ^19.2.0 / ^5.7.2 |
| Styling           | Tailwind CSS v4 + shadcn/ui                      | ^4.0.0           |
| Grafik            | Recharts                                         | 3.8.0            |
| Notifikasi Toast  | Sonner                                           | ^2.0.0           |
| Analisis statis   | Larastan (PHPStan level 7)                       | 3.10.0           |
| Gaya kode         | Laravel Pint                                     | 1.30.5           |
| Pengujian         | Pest                                             | 4.7.8            |
| Tipe rute         | Laravel Wayfinder                                | 0.1.21           |
| DB produksi / tes | MySQL / SQLite in-memory                         | —                |

---

## 2. Arsitektur dan Model Data

### Struktur backend

```text
app/
├── Enums/              CategoryType, TransactionAction
├── Http/Controllers/   AccountController, BudgetController, CategoryController,
│                       ContactController, DashboardController, TransactionController
├── Http/Requests/      Store*/Update* untuk model domain
├── Models/             Account, AccountType, Category, Contact, Transaction, User
└── Services/
    └── LedgerService   Kalkulasi saldo akun, kekayaan bersih, agregasi arus kas
```

### Model domain

| Model         | Kolom penting                                                                                                                    | Catatan                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `Account`     | `name`, `account_type_id`, `is_active`                                                                                           | Terhubung ke `AccountType` sebagai label bebas                                 |
| `AccountType` | `name`                                                                                                                           | Label bebas tipe akun (Bank, Dompet Digital, Kas)                              |
| `Category`    | `name`, `type`, `budget_limit`, `is_active`                                                                                      | Tipe: `income`, `expense`, `debt`, `receivable`, `transfer`, `opening_balance` |
| `Contact`     | `name`, `is_active`                                                                                                              | Relasi untuk transaksi utang dan piutang                                       |
| `Transaction` | `transaction_date`, `amount`, `description`, `category_id`, `account_id`, `transfer_account_id`, `contact_id`, `action`, `notes` | Transaksi berbasis kategori                                                    |
| `User`        | `name`, `username`, password, 2FA, passkeys                                                                                     | Login username unik; tidak menyimpan email; single-user                        |

### Struktur frontend

```text
resources/js/
├── pages/       dasbor, akun, kategori, kontak, transaksi, budget, settings, auth
├── components/  modal transaksi global, confirm dialog, form modals, chart arus kas, sidebar
├── hooks/       use-transaction-modal, use-flash-toast, use-appearance, use-mobile
├── layouts/     app-sidebar-layout dengan useFlashToast & TransactionFormModal
├── actions/     binding controller Wayfinder
└── routes/      binding named-route Wayfinder
```

---

## 3. Status Fitur

| Fitur          | Status  | Detail                                                                                                             |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| Autentikasi    | Selesai | Login berbasis username dan password, profil, ubah password, 2FA, dan passkey. Reset password serta verifikasi email dihapus. |
| Dasbor         | Selesai | KPI cards finansial, grafik arus kas 6 bulan riil (Recharts), transaksi terbaru, dan akses cepat.                  |
| Transaksi      | Selesai | CRUD, pencarian deskripsi, filter bulan/akun/kategori, paginasi, indikator warna nominal, dan modal konfirmasi.    |
| Akun           | Selesai | CRUD, ringkasan saldo total, tampilan kartu dompet/tabel, status aktif/nonaktif, saldo awal, dan konfirmasi hapus. |
| Budget         | Selesai | Rekap pemakaian anggaran bulanan, kartu progress bar interaktif dengan indikator kesehatan (Aman, Waspada, Over).  |
| Kategori       | Selesai | CRUD via modal responsif, badge tipe kategori berwarna, filter tipe, dan batas budget belanja.                     |
| Kontak         | Selesai | CRUD via modal, kartu ringkasan relasi, pencarian kontak, proteksi penghapusan dengan modal konfirmasi.            |
| Umpan Balik UX | Selesai | Integrasi session flash Laravel dengan Sonner toast di root layout (`useFlashToast`).                              |
| Navigasi       | Selesai | Sidebar bersih dari tautan placeholder, menggunakan SPA `<Link>` tanpa reload, avatar inisial dinamis.             |

---

## 4. Kesenjangan & Roadmap Selanjutnya

### P0 — Multi-Tenancy (Bila diperlukan lebih dari satu pengguna)

- [ ] Tambahkan kolom `user_id` pada model `Account`, `Category`, `Contact`, `Transaction`.
- [ ] Tambahkan query scopes dan policy otorisasi per pengguna.

### P1 — Fitur Tambahan & Pelaporan

- [ ] Ekspor data transaksi dan saldo ke format CSV / Excel.
- [ ] Laporan perbandingan anggaran antar periode.
- [ ] Fitur transaksi berulang (_recurring transactions_).

---

## 5. Operasional Autentikasi

- Login hanya menerima `username` dan `password`; data serta kredensial email telah dihapus.
- Akun admin seed memakai `ADMIN_USERNAME` dengan nilai default `admin`; password tetap memakai `ADMIN_PASSWORD` dengan nilai default `password`.
- Reset password dan verifikasi email dihapus karena alur tersebut memerlukan alamat email.

---

## 6. Bukti Validasi

Jalankan perintah berikut untuk validasi:

```bash
php artisan config:clear
vendor/bin/pest --compact
vendor/bin/pint --dirty --format agent
npm run types:check
npm run build
```
