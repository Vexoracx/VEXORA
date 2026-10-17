/* Salin website VEXORA ke android-apk/www dan tulis config.js berisi alamat API (Vercel). */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..", "..");
const www = path.join(__dirname, "..", "www");

const api = String(process.env.VEXORA_API_BASE || "").trim().replace(/\/+$/, "");
if (!/^https:\/\/[^\s/]+/.test(api)) {
  console.error("\nVEXORA_API_BASE belum diisi / bukan https.\nContoh: VEXORA_API_BASE=https://vexora-kamu.vercel.app node scripts/prepare-web.js\n");
  process.exit(1);
}

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });
fs.copyFileSync(path.join(root, "index.html"), path.join(www, "index.html"));
fs.copyFileSync(path.join(root, "manifest.webmanifest"), path.join(www, "manifest.webmanifest"));
fs.cpSync(path.join(root, "assets"), path.join(www, "assets"), { recursive: true });
fs.rmSync(path.join(www, "assets", "brand"), { recursive: true, force: true }); // file 4K tidak dipakai app, hemat ukuran APK

/* Pertahankan isi config.js (fallback API dll.), hanya ganti baris pembuka agar apiBase terisi. */
const baseLine = `window.VEXORA = Object.assign({ name: "VEXORA", version: "3.0.0", apiBase: ${JSON.stringify(api)} }, window.VEXORA || {});`;
let cfg = fs.readFileSync(path.join(root, "assets", "config.js"), "utf8");
cfg = /^window\.VEXORA = Object\.assign\(\{ name:.*$/m.test(cfg)
  ? cfg.replace(/^window\.VEXORA = Object\.assign\(\{ name:.*$/m, () => baseLine)
  : baseLine + "\n" + cfg;
fs.writeFileSync(path.join(www, "assets", "config.js"), cfg);
console.log("www siap. API =", api);
