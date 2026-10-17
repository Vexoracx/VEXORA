/**
 * GET /api/health
 *   -> status server, versi, daftar platform + urutan scraper, env fallback aktif atau tidak.
 *
 * GET /api/health?url=<link>&key=<VEXORA_ADMIN_KEY>      (atau header X-Admin-Key)
 *   -> DIAGNOSA: menjalankan SEMUA scraper milik platform link itu secara paralel
 *      dan melaporkan mana yang hidup/mati beserta waktunya.
 *      Hanya aktif kalau env VEXORA_ADMIN_KEY diisi (supaya tidak disalahgunakan).
 */
const { PLATFORMS, detectPlatform } = require("./_lib/platforms");
const { applyCors } = require("./_lib/cors");
const VERSION = require("../package.json").version;

const PER_SCRAPER_MS = 25_000;
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 2000) hits.clear();
  return arr.length > 6;
}

function withTimeout(p, ms, label) {
  let t;
  const to = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(label + ": timeout")), ms); });
  return Promise.race([p, to]).finally(() => clearTimeout(t));
}

function send(res, code, body) {
  res.status(code).setHeader("Content-Type", "application/json; charset=utf-8");
  res.send(JSON.stringify(body, null, 2));
}

module.exports = async function handler(req, res) {
  applyCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return send(res, 405, { ok: false, error: "Gunakan GET." });

  const q = req.query || {};
  const rawUrl = String(q.url || "").trim();

  if (!rawUrl) {
    return send(res, 200, {
      ok: true,
      name: "VEXORA",
      version: VERSION,
      node: process.version,
      time: new Date().toISOString(),
      fallback: {
        universalDownloader: !!(process.env.VEXORA_UNIVERSAL_DOWNLOADER_URL || process.env.AVX_UNIVERSAL_DOWNLOADER_URL),
        ytdlp: !!(process.env.VEXORA_YTDLP_API_URL || process.env.AVX_YTDLP_API_URL),
        diagnoseEnabled: !!process.env.VEXORA_ADMIN_KEY,
      },
      platforms: Object.entries(PLATFORMS).map(([key, p]) => ({
        key, label: p.label, scrapers: p.chain.map((c) => c[0]),
      })),
    });
  }

  const adminKey = String(process.env.VEXORA_ADMIN_KEY || "");
  if (!adminKey) return send(res, 403, { ok: false, error: "Diagnosa nonaktif. Isi env VEXORA_ADMIN_KEY di Vercel lalu deploy ulang." });
  const given = String(req.headers["x-admin-key"] || q.key || "");
  if (given !== adminKey) return send(res, 401, { ok: false, error: "Key salah." });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return send(res, 429, { ok: false, error: "Terlalu sering. Tunggu sebentar." });

  const found = detectPlatform(rawUrl);
  if (!found) return send(res, 400, { ok: false, error: "Platform tidak dikenali dari link ini." });

  const format = String(q.format || "mp4").toLowerCase() === "mp3" ? "mp3" : "mp4";
  const results = await Promise.all(found.platform.chain.map(async ([name, load, argsFn]) => {
    const t0 = Date.now();
    try {
      const scrape = load();
      const extra = argsFn ? argsFn({ format }) : [];
      const out = await withTimeout(scrape(found.url, ...extra), PER_SCRAPER_MS, name);
      const r = out && out.result;
      const n = r && Array.isArray(r.downloads) ? r.downloads.length : (r && r.url ? 1 : 0);
      if (out && out.status && n > 0) return { name, ok: true, ms: Date.now() - t0, files: n };
      return { name, ok: false, ms: Date.now() - t0, error: String((out && out.message) || "tidak ada link unduhan").slice(0, 160) };
    } catch (e) {
      return { name, ok: false, ms: Date.now() - t0, error: String(e && e.message ? e.message : e).slice(0, 160) };
    }
  }));

  send(res, 200, {
    ok: results.some((r) => r.ok),
    platform: { key: found.key, label: found.platform.label },
    working: results.filter((r) => r.ok).map((r) => r.name),
    scrapers: results,
  });
};
