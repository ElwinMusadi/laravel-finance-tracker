# Implementation Plan — Urutan Akun yang Dapat Dipindahkan

## Tujuan

1. Halaman **Akun** menggunakan tampilan **tabel** sebagai default saat halaman pertama dibuka.
2. Pengguna dapat memindahkan posisi akun dari tabel melalui drag handle.
3. Urutan yang disimpan menjadi satu sumber kebenaran dan digunakan konsisten pada:
   - tabel dan tampilan kartu halaman Akun;
   - daftar akun global yang dipakai modal tambah/edit transaksi;
   - pilihan akun pada filter transaksi;
   - carousel saldo akun di halaman Transaksi.

## Keputusan Desain

### Urutan adalah atribut domain

Tambahkan `sort_order` sebagai integer pada `accounts`. Kolom ini menjadi urutan eksplisit akun, bukan turunan dari ID, nama, atau waktu dibuat.

- Nilai lebih kecil tampil lebih dahulu.
- Tiebreaker `id` hanya dipakai sebagai perlindungan untuk data lama/corrupt; UI dan data hasil reorder selalu menghasilkan urutan unik berurutan.
- Akun baru ditempatkan pada urutan terakhir.
- Akun aktif dan nonaktif berada dalam satu urutan global. Halaman Akun menampilkan keduanya; halaman Transaksi tetap menyaring akun aktif tetapi mempertahankan relative order yang sama.
- Mengaktifkan/nonaktifkan akun tidak menggeser urutan akun lain.
- Menghapus akun tidak perlu menormalkan segera; reorder berikutnya menulis ulang urutan berurutan untuk seluruh daftar yang tersisa.

Alasan: satu urutan global membuat perilaku lintas halaman mudah dipahami. Memisahkan urutan aktif/nonaktif akan membuat posisi akun berubah saat status diubah dan bertentangan dengan permintaan urutan yang konsisten.

### Default tampilan tabel

`viewMode` awal diganti dari `grid` ke `table`. Toggle Kartu/Tabel tetap tersedia, tetapi nilai tidak dipersist ke local storage agar setiap kunjungan halaman Akun dimulai dari tabel sesuai permintaan.

### Interaksi reorder

- Tambahkan kolom pertama tanpa judul, berisi tombol drag handle `IconGripVertical`.
- Reorder aktif hanya ketika tidak ada pencarian. Saat `search` berisi nilai, drag handle disabled dan tersedia teks bantuan: `Hapus pencarian untuk mengubah urutan akun.`
- Pembatasan ini mencegah pengiriman urutan parsial yang dapat memindahkan akun tersembunyi tanpa maksud pengguna.
- Gunakan `@dnd-kit/core`, `@dnd-kit/sortable`, dan `@dnd-kit/modifiers` yang sudah terpasang.
- Gunakan `PointerSensor`, `TouchSensor`, dan `KeyboardSensor` dengan `sortableKeyboardCoordinates`; button drag handle memberi `aria-label` dan instruksi screen-reader.
- `restrictToVerticalAxis` membatasi drag pada daftar tabel.
- Setelah drop valid, UI memakai `arrayMove` secara optimistis, lalu mengirim daftar ID lengkap ke backend dengan Inertia `router.put()` serta `preserveScroll: true`.
- Saat request gagal, Inertia mengembalikan prop server; tampilkan toast error bila request gagal selain validasi. Tidak ada reload manual terpisah.
- Ketika simpan sedang berjalan, drag handle serta toggle tampilan dinonaktifkan untuk mencegah request reorder bertumpuk.

