# Implementation Plan — Font Family yang Dapat Dipilih

> Superseded: IBM Plex Sans menggantikan Cera Round Pro sebagai font default karena asset Cera yang tersedia hanya berlisensi demo.

## Tujuan

Menjadikan **Cera Round Pro** sebagai font default Finance Tracker, lalu memberi pengguna pilihan font di **Settings → Tampilan**:

1. Cera Round Pro
2. Inter
3. Manrope

Pilihan harus berlaku untuk body dan heading, tersimpan antar reload/browser navigation, serta diterapkan sebelum halaman React dihydrate agar tidak terjadi flash font atau hydration mismatch.

## Prasyarat Wajib

Cera Round Pro adalah font komersial TypeMates. Repository belum memiliki file font atau lisensi web embedding untuknya.

Sebelum implementasi font default dapat diaktifkan, sediakan file webfont berlisensi:

```text
resources/fonts/cera-round-pro/
├── cera-round-pro-variable.woff2
└── LICENSE.txt
```

Jika lisensi menyediakan file statis alih-alih variable font, gunakan minimal regular, medium, dan semibold dalam format `.woff2`, dengan nama dan metadata berat sesuai lisensi.

Tidak akan memakai CDN tidak resmi, file dari instalasi desktop, atau hotlink pihak ketiga.

## Keputusan Arsitektur

### Satu preferensi per browser

Font disimpan sebagai preferensi tampilan browser, sama seperti light/dark/system saat ini:

```text
Cookie:       font_family
localStorage: font_family
Nilai valid:  cera-round, inter, manrope
Default:      cera-round
```

Tidak menambah kolom database atau pengaturan profil. Aplikasi saat ini single-user dan setting tampilan existing juga berbasis local storage/cookie.

### Cookie menjadi sumber awal canonical

Saat initial request SSR, server hanya dapat membaca cookie. Cookie `font_family` menjadi sumber awal untuk atribut root Blade:

```html
<html data-font-family="cera-round">
```

Client lalu menyelaraskan localStorage dan cookie pada bootstrap. Aturan precedence:

1. Cookie valid menang saat keduanya berbeda, karena itu nilai yang telah dipakai SSR.
2. Jika cookie tidak ada tetapi localStorage valid, gunakan localStorage dan tulis cookie.
3. Jika keduanya kosong atau invalid, gunakan `cera-round` dan tulis keduanya.

Aturan ini menghilangkan konflik saat ini pada theme appearance, ketika Blade membaca cookie tetapi React selalu mengutamakan localStorage.

### CSS variables, bukan inline style

Semua pemilihan font dilakukan melalui atribut `data-font-family` pada `<html>` dan CSS custom properties:

```css
html[data-font-family='cera-round'] {
  --font-app-sans: 'Cera Round Pro', ui-sans-serif, system-ui, sans-serif;
  --font-app-heading: 'Cera Round Pro', ui-sans-serif, system-ui, sans-serif;
}
```

Token Tailwind tetap stabil:

```css
@theme inline {
  --font-sans: var(--font-app-sans);
  --font-heading: var(--font-app-heading);
}
```

Dengan pendekatan ini, penggunaan existing `font-sans` dan `font-heading` berpindah bersama tanpa mengubah setiap komponen.

## Target Visual

Tambahkan bagian baru di bawah pilihan tema pada Settings → Tampilan:

```text
Pengaturan tampilan
Perbarui pengaturan tampilan untuk akun Anda

Tema
[ ☀ Terang ] [ ◐ Gelap ] [ ◉ Sistem ]

Font aplikasi
Pilih font untuk teks, angka, tabel, dan judul aplikasi.

┌─────────────────────────────────────────────────────────┐
│ ◉ Cera Round Pro                         Direkomendasikan│
│   Finance Tracker                         Aa Rp 1.607.500│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ○ Inter                                                   │
│   Bersih dan netral                       Aa Rp 1.607.500│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ○ Manrope                                                 │
│   Modern dan ramah                        Aa Rp 1.607.500│
└─────────────────────────────────────────────────────────┘
```

### Interaksi

