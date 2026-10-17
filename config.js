/* Konfigurasi runtime VEXORA.
 * apiBase: kosong = pakai domain yang sama (website di Vercel).
 * Untuk APK, file ini ditimpa otomatis oleh android-apk/scripts/prepare-web.js
 * dengan alamat Vercel kamu (variabel VEXORA_API_BASE). */
window.VEXORA = Object.assign({ name: "VEXORA", version: "3.0.0", apiBase: "" }, window.VEXORA || {});

/* Fallback Apify (dipakai saat /api/download gagal). Khusus pemakaian pribadi:
 * token ditaruh di frontend sesuai permintaan pemilik, jadi terlihat oleh siapa pun yang membuka source. */
window.VEXORA.apify = Object.assign({
  enabled: true,
  actor: "wilcode~all-social-media-video-downloader",
  tokens: [
    "REPLACE_WITH_YOUR_APIFY_TOKEN",
    "REPLACE_WITH_YOUR_APIFY_TOKEN"
  ],
  mergeAV: true,
  timeoutSec: 150,
  proxy: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"], apifyProxyCountry: "CA" }
}, window.VEXORA.apify || {});

/* Fallback RapidAPI (urutan: server utama -> RapidAPI -> Apify). Khusus pemakaian pribadi. */
window.VEXORA.rapid = Object.assign({
  enabled: true,
  key: "REPLACE_WITH_YOUR_RAPIDAPI_KEY",
  timeoutSec: 40
}, window.VEXORA.rapid || {});
