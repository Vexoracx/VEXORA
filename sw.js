/* VEXORA service worker — cache kerangka aplikasi. /api/* tidak pernah di-cache. */
const VERSION = "vexora-3.2.5";
const SHELL = [
  "/", "/index.html", "/manifest.webmanifest",
  "/assets/style.css", "/assets/app.js", "/assets/i18n.js", "/assets/config.js",
  "/assets/fonts/vexora-bold.woff",
  "/assets/images/vexora-logo.svg", "/assets/images/vexora-icon.svg",
  "/assets/images/icon-192.png", "/assets/images/icon-512.png",
  "/assets/images/avatar.webp", "/assets/images/splash-bg.webp",
  "/assets/images/home-banner.webp", "/assets/images/input-header.webp",
  "/assets/images/download-footer.webp", "/assets/images/about-bg.webp",
  "/assets/images/result-thumb.webp",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u)))).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.endsWith(".mp4") || req.headers.has("range")) return;

  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/index.html")));
    return;
  }
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(req);
      const net = fetch(req).then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })
  );
});