## Target Visual

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Akun Keuangan                                            [ + Tambah Akun ] │
│ Kelola rekening bank, dompet digital, kartu kredit, dan kas tunai Anda.   │
├───────────────────────────────────────────────────────────────────────────┤
│ [ringkasan saldo] [akun aktif] [akun nonaktif]                             │
├───────────────────────────────────────────────────────────────────────────┤
│ [ Cari akun...                              ]               [Kartu][Tabel]│
│ Drag baris untuk mengatur urutan akun.                                     │
├───┬───────────────────────────┬───────────┬────────────┬──────────┬────────┤
│ ⠿ │ Nama akun                │ Tipe      │ Status     │ Saldo    │ Aksi   │
├───┼───────────────────────────┼───────────┼────────────┼──────────┼────────┤
│ ⠿ │ [logo] Bank Jago         │ Bank      │ Aktif      │ Rp ...   │ ✎  🗑  │
│ ⠿ │ [logo] GoPay             │ E-Wallet  │ Aktif      │ Rp ...   │ ✎  🗑  │
│ ⠿ │ [ikon]  Bank NTT         │ Bank      │ Nonaktif   │ Rp ...   │ ✎  🗑  │
└───┴───────────────────────────┴───────────┴────────────┴──────────┴────────┘
```

### Perilaku visual drag

- Drag handle selalu terlihat pada tabel normal dan memiliki target sentuh minimal 44 × 44 px.
- Baris yang sedang dipindah menggunakan opacity sedikit lebih rendah dan elevation halus; tidak memakai perubahan ukuran yang membuat tabel melompat.
- Baris lain bergerak dengan transition transform pendek.
- Pada layar kecil, tabel tetap dapat di-scroll horizontal sebagaimana perilaku table saat ini; drag hanya vertikal.
- Tampilan Kartu tidak menyediakan reorder. Urutan card mengikuti `sort_order` yang sudah tersimpan.

## Interface Backend

### Migration

**Buat:** `database/migrations/<timestamp>_add_sort_order_to_accounts_table.php`

1. Tambahkan `sort_order` unsigned integer nullable setelah `is_active`.
2. Backfill akun lama dalam urutan stabil `created_at ASC, id ASC`, bernilai `1..n`.
3. Ubah menjadi non-nullable dan tambahkan index biasa pada `sort_order`.
4. Down migration menghapus index dan kolom.

Catatan: tidak membuat unique constraint. Endpoint reorder menggunakan lock dan menulis seluruh urutan, sedangkan unique constraint dapat membuat update pertukaran posisi gagal pada intermediate state MySQL.

### Model

**Ubah:** `app/Models/Account.php`

- Tambahkan `sort_order` ke `$fillable` hanya bila diperlukan pada create internal; rekomendasi: **jangan** menambahkannya ke request form pengguna.
- Tambahkan scope `ordered()` dengan `orderBy('sort_order')->orderBy('id')`.
- Dokumentasikan method scope untuk static analysis.

Interface yang dipakai caller cukup:

```php
Account::query()->ordered()
Account::active()->ordered()
```

Ini menyembunyikan detail fallback `id` dan mencegah setiap caller menulis aturan urutan sendiri.

### Reorder request dan endpoint

**Buat:** `app/Http/Requests/ReorderAccountsRequest.php`

Payload:

```json
{ "account_ids": [12, 4, 9] }
```

Aturan validasi:

```php
'account_ids' => ['required', 'array', 'min:1'],
'account_ids.*' => ['required', 'integer', 'distinct', Rule::exists(Account::class, 'id')],
```

**Ubah:** `routes/web.php`

Tambahkan sebelum `Route::resource('accounts', ...)`:

```php
Route::put('accounts/reorder', [AccountController::class, 'reorder'])
    ->name('accounts.reorder');
