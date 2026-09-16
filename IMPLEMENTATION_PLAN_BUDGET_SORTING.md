# Implementation Plan — Pengurutan Realisasi Budget

## Tujuan

Menambahkan kontrol pengurutan pada halaman **Budget** agar kategori pengeluaran dapat dilihat berdasarkan tingkat pemakaian budget pada bulan yang dipilih:

1. **Nama kategori** — A–Z, sebagai default yang kompatibel dengan perilaku saat ini.
2. **Realisasi tertinggi** — kategori paling penuh, hampir penuh, atau melampaui limit muncul pertama.
3. **Realisasi terendah** — kategori dengan pemakaian paling rendah, termasuk `0%`, muncul pertama.

Pengurutan memakai **persentase realisasi** (`actual_amount / budget_limit`), bukan nominal Rupiah. Ini memastikan kategori dengan budget yang hampir/penuh tampil di posisi relevan meskipun nominalnya lebih kecil dari kategori lain.

## Definisi Bisnis

| Kondisi kategori | `realization_percentage` | Perlakuan pengurutan |
| --- | ---: | --- |
| Limit > 0, realisasi Rp0 | `0` | Pertama pada Realisasi terendah. |
| Limit > 0, realisasi < limit | `0–99+` | Diurutkan berdasarkan persentase aktual. |
| Limit > 0, realisasi = limit | `100` | Posisi tinggi pada Realisasi tertinggi. |
| Limit > 0, realisasi > limit | `>100` | Paling atas pada Realisasi tertinggi. |
| Limit `null` | `null` | Tidak terukur; selalu ditempatkan setelah budget berlimit. |
| Limit `0.00` | `null` | Tidak dibagi nol; ditempatkan setelah budget berlimit. |

Tie-breaker yang deterministik:

1. Kategori dengan budget terukur (`budget_limit > 0`) selalu mendahului kategori tanpa limit/limit nol.
2. Persentase realisasi sesuai arah sort.
3. Nama kategori A–Z.
4. ID kategori naik sebagai fallback terakhir.

Progress bar tetap dibatasi sampai `100%` untuk tampilan, tetapi **nilai asli** di atas `100%` dipakai untuk pengurutan. Dengan demikian budget `150%` selalu berada di atas budget `100%` pada Realisasi tertinggi.

## Target Visual

Kontrol ditempatkan di kanan selector bulan pada header Budget.

```text
Kontrol Anggaran
Pantau dan kendalikan pengeluaran bulanan agar tidak melebihi batas.

[ 📅 September 2026 ]  [ Urutkan: Realisasi tertinggi ▾ ]

┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│ Tagihan Listrik    │  │ Belanja Harian      │  │ Pulsa              │
│ Budget Rp200.000   │  │ Budget Rp500.000    │  │ Budget Rp100.000   │
│ Realisasi Rp250.000│  │ Realisasi Rp300.000 │  │ Realisasi Rp0      │
│ Over 125%          │  │ Waspada 60%         │  │ 0%                 │
└────────────────────┘  └────────────────────┘  └────────────────────┘
```

Pilihan Select:

```text
Urutkan budget
- Nama kategori
- Realisasi tertinggi
- Realisasi terendah
```

- Kontrol memakai shadcn `Select`, bukan tombol custom.
- Label tetap terlihat sehingga makna pilihan tidak hanya bergantung pada icon.
- Pada mobile, selector bulan dan pengurutan tetap berada dalam baris yang dapat membungkus tanpa overflow.
- Ketika pengguna mengganti bulan atau urutan, daftar dan URL diperbarui melalui Inertia tanpa reload penuh.

## Interface URL dan Props

Gunakan query string yang dapat dibagikan dan aman untuk browser back/forward:

```text
/budgets?month=2026-09&sort=name_asc
/budgets?month=2026-09&sort=realization_desc
/budgets?month=2026-09&sort=realization_asc
```

Nilai valid:

```php
name_asc
realization_desc
realization_asc
```

Kontrak prop target:

```ts
type BudgetItem = {
  category: Category;
  budget_amount: string;
  actual_amount: string;
  realization_percentage: number | null;
};

type BudgetFilters = {
  month: string;
  sort: 'name_asc' | 'realization_desc' | 'realization_asc';
};
```

`null` menandakan persentase tidak dapat dihitung karena limit kosong atau nol. Frontend tidak menghitung ulang formula untuk kebutuhan sorting.

## Perubahan Backend

### 1. Validasi filter index

**File:** `app/Http/Controllers/BudgetController.php`

Pada `index()`:

- Validasi query `month` dengan `date_format:Y-m`.
- Validasi query `sort` menggunakan allow-list eksplisit.
- Default:
  - `month`: bulan saat ini dalam timezone aplikasi `Asia/Makassar`.
  - `sort`: `name_asc`.
- Gunakan hasil tervalidasi untuk membangun rentang bulan dan prop `filters`.

Tidak menggunakan nilai `sort` langsung pada `orderBy()` atau `orderByRaw()`.

### 2. Aggregate realisasi secara bulk

**File:** `app/Services/LedgerService.php`

Tambahkan module method yang menerima daftar kategori expense dan rentang periode, misalnya:

```php
getExpenseActualsByCategory(Collection $categories, CarbonInterface $start, CarbonInterface $end): Collection
```

Implementasi menjalankan satu aggregate:

```sql
SELECT category_id, SUM(amount) AS actual_amount
FROM transactions
WHERE category_id IN (...)
  AND transaction_date BETWEEN ? AND ?
GROUP BY category_id
```

