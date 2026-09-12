# Implementation Plan — Card Saldo Akun pada Halaman Transaksi

## Tujuan

Menampilkan saldo terkini setiap akun yang dapat digunakan untuk transaksi pada halaman **Transaksi**, tepat setelah header halaman dan sebelum card filter. Informasi ini membantu pengguna memilih akun tanpa harus berpindah ke halaman Akun.

## Keputusan Produk

- Menampilkan **akun aktif saja**, karena hanya akun aktif yang tersedia pada form dan filter transaksi.
- Setiap akun mendapat satu card informasional; card tidak menjadi tombol atau shortcut filter agar tidak menciptakan perilaku tersembunyi.
- Saldo berasal dari `LedgerService`, sehingga pemasukan, pengeluaran, transfer, utang, piutang, dan saldo awal mengikuti aturan ledger yang sama dengan halaman Akun dan Dasbor.
- Saldo tidak mengikuti filter transaksi. Angka selalu menunjukkan saldo akun saat ini, bukan saldo dari bulan atau hasil pencarian yang dipilih.
- Tidak menampilkan timestamp semu. Data diperbarui melalui respons Inertia setiap halaman dimuat ulang atau setelah transaksi berhasil disimpan, diubah, maupun dihapus.

## Target Visual

### Hierarki halaman

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Riwayat Transaksi                               [ + Tambah Transaksi ]   │
│ Kelola mutasi arus kas, pembelanjaan, transfer saldo, dan pelunasan.     │
└──────────────────────────────────────────────────────────────────────────┘

Saldo akun
Saldo terkini untuk akun yang dapat digunakan bertransaksi

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐
│ ◉ Bank Jago     │ │ ◉ GoPay         │ │ ◉ Bank NTT      │ │ ◉ Tunai      │
│   Kantong Utama │ │   E-Wallet      │ │   Bank          │ │   Kas        │
│ Rp 8.450.000    │ │ Rp 725.000      │ │ Rp 2.150.000    │ │ Rp 350.000   │ ╎
└─────────────────┘ └─────────────────┘ └─────────────────┘ └──────────────┘ ╎ →
<──────────── satu baris; scroll horizontal; scrollbar disembunyikan ───────>

┌──────────────────────────────────────────────────────────────────────────┐
│ Card filter transaksi                                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Perilaku horizontal di semua ukuran layar

- Seluruh card akun **selalu berada dalam satu baris** dan tidak pernah membungkus ke baris berikutnya.
- Container menggunakan horizontal scroll dengan scrollbar visual disembunyikan.
- Scroll tetap dapat dilakukan dengan swipe pada layar sentuh, trackpad, roda mouse horizontal, serta tombol panah saat container mendapat fokus.
- Gunakan scroll snap ringan agar card berhenti pada posisi yang rapi tanpa terasa mengunci gerakan pengguna.
- Bagian card berikutnya dibuat sedikit terlihat pada mobile dan tablet sebagai petunjuk bahwa daftar dapat digeser.
- Tambahkan gradient/fade tipis di tepi kanan hanya ketika masih ada konten lanjutan. Hilangkan fade saat posisi scroll mencapai ujung agar card terakhir tidak tertutup.

### Desktop (`xl`)

- Empat card terlihat penuh dalam viewport section.
- Akun kelima dan seterusnya berada di sebelah kanan dan dapat dilihat dengan horizontal scroll.
- Setiap card memakai lebar tetap setara seperempat area yang tersedia dan `shrink-0`.

```text
[ Akun 1 ] [ Akun 2 ] [ Akun 3 ] [ Akun 4 ]  ╎ [ Akun 5 ] ...
<──────────────────── horizontal scroll; scrollbar hidden ────────────────>
```

### Tablet (`sm` sampai `lg`)

- Dua sampai tiga card terlihat, bergantung lebar viewport.
- Semua akun tetap satu baris; card berikutnya sedikit terlihat di sisi kanan.

```text
[ Akun 1 ] [ Akun 2 ] [ sebagian Akun 3 ] ...
<──────── horizontal scroll; scrollbar hidden ────────>
```

### Mobile

