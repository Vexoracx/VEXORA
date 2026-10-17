/* Dijalankan SETELAH `npx cap add android`: versi 3.0.0, izin, plugin downloader native. */
const fs = require("fs");
const path = require("path");
const android = path.join(__dirname, "..", "android");
if (!fs.existsSync(android)) { console.error("Folder android belum ada. Jalankan `npx cap add android` dulu."); process.exit(1); }

/* 1) versi: V.3.0.0 -> versionName 3.0.0, versionCode 300 */
const gradle = path.join(android, "app", "build.gradle");
let g = fs.readFileSync(gradle, "utf8");
g = g.replace(/versionCode\s+\d+/, "versionCode 300").replace(/versionName\s+"[^"]*"/, 'versionName "3.0.0"');
fs.writeFileSync(gradle, g);

/* 2) manifest: izin tulis untuk Android 9 ke bawah (DownloadManager ke folder Download) */
const manifest = path.join(android, "app", "src", "main", "AndroidManifest.xml");
let m = fs.readFileSync(manifest, "utf8");
if (!m.includes("WRITE_EXTERNAL_STORAGE")) {
  m = m.replace(
    /(<uses-permission android:name="android.permission.INTERNET"\s*\/>)/,
    '$1\n    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />'
  );
}
fs.writeFileSync(manifest, m);

/* 3) plugin native + MainActivity */
const javaDir = path.join(android, "app", "src", "main", "java", "com", "vexora", "app");
fs.mkdirSync(javaDir, { recursive: true });
for (const f of ["VexoraDownloaderPlugin.java", "MainActivity.java"]) {
  fs.copyFileSync(path.join(__dirname, "..", "native", f), path.join(javaDir, f));
}

/* 4) ikon & splash untuk @capacitor/assets */
console.log("Patch Android selesai (versionName 3.0.0, versionCode 300).");