- Seluruh card font merupakan satu radio group yang keyboard-accessible.
- Klik, Space, atau Enter langsung menerapkan font tanpa refresh.
- Pilihan aktif memiliki border/ring semantic dan indikator radio; warna bukan satu-satunya indikator.
- Preview memakai font yang diwakili card tersebut, bukan font global aktif.
- `Cera Round Pro` diberi badge `Direkomendasikan` karena menjadi identitas visual Finance Tracker.
- Tidak ada tombol Simpan; perubahan langsung tersimpan sebagai preferensi lokal, sama seperti tema.

## Perubahan per File

### 1. Asset font berlisensi

**Tambah:** `resources/fonts/cera-round-pro/*.woff2`

- Tambahkan file webfont Cera Round Pro yang lisensinya mengizinkan web embedding.
- Tambahkan `resources/fonts/cera-round-pro/LICENSE.txt` bila lisensi memperbolehkan distribusi teks lisensi bersama asset.
- Jangan mengubah asset jika file berlisensi belum tersedia; gunakan fallback system font sementara dan jangan menyatakan Cera aktif.

### 2. CSS dan token font

**Ubah:** `resources/css/app.css`

1. Tambahkan `@font-face` untuk asset Cera Round Pro dengan `font-display: swap`.
2. Pertahankan import existing `@fontsource-variable/inter` dan `@fontsource-variable/manrope`.
3. Hapus deklarasi `--font-sans` yang saling menimpa antara blok `@theme` dan `@theme inline`.
4. Tambahkan `--font-app-sans` dan `--font-app-heading` per selector:

```css
html[data-font-family='cera-round'] { ... }
html[data-font-family='inter'] { ... }
html[data-font-family='manrope'] { ... }
```

5. Map token Tailwind `--font-sans` dan `--font-heading` ke custom property tersebut.
6. Tetapkan fallback metric-compatible pada setiap stack untuk mengurangi layout shift saat Cera dimuat.

Catatan: komponen nominal dengan `font-mono` dan `tabular-nums` tetap tidak diubah. Pengaturan ini hanya mengubah sans dan heading.

### 3. Middleware dan cookie SSR

**Ubah:** `bootstrap/app.php`

Tambahkan `font_family` ke daftar cookie tanpa enkripsi:

```php
$middleware->encryptCookies(except: [
    'appearance',
    'font_family',
    'sidebar_state',
]);
```

**Ubah:** `app/Http/Middleware/HandleAppearance.php`

- Tambahkan allow-list `cera-round`, `inter`, `manrope`.
- Validasi cookie sebelum dibagikan ke Blade.
- Share `fontFamily` dengan fallback `cera-round`.
- Pertahankan behavior appearance existing; tidak mencampurkan enum font dan appearance.

**Ubah:** `resources/views/app.blade.php`

- Tambahkan atribut `data-font-family="{{ $fontFamily }}"` pada `<html>`.
- Inline script hanya tetap mengatur class dark. Tidak perlu mengubah font melalui JavaScript karena Blade sudah mengatur atribut sebelum CSS dan SSR React.

### 4. Hook preference font

**Ubah:** `resources/js/hooks/use-appearance.tsx`

Lebarkan module preference existing, tanpa membuat storage API kedua yang duplikatif:

- Tambahkan type:

```ts
export type FontFamily = 'cera-round' | 'inter' | 'manrope';
```

- Tambahkan allow-list dan parser runtime `isFontFamily()`.
- Tambahkan external store `currentFontFamily` beserta listener yang sama atau listener terpisah internal.
- Tambahkan `initializeAppearancePreferences()` menggantikan `initializeTheme()`:
  - menyelaraskan cookie/localStorage menurut aturan canonical di atas;
  - menerapkan theme dan `document.documentElement.dataset.fontFamily`;
  - aman pada SSR: seluruh `window`, `document`, dan `localStorage` berada di guard browser.
- Perluas return `useAppearance()` dengan:

```ts
fontFamily: FontFamily;
updateFontFamily: (fontFamily: FontFamily) => void;
```

- `updateFontFamily()` mengubah dataset root, localStorage, cookie, dan memberi notifikasi subscriber dalam event yang sama.

### 5. Bootstrap frontend

**Ubah:** `resources/js/app.tsx`

Ganti:

```ts
initializeTheme();
```

menjadi:

```ts
initializeAppearancePreferences();
```