- Satu card tampil dominan dengan sebagian card berikutnya terlihat sebagai scroll affordance.
- Card menggunakan lebar sekitar 80–85% viewport section agar nama dan nominal tidak terpotong.
- Swipe horizontal tidak menyebabkan seluruh halaman melebar atau scroll horizontal pada body.

```text
[       Akun 1       ] [ sebagian Akun 2 ] ...
<──── swipe horizontal; scrollbar hidden ────>
```

### Detail card

- Card memakai bentuk compact dengan aksen garis warna primary brand di sisi kiri.
- Header card berupa logo brand di kiri, lalu nama akun dan tipe akun dalam satu blok di kanan.
- Asset logo brand bersumber dari ZonaLogo dan disimpan lokal di `public/images/account-brands`, sehingga card tidak bergantung pada hotlink eksternal.
- Pencocokan nama menerima suffix akun, sehingga `Bank Jago` dan `Bank Jago 2` memakai identitas brand yang sama.
- Logo tampil tanpa background tambahan agar aset brand tetap transparan; fallback memakai ikon dompet dengan background primary aplikasi.
- Jika logo tidak tersedia atau gagal dimuat, gunakan ikon dompet dan aksen primary aplikasi sebagai fallback.
- Resolver logo dipakai konsisten pada card saldo Transaksi serta tampilan grid dan tabel halaman Akun.
- Nama akun menjadi informasi utama; tipe akun tepat di bawahnya dengan ukuran lebih kecil dan fallback `Umum`.
- Saldo berada pada baris tersendiri tepat di bawah header tanpa label tambahan agar tinggi card tetap ringkas.
- Nominal menggunakan format `id-ID`, angka tabular, dan tanpa angka desimal.
- Saldo negatif memakai `text-destructive` dan tanda minus; makna tidak bergantung pada warna saja.
- Card non-interaktif: tanpa cursor pointer, ring pilihan, atau hover yang mengisyaratkan aksi.
- Warna memakai token semantik shadcn agar tetap terbaca pada light dan dark mode.

### Empty state

Jika tidak ada akun aktif, tampilkan satu card sederhana:

```text
┌──────────────────────────────────────────────────────────┐
│ Belum ada akun aktif                                     │
│ Aktifkan atau tambahkan akun agar saldo dapat ditampilkan.│
└──────────────────────────────────────────────────────────┘
```

Tidak menambahkan tombol baru pada empty state karena aksi tambah akun berada di halaman Akun dan bukan bagian dari permintaan ini.

## Implementation Plan

### 1. Siapkan data saldo pada backend

**File:** `app/Http/Controllers/TransactionController.php`

- Inject `LedgerService` melalui constructor, mengikuti pola `AccountController` dan `DashboardController`.
- Ambil akun aktif dengan relasi `accountType`, urut berdasarkan nama.
- Tambahkan atribut runtime `balance` dari `LedgerService::getAccountBalance()` pada setiap akun.
- Gunakan collection yang sama untuk prop `accounts`; tidak membuat prop kedua yang menduplikasi akun untuk filter dan card.

Bentuk prop yang ditargetkan:

```ts
type Account = {
    id: number;
    name: string;
    balance: string;
    account_type?: { name: string } | null;
};
```

### 2. Tambahkan section card saldo

**File:** `resources/js/pages/transactions/index.tsx`

- Perluas tipe `Account` dengan `balance` dan `account_type`.
- Tambahkan section `Saldo akun` setelah header halaman dan sebelum card filter.
- Gunakan komposisi shadcn `Card`, `CardHeader`, `CardDescription`, `CardTitle`, dan `CardContent` yang sudah tersedia.
- Gunakan container horizontal satu baris, bukan grid:

```text
flex flex-nowrap gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory
```

- Sembunyikan scrollbar lintas browser melalui utility proyek `no-scrollbar`; bila utility tersebut belum tersedia secara global, tambahkan definisinya di `resources/css/app.css` untuk Firefox, Chromium, dan Safari.
- Setiap card menggunakan `shrink-0 snap-start` dengan lebar responsif yang mempertahankan satu baris:

```text
w-[82%] sm:w-[calc(50%_-_0.375rem)] lg:w-[calc(33.333%_-_0.5rem)] xl:w-[calc(25%_-_0.5625rem)]
```

