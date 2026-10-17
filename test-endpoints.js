#!/usr/bin/env node
/**
 * Tes endpoint VEXORA setelah deploy.
 *   node scripts/test-endpoints.js https://domainmu.vercel.app [scripts/test-urls.json]
 *
 * 1) Isi scripts/test-urls.json dengan SATU link publik contoh per platform (kosong = dilewati).
 * 2) Jalankan. Hasilnya: OK/GAGAL per platform + scraper mana yang dipakai.
 * 3) Opsional: set env VEXORA_ADMIN_KEY (sama dengan di Vercel) untuk mode diagnosa,
 *    yang menguji SEMUA scraper tiap platform, bukan cuma yang pertama berhasil.
 * Butuh Node 18+.
 */
const fs = require("fs");
const path = require("path");

const base = (process.argv[2] || "").replace(/\/+$/, "");
const file = process.argv[3] || path.join(__dirname, "test-urls.json");
const adminKey = process.env.VEXORA_ADMIN_KEY || "";
if (!/^https?:\/\//.test(base)) {
  console.error("Pakai: node scripts/test-endpoints.js https://domainmu.vercel.app [urls.json]");
  process.exit(1);
}
const urls = JSON.parse(fs.readFileSync(file, "utf8"));
const pad = (s, n) => String(s).padEnd(n).slice(0, n);

async function j(url, opt) {
  const r = await fetch(url, opt);
  let body = null;
  try { body = await r.json(); } catch { /* bukan JSON */ }
  return { status: r.status, body, headers: r.headers };
}

(async () => {
  console.log("== Server:", base);
  const h = await j(base + "/api/health");
  if (h.status !== 200 || !h.body) { console.log("GAGAL /api/health ->", h.status); process.exit(2); }
  console.log("OK  /api/health  versi", h.body.version, "|", h.body.platforms.length, "platform | diagnosa:", h.body.fallback.diagnoseEnabled ? "aktif" : "nonaktif");

  const pf = await fetch(base + "/api/download", { method: "OPTIONS", headers: { Origin: "https://localhost", "Access-Control-Request-Method": "POST" } });
  console.log(pf.status === 204 && pf.headers.get("access-control-allow-origin") ? "OK " : "GAGAL", " CORS preflight ->", pf.status, pf.headers.get("access-control-allow-origin"));

  console.log("\n" + pad("PLATFORM", 12) + pad("HASIL", 8) + pad("VIA", 20) + pad("WAKTU", 8) + "KETERANGAN");
  let ok = 0, fail = 0, skip = 0;
  for (const p of h.body.platforms) {
    const link = (urls[p.key] || "").trim();
    if (!link) { skip++; console.log(pad(p.label, 12) + pad("-", 8) + pad("(link belum diisi)", 20)); continue; }
    const t0 = Date.now();
    try {
      const r = await j(base + "/api/download", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: link, format: "mp4" }) });
      const ms = ((Date.now() - t0) / 1000).toFixed(1) + "s";
      if (r.body && r.body.ok) {
        ok++;
        console.log(pad(p.label, 12) + pad("OK", 8) + pad(r.body.via, 20) + pad(ms, 8) + r.body.downloads.length + " file | " + (r.body.title || "").slice(0, 40));
      } else {
        fail++;
        const tried = (r.body && r.body.tried || []).map((t) => t.name + ": " + t.error).join(" ; ");
        console.log(pad(p.label, 12) + pad("GAGAL", 8) + pad("-", 20) + pad(ms, 8) + (r.body && r.body.error || r.status) + (tried ? " [" + tried + "]" : ""));
      }
      if (adminKey) {
        const d = await j(base + "/api/health?url=" + encodeURIComponent(link) + "&key=" + encodeURIComponent(adminKey));
        if (d.body && d.body.scrapers) d.body.scrapers.forEach((s) => console.log("     - " + pad(s.name, 18) + pad(s.ok ? "hidup" : "mati", 6) + pad(s.ms + "ms", 8) + (s.error || "")));
      }
    } catch (e) {
      fail++;
      console.log(pad(p.label, 12) + pad("ERROR", 8) + String(e.message || e));
    }
  }
  console.log(`\nRingkas: ${ok} OK, ${fail} gagal, ${skip} dilewati`);
  process.exit(fail ? 3 : 0);
})();
