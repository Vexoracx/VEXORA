/**
 * POST /api/download   { "url": "...", "format": "mp4" | "mp3" }
 * GET  /api/download?url=...&format=mp3
 *
 * Mendeteksi platform dari hostname, lalu menjalankan fallback chain scrapr
 * sampai ada yang berhasil. Hasil dinormalisasi ke satu bentuk JSON.
 */
const { PLATFORMS, detectPlatform } = require("./_lib/platforms");
const { applyCors } = require("./_lib/cors");

const TOTAL_BUDGET_MS = 54_000; // sisakan margin dari maxDuration 60 dtk
const PER_ATTEMPT_MS = 28_000;
const RATE_LIMIT = 12; // request / menit / IP (best effort, per instance)
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > RATE_LIMIT;
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, rej) => {
    timer = setTimeout(() => rej(new Error(`${label}: timeout`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const isHttp = (s) => typeof s === "string" && /^https?:\/\//i.test(s.trim());

function guessType(item) {
  const t = String(item.type || "").toLowerCase();
  if (["video", "audio", "image"].includes(t)) return t;
  const u = String(item.url || "").split("?")[0].toLowerCase();
  if (/\.(mp4|webm|mov|m4v|mkv)$/.test(u)) return "video";
  if (/\.(mp3|m4a|aac|wav|ogg|flac|opus)$/.test(u)) return "audio";
  if (/\.(jpe?g|png|webp|gif|avif|heic)$/.test(u)) return "image";
  return t || "file";
}

function extOf(url) {
  const m = String(url).split("?")[0].match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : "";
}

function normalize(result) {
  const r = result || {};
  let raw = Array.isArray(r.downloads) ? r.downloads : [];
  if (!raw.length && isHttp(r.url)) raw = [{ url: r.url, type: r.type }];

  const seen = new Set();
  const downloads = [];
  for (const it of raw) {
    const item = typeof it === "string" ? { url: it } : it || {};
    if (!isHttp(item.url) || seen.has(item.url)) continue;
    seen.add(item.url);
    downloads.push({
      url: item.url.trim(),
      type: guessType(item),
      quality: item.quality != null ? String(item.quality) : "",
      label: String(item.title || item.name || item.label || "").slice(0, 120),
      size: item.size != null ? String(item.size) : "",
      ext: extOf(item.url),
    });
    if (downloads.length >= 40) break;
  }

  const author =
    r.author && typeof r.author === "object"
      ? String(r.author.name || r.author.nickname || r.author.username || "")
      : String(r.author || "");

  return {
    title: String(r.title || "Tanpa judul").trim().slice(0, 200),
    thumbnail: isHttp(r.thumbnail) ? r.thumbnail.trim() : "",
    type: String(r.type || (downloads[0] && downloads[0].type) || "media"),
    author: author.slice(0, 80),
    downloads,
  };
}

function send(res, code, body) {
  res.status(code).setHeader("Content-Type", "application/json; charset=utf-8");
  res.send(JSON.stringify(body));
}

// API fallback opsional: arahkan ke instance universalDownloader yang Anda host
// sendiri melalui AVX_UNIVERSAL_DOWNLOADER_URL. Tidak mengubah alur scraper lama.
const UNIVERSAL_ROUTES = {
  bluesky: "bluesky", capcut: "capcut", dailymotion: "dailymotion",
  douyin: "douyin", kuaishou: "kuaishou", linkedin: "linkedin",
  facebook: "meta", instagram: "meta", pinterest: "pinterest",
  reddit: "reddit", snapchat: "snapchat", soundcloud: "soundcloud",
  spotify: "spotify", terabox: "terabox", threads: "threads",
  tiktok: "tiktok", tumblr: "tumblr", twitter: "twitter", youtube: "youtube",
  x: "twitter",
};

async function tryApiFallback(key, url, format, tried, started) {
  const axios = require("axios");
  const base = String(process.env.VEXORA_UNIVERSAL_DOWNLOADER_URL || process.env.AVX_UNIVERSAL_DOWNLOADER_URL || "").trim().replace(/\/$/, "");
  const route = UNIVERSAL_ROUTES[key];
  if (base && route && Date.now() - started < TOTAL_BUDGET_MS - 3000) {
    try {
      const response = await withTimeout(axios.get(`${base}/api/${route}/download`, {
        params: { url, format }, timeout: 18000, maxRedirects: 3,
      }), Math.min(18000, TOTAL_BUDGET_MS - (Date.now() - started) - 1000), "universal-api");
      const payload = response && response.data;
      const data = normalize(payload && (payload.result || payload.data || payload));
      if (data.downloads.length) return { via: "universal-api", data };
      tried.push({ name: "universal-api", error: "respons API tidak berisi link unduhan" });
    } catch (e) {
      tried.push({ name: "universal-api", error: String(e && e.message ? e.message : e).slice(0, 120) });
    }
  }

  // Fallback yt-dlp self-hosted (FastAPI): AVX_YTDLP_API_URL, contoh https://host/download
  const ytdlp = String(process.env.VEXORA_YTDLP_API_URL || process.env.AVX_YTDLP_API_URL || "").trim();
  if (ytdlp && Date.now() - started < TOTAL_BUDGET_MS - 2000) {
    try {
      const response = await withTimeout(axios.get(ytdlp, {
        params: { url, format: format === "mp3" ? "bestaudio/best" : "best[height<=1080]" },
        responseType: "arraybuffer", timeout: 18000, maxRedirects: 3,
      }), Math.min(18000, TOTAL_BUDGET_MS - (Date.now() - started) - 500), "ytdlp-api");
      const type = String(response.headers["content-type"] || "").toLowerCase();
      if (response.status >= 200 && response.status < 300 && response.data && response.data.byteLength && !type.includes("json")) {
        // API yt-dlp mengembalikan file stream, bukan URL publik. Tidak ada perubahan
        // pada format respons VEXORA; catat fallback agar kegagalannya terlihat jelas.
        tried.push({ name: "ytdlp-api", error: "API mengembalikan stream file; endpoint VEXORA memerlukan URL unduhan" });
      } else {
        tried.push({ name: "ytdlp-api", error: "respons API tidak menyediakan URL unduhan yang kompatibel" });
      }
    } catch (e) {
      tried.push({ name: "ytdlp-api", error: String(e && e.message ? e.message : e).slice(0, 120) });
    }
  }
  return null;
}

module.exports = async function handler(req, res) {
  applyCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!["GET", "POST"].includes(req.method)) {
    return send(res, 405, { ok: false, code: "method", error: "Method not allowed." });
  }

  const ip =
    String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  if (rateLimited(ip)) {
    return send(res, 429, { ok: false, code: "rate", error: "Too many requests. Please try again shortly." });
  }

  const input = req.method === "POST" ? req.body || {} : req.query || {};
  let body = input;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const rawUrl = String(body.url || "").trim();
  const format = String(body.format || "mp4").toLowerCase() === "mp3" ? "mp3" : "mp4";

  if (!rawUrl || rawUrl.length > 2048) {
    return send(res, 400, { ok: false, code: "badurl", error: "Paste a valid link first." });
  }

  const found = detectPlatform(rawUrl);
  if (!found) {
    return send(res, 400, {
      ok: false,
      code: "unsupported",
      error: "Platform not supported yet or the link is invalid.",
      supported: Object.values(PLATFORMS).map((p) => p.label),
    });
  }

  const { key, url, platform } = found;
  const started = Date.now();
  const tried = [];

  for (const [name, load, argsFn] of platform.chain) {
    const remaining = TOTAL_BUDGET_MS - (Date.now() - started);
    if (remaining < 4000) break;

    try {
      const scrape = load();
      const extra = argsFn ? argsFn({ format }) : [];
      const out = await withTimeout(
        scrape(url, ...extra),
        Math.min(PER_ATTEMPT_MS, remaining),
        name
      );

      if (out && out.status && out.result) {
        const data = normalize(out.result);
        if (data.downloads.length) {
          return send(res, 200, {
            ok: true,
            platform: { key, label: platform.label },
            via: name,
            tried: [...tried.map((t) => t.name), name],
            ...data,
          });
        }
        tried.push({ name, error: "tidak ada link unduhan" });
      } else {
        tried.push({ name, error: String((out && out.message) || "gagal").slice(0, 120) });
      }
    } catch (e) {
      tried.push({ name, error: String(e && e.message ? e.message : e).slice(0, 120) });
    }
  }

  const apiFallback = await tryApiFallback(key, url, format, tried, started);
  if (apiFallback) {
    return send(res, 200, {
      ok: true,
      platform: { key, label: platform.label },
      via: apiFallback.via,
      tried: [...tried.map((t) => t.name), apiFallback.via],
      ...apiFallback.data,
    });
  }

  return send(res, 502, {
    ok: false,
    platform: { key, label: platform.label },
    code: "allfailed",
    error:
      "All scrapers for this platform failed. Make sure the link is public, or try again in a moment.",
    tried,
  });
};