```

**Ubah:** `app/Http/Controllers/AccountController.php`

Tambahkan `reorder(ReorderAccountsRequest $request): RedirectResponse`:

1. Jalankan seluruh operasi di `DB::transaction(..., attempts: 3)`.
2. Ambil seluruh ID akun aktual menggunakan `Account::query()->lockForUpdate()->ordered()->pluck('id')`.
3. Tolak request jika daftar ID tidak sama persis dengan daftar aktual, termasuk jumlah dan ID. Ini mencegah reorder parsial, stale client, ID duplikat, atau akun baru yang muncul saat pengguna sedang mengatur urutan.
4. Iterasi daftar tervalidasi dan update `sort_order` ke `1..n`.
5. Redirect ke `accounts.index` dengan flash success `Urutan akun diperbarui.`

Endpoint memakai satu payload penuh, bukan `{ moved_id, before_id }`, agar interface kecil dan hasil akhir eksplisit. Lock transaction menjaga operasi atomik. Konflik stale tidak menimpa akun yang baru dibuat/dihapus diam-diam; pengguna menerima error dan halaman kembali ke urutan server.

### Create dan ordering consumer

**Ubah:** `AccountController::store()`

- Saat membuat akun dalam transaction, set `sort_order` ke `max(sort_order) + 1` dengan lock yang sama untuk mencegah dua akun baru memperoleh posisi sama.

**Ubah seluruh consumer akun:**

| File | Perubahan |
| --- | --- |
| `app/Http/Controllers/AccountController.php` | `with('accountType')->ordered()` mengganti `orderBy('name')`. |
| `app/Http/Controllers/TransactionController.php` | `active()->with('accountType')->ordered()` mengganti `orderBy('name')`; carousel saldo, filter, dan prop modal mengikuti urutan ini. |
| `app/Http/Middleware/HandleInertiaRequests.php` | `active()->ordered()` mengganti `active()->orderBy('name')`; modal transaksi global mengikuti urutan ini pada semua halaman. |
| `app/Services/LedgerService.php` | `active()->ordered()` untuk determinisme kalkulasi total; hasil nominal tidak berubah. |

Tidak ada perubahan pada urutan transaksi, kategori, atau kontak.

### Wayfinder

Setelah route baru dibuat, jalankan:

```bash
php artisan wayfinder:generate --with-form --no-interaction
```

Frontend mengimpor fungsi bernama `reorder` dari `@/actions/App/Http/Controllers/AccountController` atau route named function yang dihasilkan; tidak memakai URL hardcoded.

## Frontend

### File utama

**Ubah:** `resources/js/pages/accounts/index.tsx`

1. Ganti default `useState<'grid' | 'table'>('grid')` menjadi `'table'`.
2. Tambahkan `sort_order: number` ke type `Account` agar kontrak prop eksplisit.
3. Pertahankan `accounts` dari prop sebagai sumber urutan server; buat state lokal `orderedAccounts` hanya untuk daftar tabel ketika tidak ada pencarian.
4. Sinkronkan state lokal saat prop `accounts` berubah, sehingga respons server setelah create, update, delete, atau reorder menjadi sumber kebenaran kembali.
5. `filteredAccounts` selalu memfilter dari state berurutan. Saat search kosong, hasil sama dengan urutan tersimpan; saat search aktif, tetap relative order yang sama.
6. Bungkus `TableBody` dengan `DndContext` dan `SortableContext`. Buat row khusus menggunakan `useSortable` yang menerapkan transform/transition dari dnd-kit.
7. Tambahkan kolom drag handle sebelum `Nama Akun`. Handle menggunakan button keyboard-accessible, bukan seluruh row agar tombol Ubah/Hapus tetap bekerja normal.
8. Pada `onDragEnd`, bila active dan over berbeda:
   - hitung indeks dari `orderedAccounts`;
   - susun `nextAccounts = arrayMove(...)`;
   - set state optimistis;
   - panggil `router.put(reorder.url(), { account_ids: nextAccounts.map(...) }, { preserveScroll: true, preserveState: true, onError, onFinish })`.
9. Bila request gagal, pulihkan state dari snapshot sebelum drag dan tampilkan pesan error melalui toast yang sudah dipakai aplikasi.
10. Tampilan grid tetap tersedia, tanpa drag handle, dan selalu memakai urutan `filteredAccounts`.

### Aksesibilitas

- Drag handle memiliki `aria-label="Pindahkan <nama akun>"` dan teks `sr-only` instruksi reorder.
- Keyboard sensor mendukung Space/Enter untuk mengambil/melepas baris dan ArrowUp/ArrowDown untuk memindahkan.
- `aria-pressed`/atribut dari `useSortable` diteruskan ke button.
- Drag disable selama search atau request simpan berjalan diterjemahkan ke `disabled` serta alasan visual/textual.
- Tidak memakai warna saja untuk menunjukkan status drag.

## Pengujian

### Feature tests — `tests/Feature/AccountControllerTest.php`

1. **Backfill / default order:** setelah migration, akun lama mendapat urutan stabil; akun yang dibuat baru berada terakhir.
2. **Reorder valid:** request lengkap `[akunC, akunA, akunB]` menghasilkan `sort_order` `1, 2, 3` dan redirect success.
3. **Reorder invalid:** daftar dengan ID tak dikenal, duplikat, atau ID yang tidak lengkap ditolak; seluruh `sort_order` tidak berubah.
4. **Akun page order:** `GET /accounts` mengirim `accounts` sesuai `sort_order`, bukan nama/ID.
5. **Transaction page order:** `GET /transactions` mengirim akun aktif sesuai `sort_order`; akun nonaktif tetap tidak muncul.
6. **Shared account order:** Inertia shared prop `accounts` mengikuti urutan yang sama untuk modal transaksi global.

### Manual UI validation

- Halaman Akun pertama kali terbuka pada tabel.
- Pointer, touch, dan keyboard dapat memindahkan akun dalam tabel.
- Reorder langsung terlihat dan tetap benar setelah refresh halaman.
- Cari akun lalu pastikan drag disabled; bersihkan pencarian lalu drag aktif kembali.
- Ubah urutan dan buka modal transaksi dari halaman mana pun; pilihan akun mengikuti urutan baru.
- Buka halaman Transaksi; carousel saldo dan filter akun mengikuti urutan baru, sambil akun nonaktif tidak muncul.
- Grid mengikuti urutan tetapi tidak menyediakan reorder.
- Uji mobile 375 px dan desktop: drag tetap vertikal dan tabel tidak membuat body overflow.

## Validasi Teknis

```bash
php artisan migrate --no-interaction
php artisan wayfinder:generate --with-form --no-interaction
php artisan test --compact tests/Feature/AccountControllerTest.php tests/Feature/TransactionControllerTest.php
vendor/bin/pint --dirty --format agent
npm run types:check
npm run build
git diff --check
```

Setelah tes terkait lulus, jalankan suite penuh:

```bash
php artisan test --compact
```

## Cakupan Tidak Termasuk

- Drag-and-drop pada mode card.
- Menyimpan pilihan mode Kartu/Tabel per pengguna/browser.
- Urutan berbeda per pengguna; aplikasi saat ini single-user.
- Urutan kategori, kontak, atau transaksi.
- Optimasi ulang algoritme saldo `LedgerService`.
- Mengubah aturan akun aktif/nonaktif selain mempertahankan urutan relative-nya.