Hasil dipetakan berdasarkan `category_id`. Kategori tanpa transaksi memperoleh `0.00`.

Ini menggantikan pola sekarang di mana `BudgetController` memanggil `LedgerService::getExpenseActual()` satu kali per kategori. Query budget target menjadi:

1. Query kategori expense.
2. Query aggregate transaksi berdasarkan kategori.

### 3. Bentuk dan urutkan data budget

**File:** `app/Http/Controllers/BudgetController.php`

Alur baru:

1. Ambil semua kategori `CategoryType::Expense`.
2. Dapatkan actual amount per kategori dari aggregate bulk `LedgerService`.
3. Bentuk `budgetData` dengan `budget_amount`, `actual_amount`, dan `realization_percentage`.
4. Urutkan collection berdasarkan filter tervalidasi dan tie-breaker yang ditetapkan.
5. Kirim `budgetData`, `currentMonth`, dan `filters` ke `budgets/index`.

Tidak menambah tabel Budget atau mengubah model domain. Budget tetap disimpan pada `categories.budget_limit`.

### 4. Perbaikan batas aksi budget

**File:** `app/Http/Controllers/BudgetController.php`

Saat menyentuh controller, samakan proteksi `destroy()` dengan `update()`:

- Pastikan route-bound category bertipe `expense` sebelum menghapus `budget_limit`.
- Ini mencegah endpoint budget mengubah kategori income/transfer bila ID diketahui.

Perubahan ini bersifat koreksi otorisasi domain yang berdekatan, bukan scope UI tambahan.

## Perubahan Frontend

**File:** `resources/js/pages/budgets/index.tsx`

1. Tambahkan type `BudgetFilters` dan `realization_percentage` pada item.
2. Terima prop `filters` dari backend.
3. Tambahkan state `sort` yang diinisialisasi dari `filters.sort`.
4. Tambahkan `Select` di samping input month dengan tiga pilihan urutan.
5. Buat satu function `applyFilters(nextMonth, nextSort)`:

```ts
router.get(
  budgetsIndex.url(),
  { month: nextMonth, sort: nextSort },
  {
    preserveState: true,
    preserveScroll: true,
    replace: true,
  },
)
```

6. Gunakan Wayfinder named route `index` dari `@/routes/budgets`; hapus URL hardcoded `"/budgets"`.
7. Sinkronkan state month/sort dengan props filter menggunakan `useEffect`, agar browser back/forward dan Inertia navigation menampilkan pilihan yang benar.
8. Hapus kebutuhan sort client-side. `budgetData` dirender sesuai urutan backend.
9. Gunakan `realization_percentage` dari prop untuk badge, teks persentase, status warning/over, dan progress bar. Progress visual tetap `Math.min(percentage, 100)`.
10. Untuk kategori `realization_percentage: null`, tetap tampilkan badge `Bebas` dan informasi batas budget seperti pola existing.

## Pengujian

**File:** `tests/Feature/BudgetControllerTest.php`

Tambahkan kasus berikut:

1. **Realisasi tertinggi**
   - Kategori 150%, 100%, 40%, dan 0%.
   - `sort=realization_desc` menampilkan urutan 150%, 100%, 40%, 0%.

2. **Realisasi terendah**
   - Data sama.
   - `sort=realization_asc` menampilkan 0%, 40%, 100%, 150%.

3. **Tie-breaker**
   - Dua kategori memiliki persentase sama, termasuk 0%.
   - Verifikasi nama kategori A–Z dipakai setelah persentase.

4. **Kategori tanpa limit dan limit nol**
   - `budget_limit = null` dan `budget_limit = 0` menghasilkan `realization_percentage = null`.
   - Keduanya ditempatkan setelah kategori yang memiliki budget positif pada kedua mode realisasi.

5. **Aggregate actual**
   - Banyak transaksi untuk banyak kategori.
   - Verifikasi total per kategori dan fallback `0.00` saat tidak ada transaksi.

6. **Validasi filter**
   - `month` valid dan sort valid diterima.
   - `month` invalid menghasilkan error `month`.
   - `sort` invalid menghasilkan error `sort`.
   - Tanpa query menghasilkan filter `name_asc` dan bulan berjalan.

7. **Batas kategori expense**
   - Upaya menghapus budget menggunakan kategori non-expense menghasilkan 404.

8. **Regresi timezone**
   - Pertahankan tes transaksi pada jam awal bulan lokal agar expense tersebut tetap masuk realisasi bulan yang benar.

Tidak perlu test frontend baru karena project belum memiliki test runner komponen React. Perilaku frontend diverifikasi melalui TypeScript, build, dan pemeriksaan manual.

## Validasi

```bash
php artisan test --compact tests/Feature/BudgetControllerTest.php
vendor/bin/pint --dirty --format agent
npm run types:check
npm run build
git diff --check
```

Setelah tes terfokus lulus:

```bash
php artisan test --compact
```

Pemeriksaan manual:

- Ganti sort tanpa mengganti month; URL selalu menyimpan kedua filter.
- Ganti month tanpa mengganti sort; sort pilihan tetap dipertahankan.
- Refresh, back, dan forward browser mengembalikan filter dan urutan benar.
- Kategori 0% muncul pertama pada Realisasi terendah.
- Kategori over budget muncul pertama pada Realisasi tertinggi.
- Kategori tanpa budget tetap tampil tetapi tidak disamakan dengan 0%.
- Light/dark mode dan viewport mobile tidak menyebabkan overflow pada filter header.