Panggilan tetap dilakukan di bootstrap, bukan di render component, agar tidak memicu hydration mismatch atau render side effect.

### 6. Font picker

**Tambah:** `resources/js/components/font-family-selector.tsx`

- Gunakan `<fieldset>` dengan legend `Font aplikasi` dan radio input semantik.
- Definisikan katalog di satu module/component:

```ts
{
  value: 'cera-round',
  label: 'Cera Round Pro',
  description: 'Finance Tracker',
  recommended: true,
}
```

- Preview setiap option memiliki class font spesifik yang merujuk CSS selector, supaya user dapat membandingkan font sebelum memilih.
- Gunakan token semantic shadcn; jangan menambahkan warna hardcode.

**Ubah:** `resources/js/pages/settings/appearance.tsx`

- Render section Font aplikasi setelah `AppearanceTabs`.
- Gunakan heading/deskripsi konsisten dengan halaman Settings existing.

### 7. Vite font cleanup

**Ubah:** `vite.config.ts`

- Hapus `bunny('Instrument Sans', ...)` dan import `bunny` jika Instrument Sans tidak lagi berada di fallback/token aktif.
- Ini mencegah preload font yang tidak digunakan.
- Inter dan Manrope tetap dimuat dari Fontsource package.

## Pengujian

### Feature test baru

**Buat:** `tests/Feature/Settings/AppearanceTest.php`

1. Guest yang membuka `appearance.edit` diarahkan ke login.
2. User authenticated menerima page `settings/appearance`.
3. Cookie `font_family=inter` membuat root HTML memuat `data-font-family="inter"`.
4. Cookie `font_family=manrope` membuat root HTML memuat `data-font-family="manrope"`.
5. Cookie invalid fallback ke `data-font-family="cera-round"`.
6. Cookie `appearance=dark` masih menampilkan class dark; menjaga regresi behavior existing.

Feature tests menguji Blade root dan akses page, bukan detail implementasi hook React.

### Validasi teknis

```bash
php artisan test --compact tests/Feature/Settings/AppearanceTest.php
vendor/bin/pint --dirty --format agent
npm run types:check
npm run build
npm run build:ssr
git diff --check
```

Lalu:

```bash
php artisan test --compact
```

### Pemeriksaan manual

1. Pilih Cera Round Pro, Inter, dan Manrope; hard reload setelah masing-masing pilihan.
2. Uji light, dark, dan system untuk semua font.
3. Uji halaman dashboard, tabel transaksi, card budget, sidebar, dialog, drawer, dan modal transaksi.
4. Uji navigasi Inertia setelah mengubah font; pilihan tidak boleh reset.
5. Hapus localStorage dengan cookie valid; font tetap mengikuti cookie.
6. Hapus cookie dengan localStorage valid; client menerapkan nilai storage dan menulis cookie baru.
7. Uji cookie/storage invalid; fallback harus Cera Round Pro.
8. Dengan cache kosong/throttled network, pastikan text tetap terlihat, tidak ada font 404/CORS/MIME error, dan tidak ada hydration warning.
9. Periksa kolom nominal `font-mono tabular-nums`; alignment angka tidak berubah.

## Risiko dan Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Cera Round Pro tanpa lisensi web | Blocker. Jangan implementasi asset sampai file `.woff2` berlisensi tersedia. |
| Flash font/hydration mismatch | Cookie canonical, atribut root dari Blade, dan CSS selectors sebelum React bootstrap. |
| Cookie/localStorage lama tidak konsisten | Aturan sync eksplisit: cookie valid menang pada initial load. |
| Font asset besar | Preload hanya Cera default dan gunakan `font-display: swap`; jangan preload Inter/Manrope seluruh weight. |
| CSS font token saling menimpa | Konsolidasikan ke satu mapping `--font-app-*`. |
| Pengaturan memengaruhi angka finansial | Biarkan `font-mono` tetap tidak terpengaruh. |

## Cakupan Tidak Termasuk

- Penyimpanan pilihan font per user di database.
- Upload font dari UI.
- Font italic, kecuali lisensi/file disediakan dan benar-benar diperlukan.
- Menambahkan font eksternal lain di luar Cera Round Pro, Inter, dan Manrope.
- Mengubah ukuran, spacing, atau desain visual halaman lain untuk menyesuaikan metrik font.
