# VEXORA V3.0.0 — Build APK

Aplikasi Android membungkus website VEXORA (Capacitor 6). Tampilan jalan lokal di dalam APK, sedangkan proses link memanggil API di Vercel kamu.

**Syarat:** website sudah ter-deploy di Vercel (contoh `https://vexora-kamu.vercel.app`).

## Cara 1 — GitHub Actions (paling gampang, tanpa install apa pun)

1. Upload seluruh folder project ini (termasuk `.github/` dan `android-apk/`) ke repo GitHub.
2. Repo -> **Settings -> Secrets and variables -> Actions -> Variables** -> tambah `VEXORA_API_BASE` = alamat Vercel kamu (https, tanpa slash di akhir).
3. Tab **Actions -> Build VEXORA APK -> Run workflow**.
4. Setelah selesai, unduh artifact **VEXORA-v3.0.0-apk** -> `VEXORA-v3.0.0-debug.apk`. Bisa langsung dipasang di HP (izinkan "install dari sumber tidak dikenal").

APK rilis bertanda tangan sendiri (untuk Play Store/distribusi): tambahkan secrets `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`, maka file `VEXORA-v3.0.0-release.apk` ikut dibuat.

## Cara 2 — Manual (Android Studio / JDK 17 + Android SDK + Node 20)

```bash
cd android-apk
npm install
export VEXORA_API_BASE=https://vexora-kamu.vercel.app
node scripts/prepare-web.js
npx cap add android
node scripts/patch-android.js
npx capacitor-assets generate --android --iconBackgroundColor "#050506" --splashBackgroundColor "#050506"
npx cap sync android
cd android && ./gradlew assembleDebug
# hasil: android-apk/android/app/build/outputs/apk/debug/app-debug.apk
```

## Detail

- Nama: **VEXORA**, package `com.vexora.app`, versionName **3.0.0**, versionCode **300**.
- Unduhan memakai DownloadManager Android -> `Download/VEXORA` (notifikasi progres bawaan sistem).
- Kalau domain Vercel berubah, jalankan ulang build dengan `VEXORA_API_BASE` yang baru.
- Ikon & splash dibuat otomatis dari `resources/` (logo VEXORA di latar #050506).