- Berikan `tabIndex={0}`, `aria-label="Daftar saldo akun, geser horizontal untuk melihat akun lain"`, dan focus ring pada container agar pengguna keyboard dapat melakukan horizontal scroll.
- Tambahkan `overscroll-x-contain` untuk mencegah gesture horizontal menggeser halaman induk.
- Pakai formatter mata uang yang sudah ada pada halaman.
- Tambahkan state kosong bila `accounts.length === 0`.
- Jangan mengubah perilaku filter, modal transaksi, tabel, atau pagination.

### 3. Tambahkan pengujian regresi backend

**File:** `tests/Feature/TransactionControllerTest.php`

Tambahkan coverage untuk kontrak prop yang baru:

1. Akun aktif dikirim dengan saldo yang dihitung dari transaksi pemasukan/pengeluaran.
2. Transfer mengurangi akun sumber dan menambah akun tujuan pada saldo card.
3. Akun tanpa transaksi menghasilkan saldo `0.00`.
4. Akun nonaktif tidak masuk ke daftar card/filter transaksi.

Pengujian frontend baru tidak ditambahkan karena repository belum memiliki test runner komponen React. Struktur visual diverifikasi melalui type-check, build, dan pemeriksaan manual responsif.

### 4. Validasi

Jalankan:

```bash
php artisan test --compact tests/Feature/TransactionControllerTest.php
vendor/bin/pint --dirty --format agent
npm run types:check
npm run build
git diff --check
```

Pemeriksaan manual target:

- Desktop: empat card terlihat penuh; akun berikutnya dapat dicapai dengan horizontal scroll tanpa wrap.
- Tablet: dua sampai tiga card terlihat dan seluruh daftar tetap satu baris.
- Mobile 375 px: satu card dominan dan sebagian card berikutnya terlihat sebagai petunjuk swipe.
- Scrollbar tersembunyi di Firefox, Chromium, dan Safari, tetapi gesture, trackpad, roda horizontal, dan keyboard tetap berfungsi.
- Horizontal overflow terisolasi di section saldo; body halaman tidak ikut melebar.
- Scroll snap berhenti pada awal card dan tidak menghalangi pengguna melewati beberapa card.
- Light/dark mode: nominal, metadata, dan petunjuk fade tetap terbaca.
- Saldo negatif: tanda minus terlihat dan warna destructive diterapkan.
- Setelah tambah/edit/hapus transaksi: respons Inertia menampilkan saldo terbaru.
- Filter bulan/akun/kategori tidak mengubah nilai saldo saat ini.

## Trade-off dan Risiko

### Query saldo

`LedgerService::getAccountBalance()` saat ini menjalankan satu query transaksi per akun dan menghitung efek transaksi di PHP. Dengan empat akun aktif pada data saat ini, penggunaan pola yang sudah ada ini cukup untuk perubahan terfokus dan menjaga satu sumber aturan saldo.

Risikonya meningkat bila jumlah akun atau transaksi besar. Optimasi batch/aggregate SQL sebaiknya menjadi refactor terpisah karena mengubah implementasi inti ledger dan membutuhkan coverage lintas pemasukan, pengeluaran, transfer, utang, piutang, serta saldo awal. Perubahan fitur ini tidak akan memperkenalkan cache agar saldo tidak menjadi stale setelah transaksi.

### Cakupan

Tidak termasuk:

- Redesign card filter atau tabel transaksi.
- Card yang dapat diklik untuk memfilter akun.
- Akun nonaktif.
- Grafik atau riwayat perubahan saldo.
- Perubahan aturan perhitungan `LedgerService`.
- Migrasi/index database baru.

## Kriteria Selesai

- Semua akun aktif tampil sebagai card sebelum filter transaksi.
- Setiap card menampilkan nama, tipe, dan saldo terkini yang benar.
- Data saldo konsisten dengan `LedgerService` dan halaman Akun.
- Semua card tetap satu baris, dapat di-scroll horizontal, dan scrollbar visual tersembunyi tanpa menghilangkan akses keyboard maupun touch.
- Empty state dan saldo negatif ditangani.
- Tes terfokus, Pint, TypeScript, dan build lulus.
