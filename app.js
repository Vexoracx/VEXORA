(() => {
  "use strict";

  /* ================= data ================= */
  const PLATFORMS = [
    { key: "tiktok", label: "TikTok", slug: "tiktok", hosts: ["tiktok.com"], sub: "Video, Audio, Live", ex: "www.tiktok.com" },
    { key: "youtube", label: "YouTube", slug: "youtube", hosts: ["youtube.com", "youtu.be"], sub: "Video, Audio, Shorts", ex: "www.youtube.com" },
    { key: "instagram", label: "Instagram", slug: "instagram", hosts: ["instagram.com", "instagr.am"], sub: "Reels, Post, Story", ex: "www.instagram.com" },
    { key: "facebook", label: "Facebook", slug: "facebook", hosts: ["facebook.com", "fb.watch", "fb.com"], sub: "Video, Reels, Post", ex: "www.facebook.com" },
    { key: "twitter", label: "X (Twitter)", slug: "x", hosts: ["twitter.com", "x.com", "t.co"], sub: "Video, GIF, Post", ex: "x.com" },
    { key: "threads", label: "Threads", slug: "threads", hosts: ["threads.net", "threads.com"], sub: "Video, Post", ex: "www.threads.net" },
    { key: "pinterest", label: "Pinterest", slug: "pinterest", hosts: ["pinterest.com", "pin.it"], sub: "Video, Image", ex: "www.pinterest.com" },
    { key: "spotify", label: "Spotify", slug: "spotify", hosts: ["open.spotify.com", "spotify.link"], sub: "Audio, Podcast", ex: "open.spotify.com" },
    { key: "soundcloud", label: "SoundCloud", slug: "soundcloud", hosts: ["soundcloud.com"], sub: "Audio, Track", ex: "soundcloud.com" },
    { key: "applemusic", label: "Apple Music", slug: "applemusic", hosts: ["music.apple.com"], sub: "Audio, Track", ex: "music.apple.com" },
    { key: "bandcamp", label: "Bandcamp", slug: "bandcamp", hosts: ["bandcamp.com"], sub: "Audio, Album", ex: "bandcamp.com" },
    { key: "bilibili", label: "Bilibili", slug: "bilibili", hosts: ["bilibili.com", "b23.tv", "bilibili.tv"], sub: "Video", ex: "www.bilibili.com" },
    { key: "douyin", label: "Douyin", mono: "抖", hosts: ["douyin.com", "iesdouyin.com"], sub: "Video", ex: "www.douyin.com" },
    { key: "rednote", label: "RedNote", slug: "xiaohongshu", hosts: ["xiaohongshu.com", "xhslink.com", "rednote.com"], sub: "Video, Image", ex: "www.xiaohongshu.com" },
    { key: "reddit", label: "Reddit", slug: "reddit", hosts: ["reddit.com", "redd.it"], sub: "Video, Image", ex: "www.reddit.com" },
    { key: "terabox", label: "Terabox", mono: "TB", hosts: ["terabox.com", "teraboxapp.com", "1024terabox.com", "terabox.app", "4funbox.com"], sub: "File, Video", ex: "www.terabox.com" },
    { key: "pixiv", label: "Pixiv", slug: "pixiv", hosts: ["pixiv.net"], sub: "Image, Art", ex: "www.pixiv.net" },
  ];
  const BY_KEY = Object.fromEntries(PLATFORMS.map((p) => [p.key, p]));
  const HOME_KEYS = ["tiktok", "youtube", "instagram", "facebook", "twitter", "threads", "pinterest", "spotify", "soundcloud", "applemusic", "bandcamp"];
  const t = (k, v) => window.VX.t(k, v);
  const TYPE_LABEL = { get video() { return t("type.video"); }, get audio() { return t("type.audio"); }, get image() { return t("type.image"); }, get file() { return t("type.file"); } };
  const MIME_EXT = { "video/mp4": "mp4", "video/webm": "webm", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/aac": "aac", "audio/ogg": "ogg", "audio/wav": "wav", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

  /* ================= konfigurasi & platform native (APK) ================= */
  const CFG = window.VEXORA || {};
  const API_BASE = String(CFG.apiBase || "").replace(/\/+$/, "");
  const isNative = () => { try { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); } catch { return false; } };
  let dlPlugin;
  function nativeDL() {
    if (!isNative()) return null;
    if (dlPlugin === undefined) { try { dlPlugin = window.Capacitor.registerPlugin("VexoraDownloader"); } catch { dlPlugin = null; } }
    return dlPlugin;
  }

  /* ================= helpers ================= */
  const $ = (id) => document.getElementById(id);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const SVG_NS = "http://www.w3.org/2000/svg";
  function icon(name, cls) {
    const s = document.createElementNS(SVG_NS, "svg");
    s.setAttribute("aria-hidden", "true");
    if (cls) s.setAttribute("class", cls);
    const u = document.createElementNS(SVG_NS, "use");
    u.setAttribute("href", "#i-" + name);
    s.appendChild(u);
    return s;
  }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage diblokir */ } },
  };
  const K_HIST = "vexora.history.v2", K_SAVED = "vexora.saved.v1", K_PROF = "vexora.profile.v1", K_SET = "vexora.settings.v1";

  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), Math.max(2300, String(msg).length * 55));
  }

  function fmtBytes(n) {
    if (!isFinite(n) || n <= 0) return "0 B";
    const u = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return (i === 0 ? Math.round(n) : n.toFixed(n >= 100 ? 0 : 1).replace(".", window.VX.meta().dec)) + " " + u[i];
  }
  function fmtClock(sec) {
    if (!isFinite(sec) || sec < 0) return "--:--";
    sec = Math.round(sec);
    return String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
  }
  function fmtDate(ts) {
    try { return new Date(ts).toLocaleString(window.VX.meta().loc, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
  }
  function detect(raw) {
    let u;
    try { u = new URL(String(raw).trim()); } catch { return null; }
    if (!/^https?:$/.test(u.protocol)) return null;
    const host = u.hostname.toLowerCase();
    return PLATFORMS.find((p) => p.hosts.some((h) => host === h || host.endsWith("." + h))) || null;
  }
  function platformIcon(p, cls) {
    const wrap = el("div", cls);
    if (p && p.slug) {
      const img = new Image();
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.src = "https://cdn.simpleicons.org/" + p.slug + "/ffffff";
      img.onerror = () => { img.remove(); wrap.appendChild(el("span", "", p.label.charAt(0))); };
      wrap.appendChild(img);
    } else {
      wrap.appendChild(el("span", "", (p && (p.mono || p.label.charAt(0))) || "?"));
    }
    return wrap;
  }
  function typeIcon(t) { return ["video", "audio", "image"].includes(t) ? t : "file"; }
  function thumbEl(url, type) {
    const th = el("div", "thumb");
    const fallback = () => { th.replaceChildren(icon(typeIcon(type))); };
    if (url) {
      const img = new Image();
      img.alt = "";
      img.referrerPolicy = "no-referrer";
      img.decoding = "async";
      img.onerror = () => fallback();
      img.src = url;
      th.appendChild(img);
    } else fallback();
    return th;
  }
  function copyText(text) {
    const done = () => toast(t("t.copied"));
    const fallback = () => {
      const ta = el("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch { toast(t("t.copyfail")); }
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }
  async function pasteInto(input, after) {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) throw new Error("no-clipboard");
      const clip = await navigator.clipboard.readText();
      if (!clip) return toast(t("t.clipempty"));
      input.value = clip.trim();
      after();
      input.focus();
    } catch {
      toast(t("t.clipdenied"));
      input.focus();
      try { input.select(); } catch { /* abaikan */ }
    }
  }

  /* ================= settings & profile ================= */
  const settings = Object.assign({ theme: "dark", ytFormat: "mp4", notify: false, lang: window.VX.lang() }, store.get(K_SET, {}));
  const saveSettings = () => store.set(K_SET, settings);
  const profile = Object.assign({ name: "UserVex", avatar: null }, store.get(K_PROF, {}));
  const saveProfile = () => store.set(K_PROF, profile);
  let format = settings.ytFormat === "mp3" ? "mp3" : "mp4";

  function applyTheme(mode) {
    settings.theme = mode === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = settings.theme;
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", settings.theme === "light" ? "#e2e4e9" : "#191a1d");
    const sw = $("themeSw");
    sw.setAttribute("aria-checked", String(settings.theme === "dark"));
    $("themeVal").textContent = settings.theme === "dark" ? t("theme.dark") : t("theme.light");
  }

  /* ================= layers (overlay / modal) ================= */
  const layers = [];
  function pushLayer(l) { layers.push(l); document.body.classList.add("lock"); }
  function dropLayer(l) {
    const i = layers.indexOf(l);
    if (i > -1) layers.splice(i, 1);
    if (!layers.length) document.body.classList.remove("lock");
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && layers.length) layers[layers.length - 1].cancel();
  });

  function dialog(o) {
    const modal = el("div", "modal");
    const panel = el("div", "panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    if (o.title) { panel.setAttribute("aria-label", o.title); panel.appendChild(el("h3", "", o.title)); }
    if (o.text) panel.appendChild(el("p", "p-txt", o.text));
    const body = el("div", "p-body");
    [].concat(o.body || []).forEach((n) => body.appendChild(n));
    if (o.menu) {
      const ml = el("div", "m-list");
      o.menu.forEach((m) => {
        const b = el("button");
        b.type = "button";
        if (m.icon) b.appendChild(icon(m.icon));
        b.appendChild(document.createTextNode(m.label));
        b.addEventListener("click", () => { close(); if (m.fn) m.fn(); });
        ml.appendChild(b);
      });
      body.appendChild(ml);
    }
    if (body.childNodes.length) panel.appendChild(body);
    if (o.actions) {
      const acts = el("div", "p-acts");
      o.actions.forEach((a) => {
        const b = el("button", "btn " + (a.cls || "btn-soft"), a.text);
        b.type = "button";
        b.addEventListener("click", () => { if (!a.fn || a.fn() !== false) close(); });
        acts.appendChild(b);
      });
      panel.appendChild(acts);
    }
    modal.appendChild(panel);
    const layer = { cancel: () => close() };
    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      dropLayer(layer);
      modal.classList.remove("visible");
      setTimeout(() => modal.remove(), 200);
      if (o.onClose) o.onClose();
    }
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    document.body.appendChild(modal);
    pushLayer(layer);
    requestAnimationFrame(() => modal.classList.add("visible"));
    return { close, panel };
  }
  function confirmDialog(title, text, okText, fn) {
    dialog({ title, text, actions: [{ text: t("btn.cancel") }, { text: okText, cls: "btn-primary", fn }] });
  }

  /* ================= navigation ================= */
  const TABS = ["home", "history", "saved", "profile"];
  const ctx = { platform: null, result: null, last: null, filter: "all" };
  let current = "home", depth = 0;

  const enter = {
    history: () => renderHistory(),
    saved: () => renderSaved(),
    profile: () => renderProfile(),
    success: () => renderSuccess(),
  };
  function show(name) {
    $$("#okBody video, #okBody audio").forEach((m) => m.pause());
    $$(".screen").forEach((s) => s.classList.toggle("is-active", s.dataset.screen === name));
    current = name;
    document.body.dataset.screen = name;
    $("nav").hidden = !TABS.includes(name);
    $$(".nav-item").forEach((n) => {
      const on = n.dataset.target === name;
      n.classList.toggle("is-active", on);
      n.setAttribute("aria-current", on ? "page" : "false");
    });
    window.scrollTo(0, 0);
    if (enter[name]) enter[name]();
  }
  function go(name) {
    if (name === current) return;
    depth++;
    history.pushState({ s: name, d: depth }, "");
    show(name);
  }
  function back() {
    if (depth > 0) history.back(); else show("home");
  }
  function guard(s) {
    if (s === "result" && !ctx.result) return "home";
    if (s === "success" && !ctx.last) return "home";
    if (s === "input" && !ctx.platform) return "platforms";
    return s;
  }
  window.addEventListener("popstate", (e) => {
    if (layers.length) {
      const top = layers[layers.length - 1];
      history.pushState({ s: current, d: depth }, "");
      top.cancel();
      return;
    }
    const st = e.state || { s: "home", d: 0 };
    depth = st.d || 0;
    show(guard(st.s));
  });
  history.replaceState({ s: "home", d: 0 }, "");

  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-go]");
    if (g) return go(g.dataset.go);
    if (e.target.closest("[data-back]")) return back();
    const n = e.target.closest(".nav-item");
    if (n) go(n.dataset.target);
  });

  /* ================= format toggle (YouTube) ================= */
  function syncFormat() {
    $$("#homeFormat button, #inFormat button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === format)));
  }
  ["homeFormat", "inFormat"].forEach((id) =>
    $(id).addEventListener("click", (e) => {
      const b = e.target.closest("button[data-f]");
      if (!b) return;
      format = b.dataset.f;
      settings.ytFormat = format;
      saveSettings();
      syncFormat();
    })
  );

  /* ================= HOME ================= */
  const homeUrl = $("homeUrl"), homeGo = $("homeGo"), homeGrid = $("homeGrid");

  function buildHomeGrid() {
    HOME_KEYS.forEach((k) => {
      const p = BY_KEY[k];
      const li = el("li");
      const b = el("button", "tile");
      b.type = "button";
      b.dataset.key = k;
      b.appendChild(platformIcon(p, "pi"));
      b.appendChild(el("span", "", p.label));
      b.addEventListener("click", () => openInput(p));
      li.appendChild(b);
      homeGrid.appendChild(li);
    });
    const li = el("li");
    const b = el("button", "tile");
    b.type = "button";
    const pi = el("div", "pi");
    pi.appendChild(icon("more", "h"));
    const moreLbl = el("span", "", t("more"));
    moreLbl.setAttribute("data-i18n", "more");
    b.append(pi, moreLbl);
    b.addEventListener("click", () => go("platforms"));
    li.appendChild(b);
    homeGrid.appendChild(li);
  }

  /* "Detected: {p}" with the platform name in bold, in the active language. */
  function foundNodes(p) {
    const [pre, post] = t("detect.found", { p: "\u0000" }).split("\u0000");
    return [document.createTextNode(pre), Object.assign(el("b"), { textContent: p.label }), document.createTextNode(post || "")];
  }
  function detectInto(node, v) {
    node.className = "detect";
    const label = node.querySelector("span");
    if (!v) { label.textContent = t("detect.wait"); return null; }
    const p = detect(v);
    if (!p) {
      node.classList.add("bad");
      label.textContent = /^https?:\/\//i.test(v) ? t("detect.bad") : t("detect.scheme");
      return null;
    }
    node.classList.add("on");
    label.replaceChildren(...foundNodes(p));
    return p;
  }
  function refreshHome() {
    const v = homeUrl.value.trim();
    homeGo.classList.toggle("go", !!v);
    homeGo.replaceChildren(icon(v ? "arrow" : "paste"));
    homeGo.setAttribute("aria-label", v ? t("in.go") : t("a.paste"));
    const p = detectInto($("homeDetect"), v);
    $("homeFormat").hidden = !(p && p.key === "youtube");
    $$(".tile", homeGrid).forEach((t) => t.classList.toggle("active", !!p && t.dataset.key === p.key));
  }
  homeUrl.addEventListener("input", refreshHome);
  $("homeForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = homeUrl.value.trim();
    if (!v) return pasteInto(homeUrl, refreshHome);
    submit(v);
  });

  /* ================= PLATFORM LIST ================= */
  function renderPlatforms(q) {
    const list = $("platList");
    list.replaceChildren();
    const s = (q || "").trim().toLowerCase();
    const items = PLATFORMS.filter((p) => !s || p.label.toLowerCase().includes(s) || p.key.includes(s));
    items.forEach((p) => {
      const li = el("li");
      const b = el("button");
      b.type = "button";
      b.appendChild(platformIcon(p, "pi"));
      const tx = el("div", "tx");
      tx.append(el("strong", "", p.label), el("small", "", p.sub));
      b.append(tx, icon("chev", "chev"));
      b.addEventListener("click", () => openInput(p));
      li.appendChild(b);
      list.appendChild(li);
    });
    $("platEmpty").hidden = items.length > 0;
  }
  $("platSearch").addEventListener("input", (e) => renderPlatforms(e.target.value));

  /* ================= INPUT ================= */
  const inUrl = $("inUrl"), inPaste = $("inPaste");
  function openInput(p, url) {
    ctx.platform = p;
    $("inName").textContent = p.label;
    $("inIcon").replaceChildren(platformIcon(p, "pi"));
    inUrl.placeholder = t("in.ph", { p: p.label });
    inUrl.value = url || "";
    refreshInput();
    go("input");
  }
  function refreshInput() {
    const v = inUrl.value.trim();
    inPaste.replaceChildren(icon(v ? "x" : "paste"));
    inPaste.setAttribute("aria-label", v ? t("a.clear") : t("a.paste"));
    const hint = $("inHint");
    const p = v ? detect(v) : null;
    if (!v) hint.textContent = t("in.example", { h: ctx.platform ? ctx.platform.ex : "" });
    else if (p) hint.replaceChildren(...foundNodes(p));
    else hint.textContent = /^https?:\/\//i.test(v) ? t("detect.bad") : t("detect.scheme");
    const yt = (p || ctx.platform || {}).key === "youtube";
    $("inFormat").hidden = !yt;
  }
  inUrl.addEventListener("input", refreshInput);
  inPaste.addEventListener("click", () => {
    if (inUrl.value.trim()) { inUrl.value = ""; refreshInput(); inUrl.focus(); } else pasteInto(inUrl, refreshInput);
  });
  $("inForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = inUrl.value.trim();
    if (!v) return toast(t("t.pastefirst"));
    submit(v);
  });

  /* ================= progress ring ================= */
  const RING_C = 270.18;
  function createProgress(o) {
    const root = el("div", "proc");
    root.innerHTML =
      '<h2 data-r="title"></h2><p class="sub" data-r="sub"></p>' +
      '<div class="ring" data-r="ring" role="progressbar" aria-valuemin="0" aria-valuemax="100"><i class="groove"></i>' +
      '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="arc-track" cx="50" cy="50" r="43"/><circle class="arc" data-r="arc" cx="50" cy="50" r="43"/></svg>' +
      '<div class="ring-in"><strong data-r="pct">0<small>%</small></strong><svg class="ok" aria-hidden="true"><use href="#i-check"/></svg></div></div>' +
      '<div class="steps" data-r="steps" hidden><div class="stp"><i></i></div><div class="stp"><i></i></div><div class="stp"><i></i></div></div>' +
      '<div class="job" data-r="job" hidden><div class="job-top" data-r="jobTop"></div><div class="pbar"><i data-r="fill"></i></div>' +
      '<ul class="stats"><li data-r="s0"></li><li data-r="s1"></li><li data-r="s2"></li></ul></div>' +
      '<div class="actions" data-r="actions"></div>';
    const r = {};
    $$("[data-r]", root).forEach((n) => (r[n.dataset.r] = n));
    r.title.textContent = o.title || "";
    r.sub.textContent = o.sub || "";
    const pctNum = document.createTextNode("0");
    r.pct.replaceChildren(pctNum, Object.assign(el("small"), { textContent: "%" }));
    const stepEls = $$(".stp", r.steps);
    stepEls.forEach((n, i) => n.appendChild(document.createTextNode(t("step." + (i + 1)))));
    const stat = (i, ic, txt) => {
      r["s" + i].replaceChildren(icon(ic), document.createTextNode(txt));
    };
    if (o.steps) r.steps.hidden = false;
    if (o.job) {
      r.job.hidden = false;
      const th = thumbEl(o.job.thumb, o.job.type);
      const tx = el("div", "tx");
      const t1 = el("strong", "", o.job.title);
      tx.append(t1, el("small", "", o.job.meta));
      r.jobTop.append(th, tx);
      stat(0, "file", "0 B");
      stat(1, "bolt", "--");
      stat(2, "clock", "--:--");
    }
    const api = {
      root, actions: r.actions,
      title: (t) => (r.title.textContent = t),
      sub: (t) => (r.sub.textContent = t),
      progress(p) {
        if (p == null) { r.ring.classList.add("indet"); r.ring.removeAttribute("aria-valuenow"); return; }
        p = Math.max(0, Math.min(100, p));
        r.ring.classList.remove("indet");
        r.arc.style.strokeDashoffset = String(RING_C * (1 - p / 100));
        pctNum.nodeValue = String(Math.floor(p));
        r.fill.style.width = p + "%";
        r.ring.setAttribute("aria-valuenow", String(Math.floor(p)));
      },
      step(i) { stepEls.forEach((s, n) => { s.classList.toggle("ok", n < i); s.classList.toggle("on", n === i); }); },
      size: (t) => stat(0, "file", t),
      speed: (t) => stat(1, "bolt", t),
      eta: (t) => stat(2, "clock", t),
      done() { root.classList.add("done"); r.ring.classList.remove("indet"); api.progress(100); },
    };
    return api;
  }
  function addButton(parent, text, cls, onClick, ico) {
    const b = el("button", "btn " + (cls || "btn-soft") + " block");
    b.type = "button";
    if (ico) b.appendChild(icon(ico));
    b.appendChild(document.createTextNode(text));
    b.addEventListener("click", onClick);
    parent.appendChild(b);
    return b;
  }
  /* Overlay layar penuh, isi selalu di tengah. */
  function openOverlay(content, label, onCancel) {
    const ov = el("div", "overlay");
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", label);
    const art = el("div", "ov-art");
    art.style.setProperty("--art", "url(/assets/images/download-footer.webp)");
    ov.append(art, content);
    document.body.appendChild(ov);
    const layer = { cancel: onCancel };
    pushLayer(layer);
    requestAnimationFrame(() => ov.classList.add("visible"));
    return {
      remove() {
        dropLayer(layer);
        ov.classList.remove("visible");
        setTimeout(() => ov.remove(), 230);
      },
    };
  }

  /* ---------- tahap 1: memproses link ---------- */
  const stage = (i) => t("stage." + (i + 1));
  function startProcessing(p, url, onCancel) {
    let host = url;
    try { const u = new URL(url); host = u.hostname.replace(/^www\./, "") + (u.pathname.length > 1 ? u.pathname : ""); } catch { /* biarkan */ }
    const pg = createProgress({ title: t("proc.title"), sub: stage(0), steps: true });
    const hostEl = el("p", "hint", host);
    pg.root.insertBefore(hostEl, pg.root.querySelector(".steps"));
    let cancelFn = onCancel;
    const doCancel = () => cancelFn();
    addButton(pg.actions, t("btn.cancel"), "btn-soft", doCancel, "x");
    const ov = openOverlay(pg.root, t("a.process"), doCancel);
    const t0 = performance.now();
    let pct = 0;
    const apply = () => {
      const t = performance.now() - t0;
      pct = 94 * (1 - Math.exp(-t / 6500));
      const st = pct < 14 ? 0 : pct < 52 ? 1 : 2;
      pg.progress(pct);
      pg.sub(stage(st));
      pg.step(st);
    };
    apply();
    const timer = setInterval(apply, 130);
    return {
      setCancel(fn) { cancelFn = fn; },
      stop() { clearInterval(timer); ov.remove(); },
      async finish() {
        clearInterval(timer);
        pg.progress(100);
        pg.sub(stage(3));
        pg.step(3);
        pg.done();
        await new Promise((r) => setTimeout(r, Math.max(0, 3000 - (performance.now() - t0))));
      },
    };
  }

  /* ---------- tahap 2: mengunduh file ---------- */
  function saveBlobOrLink(href, name, newTab) {
    const a = el("a");
    a.href = href;
    a.download = name;
    if (newTab) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function startDownload(d, it) {
    const kind = TYPE_LABEL[it.type] || "File";
    const q = it.quality ? it.quality + " · " : "";
    const pg = createProgress({
      title: t("dl.title"), sub: t("dl.sub"),
      job: { thumb: d.thumbnail, type: it.type, title: d.title, meta: d.platform.label + " · " + q + kind + (it.ext ? " · " + it.ext.toUpperCase() : "") },
    });
    pg.size(it.size || "--");
    const ctrl = new AbortController();
    let closed = false, finished = false;
    let ov;
    const close = () => {
      if (closed) return;
      closed = true;
      clearInterval(ticker);
      ctrl.abort();
      ov.remove();
    };
    const cancel = () => { if (!finished) toast(t("t.dlcancel")); close(); };
    addButton(pg.actions, t("btn.cancel"), "btn-soft", cancel, "x").focus({ preventScroll: true });
    ov = openOverlay(pg.root, t("a.dlproc"), cancel);

    let loaded = 0, total = 0, speed = 0, lastLoaded = 0, lastT = performance.now();
    const ticker = setInterval(() => {
      if (finished) return;
      const now = performance.now();
      const inst = ((loaded - lastLoaded) / (now - lastT)) * 1000;
      lastLoaded = loaded; lastT = now;
      speed = speed ? speed * 0.6 + inst * 0.4 : inst;
      pg.speed(fmtBytes(speed) + "/s");
      if (total) pg.eta(speed > 1 ? fmtClock((total - loaded) / speed) : "--:--");
      pg.size(total ? fmtBytes(loaded) + " / " + fmtBytes(total) : fmtBytes(loaded));
    }, 250);

    const base = (d.title || "vexora-media").replace(/[\\/:*?"<>|\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "vexora-media";
    let fileName = base + "." + (it.ext || "mp4");

    const complete = (extra) => {
      if (closed) return;
      finished = true;
      pg.done();
      setTimeout(() => { close(); completeDownload(d, it, Object.assign({ fileName }, extra)); }, 450);
    };
    /* Tidak bisa dibaca lewat JS (CORS dsb.): serahkan ke browser. */
    const handOff = () => {
      if (closed || finished) return;
      saveBlobOrLink(it.url, fileName, true);
      complete({ blobUrl: null, bytes: 0 });
    };

    const t00 = performance.now();
    (async () => {
      /* APK: unduh lewat DownloadManager Android -> folder Download/VEXORA */
      const P = nativeDL();
      if (P) {
        let id = null;
        try {
          const mime = it.type === "video" ? "video/" + (it.ext || "mp4") : it.type === "audio" ? "audio/" + (it.ext === "mp3" ? "mpeg" : it.ext || "mpeg") : it.type === "image" ? "image/" + (it.ext === "jpg" ? "jpeg" : it.ext || "jpeg") : "";
          const r0 = await P.enqueue({ url: it.url, fileName, mime });
          id = r0 && r0.id;
        } catch { /* jatuh ke jalur lain */ }
        if (id) {
          pg.progress(null);
          for (;;) {
            if (closed) { try { P.cancel({ id }); } catch { /* abaikan */ } return; }
            let s = null;
            try { s = await P.status({ id }); } catch { break; }
            loaded = Number(s.bytes) || 0;
            total = Number(s.total) > 0 ? Number(s.total) : 0;
            if (total) pg.progress(Math.min(99, (loaded / total) * 100)); else pg.progress(null);
            if (s.state === "done") {
              pg.speed(fmtBytes(loaded / Math.max((performance.now() - t00) / 1000, 0.1)) + "/s");
              pg.size(fmtBytes(loaded || total)); pg.eta("00:00");
              toast(t("t.nativeok"));
              return complete({ blobUrl: null, bytes: loaded || total });
            }
            if (s.state === "failed") { toast(t("t.dlfail")); return close(); }
            await new Promise((r1) => setTimeout(r1, 350));
          }
        }
        if (closed) return;
        toast(t("t.nonative"));
        try { window.open(it.url, "_system"); } catch { /* abaikan */ }
        return complete({ blobUrl: null, bytes: 0 });
      }
      let res;
      try { res = await fetch(it.url, { signal: ctrl.signal, referrerPolicy: "no-referrer", credentials: "omit" }); } catch { return handOff(); }
      if (closed) return;
      if (!res.ok || !res.body) return handOff();
      total = parseInt(res.headers.get("content-length") || "0", 10) || 0;
      const ct = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      if (!it.ext && MIME_EXT[ct]) fileName = base + "." + MIME_EXT[ct];
      if (total) pg.size("0 B / " + fmtBytes(total)); else pg.progress(null);
      const chunks = [];
      const reader = res.body.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          loaded += value.length;
          if (total) pg.progress(Math.min(99, (loaded / total) * 100));
        }
      } catch {
        if (closed) return;
        return handOff();
      }
      if (closed) return;
      const blob = new Blob(chunks, { type: ct || "application/octet-stream" });
      const href = URL.createObjectURL(blob);
      pg.speed(fmtBytes(loaded / Math.max((performance.now() - t00) / 1000, 0.1)) + "/s");
      pg.size(fmtBytes(loaded));
      pg.eta("00:00");
      saveBlobOrLink(href, fileName, false);
      complete({ blobUrl: href, bytes: loaded });
    })();
  }

  function notifyDone(title) {
    if (!settings.notify) return;
    try { if (navigator.vibrate) navigator.vibrate(120); } catch { /* abaikan */ }
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      try { new Notification(t("n.done"), { body: title, icon: "/assets/images/icon-192.png" }); } catch { /* abaikan */ }
    }
  }

  function completeDownload(d, it, x) {
    if (ctx.last && ctx.last.blobUrl) { try { URL.revokeObjectURL(ctx.last.blobUrl); } catch { /* abaikan */ } }
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      url: d.sourceUrl, key: d.platform.key, title: d.title, thumb: d.thumbnail || "",
      type: it.type, ext: it.ext || "", size: x.bytes ? fmtBytes(x.bytes) : it.size || "", dl: it.url, ts: Date.now(),
    };
    ctx.last = { d, it, blobUrl: x.blobUrl, fileName: x.fileName, bytes: x.bytes, entry };
    const list = store.get(K_HIST, []).filter((h) => !(h.url === entry.url && h.type === entry.type && h.ext === entry.ext));
    list.unshift(entry);
    store.set(K_HIST, list.slice(0, 60));
    notifyDone(d.title);
    go("success");
  }



  /* ================= fallback RapidAPI ================= */
  const MEDIA_KEYS = ["download_url", "downloadUrl", "download", "video_url", "videoUrl", "video", "hd", "sd", "nowm", "nowatermark", "play", "url", "link", "src", "audio", "audio_url", "music_url", "mp3", "image", "image_url"];
  const SKIP_KEYS = /thumb|cover|avatar|poster|preview|profile|icon|logo|origin_cover|dynamic/i;
  function harvestMedia(node, out, hint, depth) {
    if (!node || depth > 6 || out.length > 80) return;
    if (Array.isArray(node)) { node.forEach((n) => harvestMedia(n, out, hint, depth + 1)); return; }
    if (typeof node !== "object") return;
    const h = {
      q: node.quality || node.resolution || node.label || node.format_note || node.format || (node.height ? (node.width ? Math.min(node.width, node.height) : node.height) + "p" : "") || hint.q || "",
      ext: node.ext || node.extension || hint.ext || "",
      mime: node.mime || node.mimeType || node.mime_type || node.type || hint.mime || "",
    };
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (typeof v === "string") {
        if (!/^https?:\/\//i.test(v) || SKIP_KEYS.test(k)) continue;
        if (MEDIA_KEYS.indexOf(k) === -1 && !/(\.(mp4|webm|m4a|mp3|jpe?g|png|webp|gif)(\?|$))/i.test(v)) continue;
        out.push({ url: v, key: k, q: String(h.q || ""), ext: String(h.ext || ""), mime: String(h.mime || "") });
      } else if (v && typeof v === "object" && !SKIP_KEYS.test(k)) {
        harvestMedia(v, out, { q: /^(hd|sd)$/i.test(k) ? k.toUpperCase() : h.q, ext: h.ext, mime: /audio|music|mp3/i.test(k) ? "audio" : h.mime }, depth + 1);
      }
    }
  }
  function firstStr(o, keys) {
    for (const k of keys) { const v = o && o[k]; if (typeof v === "string" && v.trim()) return v.trim(); }
    return "";
  }
  function mapGeneric(json, url, p) {
    if (!json || typeof json !== "object") return null;
    if (json.ok === false || json.success === false || json.error === true) return null;
    const root = json.data && typeof json.data === "object" && !Array.isArray(json.data) ? Object.assign({}, json, json.data) : json;
    const raw = [];
    harvestMedia(json, raw, {}, 0);
    const seen = new Set();
    const out = [];
    for (const f of raw) {
      if (/\.m3u8(\?|$)/i.test(f.url) || seen.has(f.url)) continue;
      seen.add(f.url);
      let q = null;
      try { q = new URL(f.url).searchParams; } catch { /* abaikan */ }
      const mime = (f.mime || (q && q.get("mime")) || "").toLowerCase();
      const pathExt = (f.url.split("?")[0].match(/\.([a-z0-9]{2,4})$/i) || [])[1] || "";
      const isAudio = /audio|music|mp3/i.test(mime + " " + f.key) || /^(mp3|m4a|aac|ogg|wav)$/i.test(f.ext || pathExt);
      const isImage = /image|photo|jpe?g|png|webp|gif/i.test(mime + " " + f.key) || /^(jpe?g|png|webp|gif)$/i.test(f.ext || pathExt);
      const type = isAudio ? "audio" : isImage ? "image" : "video";
      let ext = (f.ext || MIME_EXT[mime] || pathExt || (isAudio ? "mp3" : isImage ? "jpg" : "mp4")).toLowerCase().replace(/^\./, "");
      if (!/^[a-z0-9]{2,4}$/.test(ext)) ext = isAudio ? "mp3" : isImage ? "jpg" : "mp4";
      const hm = f.q.match(/(\d{3,4})\s*p?/);
      const quality = isAudio ? "Audio" : isImage ? "" : (/^\d+x\d+$/.test(f.q) ? Math.min(...f.q.split("x").map(Number)) + "p" : hm ? hm[1] + "p" : f.q.slice(0, 12));
      out.push({ url: f.url, type, quality, label: "", ext, size: "" });
    }
    if (!out.length) return null;
    const list = out.slice(0, 12);
    return {
      ok: true,
      platform: p || { key: "web", label: "Web" },
      title: firstStr(root, ["title", "caption", "description", "desc", "name"]).slice(0, 140) || "VEXORA",
      author: firstStr(root, ["author", "uploader", "channel", "username", "owner"]),
      thumbnail: firstStr(root, ["thumbnail_url", "thumbnail", "thumb", "cover", "cover_url", "image_url"]),
      type: list.some((x) => x.type === "video") ? "video" : list[0].type,
      downloads: list,
      sourceUrl: url,
    };
  }
  async function rapidFallback(url, p, signal) {
    const R = CFG.rapid || {};
    if (!R.enabled || !R.key) throw new Error("rapid-off");
    const providers = [
      { host: "instagram-tiktok-youtube-downloader.p.rapidapi.com", build: (u) => ({ path: "/fetch?url=" + encodeURIComponent(u), init: { method: "GET" } }) },
      { host: "best-all-in-one-video-downloader.p.rapidapi.com", build: (u) => { const fd = new FormData(); fd.append("url", u); return { path: "/index.php", init: { method: "POST", body: fd } }; } },
    ];
    let lastErr = new Error("rapid");
    for (const pv of providers) {
      const { path, init } = pv.build(url);
      const ctrl = new AbortController();
      const onAbort = () => ctrl.abort();
      signal.addEventListener("abort", onAbort);
      const tm = setTimeout(() => ctrl.abort(), (R.timeoutSec || 40) * 1000);
      try {
        const r = await fetch("https://" + pv.host + path, {
          ...init,
          headers: { "x-rapidapi-key": R.key, "x-rapidapi-host": pv.host },
          signal: ctrl.signal,
        });
        if (!r.ok) { lastErr = new Error("rapid-" + r.status); continue; }
        let json;
        try { json = await r.json(); } catch { lastErr = new Error("rapid-json"); continue; }
        const d = mapGeneric(json, url, p);
        if (d) return d;
        lastErr = new Error("rapid-empty");
      } catch (e) {
        if (signal.aborted) throw e;
        lastErr = e;
      } finally {
        clearTimeout(tm);
        signal.removeEventListener("abort", onAbort);
      }
    }
    throw lastErr;
  }

  /* ================= fallback Apify ================= */
  async function apifyFallback(url, p, signal) {
    const A = CFG.apify || {};
    const tokens = (A.tokens || []).filter(Boolean);
    if (!A.enabled || !A.actor || !tokens.length) throw new Error("apify-off");
    let lastErr = new Error("apify");
    for (const tk of tokens) {
      const ep = "https://api.apify.com/v2/acts/" + encodeURIComponent(String(A.actor).replace("/", "~")) +
        "/run-sync-get-dataset-items?timeout=" + (A.timeoutSec || 150) + "&token=" + encodeURIComponent(tk);
      let r;
      try {
        r = await fetch(ep, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, mergeAV: A.mergeAV !== false, proxySettings: A.proxy }),
          signal,
        });
      } catch (e) { if (e && e.name === "AbortError") throw e; lastErr = e; continue; }
      if (r.status === 401 || r.status === 402 || r.status === 403 || r.status === 429) { lastErr = new Error("apify-" + r.status); continue; }
      if (!r.ok) { lastErr = new Error("apify-" + r.status); continue; }
      let items;
      try { items = await r.json(); } catch { lastErr = new Error("apify-json"); continue; }
      const d = mapApify(Array.isArray(items) ? items[0] : items, url, p);
      if (d) return d;
      lastErr = new Error("apify-empty");
    }
    throw lastErr;
  }

  function mapApify(it, url, p) {
    if (!it || typeof it !== "object") return null;
    const raw = [];
    if (Array.isArray(it.formats)) raw.push(...it.formats);
    ["url", "downloadUrl", "download_url", "video_url", "videoUrl", "mergedUrl"].forEach((k) => {
      if (typeof it[k] === "string") raw.push({ url: it[k], resolution: it.resolution || "" });
    });
    const seen = new Set();
    const out = [];
    for (const f of raw) {
      const u = f && f.url;
      if (typeof u !== "string" || !/^https?:\/\//i.test(u)) continue;
      if (/\.m3u8(\?|$)/i.test(u) || /manifest\.googlevideo|\/sb\/|storyboard/i.test(u)) continue;
      let q = null;
      try { q = new URL(u).searchParams; } catch { /* abaikan */ }
      const mime = (q && q.get("mime")) || "";
      const res = String(f.resolution || "");
      const isAudio = /audio/i.test(res) || /^audio\//.test(mime) || /\.(mp3|m4a|aac|ogg|wav)(\?|$)/i.test(u);
      const isImage = /^image\//.test(mime) || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u);
      if (isImage) continue;
      const type = isAudio ? "audio" : "video";
      let ext = MIME_EXT[mime] || (u.split("?")[0].match(/\.([a-z0-9]{2,4})$/i) || [])[1] || (isAudio ? "m4a" : "mp4");
      ext = ext.toLowerCase();
      const hm = res.match(/(\d+)\s*x\s*(\d+)/);
      const h = hm ? Math.min(+hm[1], +hm[2]) : 0;
      const quality = isAudio ? "Audio" : h ? h + "p" : (res || "HD");
      const key = type + quality + ext;
      if (seen.has(key)) continue;
      seen.add(key);
      const bytes = q && +q.get("clen");
      out.push({ url: u, type, quality, label: "", ext, size: bytes ? fmtBytes(bytes) : "", _h: h });
    }
    if (!out.length) return null;
    const vids = out.filter((x) => x.type === "video").sort((a, b) => b._h - a._h).slice(0, 8);
    const auds = out.filter((x) => x.type === "audio").slice(0, 3);
    const downloads = [...vids, ...auds].map(({ _h, ...x }) => x);
    return {
      ok: true,
      platform: p || { key: "web", label: "Web" },
      title: it.title || it.fulltitle || "VEXORA",
      author: it.uploader || it.channel || it.author || "",
      thumbnail: it.thumbnail || "",
      type: vids.length ? "video" : "audio",
      downloads,
      sourceUrl: url,
    };
  }

  /* ================= submit (analisis link) ================= */
  let busy = false;
  async function submit(url) {
    if (busy) return;
    const p = detect(url);
    if (!p) return toast(t("t.invalid"));
    busy = true;
    const ctrl = new AbortController();
    let cancelled = false, result = null, err = null;
    const proc = startProcessing(p, url, () => { cancelled = true; ctrl.abort(); });
    const timer = setTimeout(() => { if (!cancelled) ctrl.abort(); }, 65000);
    let primaryErr = null;
    try {
      const r = await fetch(API_BASE + "/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format }),
        signal: ctrl.signal,
      });
      let data = null;
      try { data = await r.json(); } catch { /* bukan JSON */ }
      if (data && data.ok) { result = data; result.sourceUrl = url; }
      else if (data) primaryErr = [t("e.fail"), data.code ? t("srv." + data.code) : data.error || t("e.generic"), data.tried];
      else primaryErr = [t("e.nosrv.t"), t("e.nosrv.m"), null];
    } catch (e) {
      if (cancelled) { toast(t("t.proccancel")); }
      else if (e && e.name === "AbortError") primaryErr = [t("e.timeout.t"), t("e.timeout.m"), null];
      else primaryErr = [t("e.conn.t"), t("e.conn.m"), null];
    } finally {
      clearTimeout(timer);
    }
    /* fallback ke Apify bila server utama gagal */
    if (!result && !cancelled && primaryErr) {
      const ctrl2 = new AbortController();
      proc.setCancel && proc.setCancel(() => { cancelled = true; ctrl2.abort(); });
      const t2 = setTimeout(() => ctrl2.abort(), 200000);
      for (const fb of [rapidFallback, apifyFallback]) {
        if (result || cancelled) break;
        try { result = await fb(url, p, ctrl2.signal); } catch { /* lanjut ke fallback berikutnya */ }
      }
      clearTimeout(t2);
      if (!result) { if (cancelled) toast(t("t.proccancel")); else err = primaryErr; }
    }
    if (result) await proc.finish();
    proc.stop();
    busy = false;
    if (result) {
      ctx.result = result;
      renderResult(result);
      go("result");
    } else if (err) showError(err[0], err[1]);
  }

  function showError(title, msg) {
    dialog({ title, text: msg, body: [], actions: [{ text: t("btn.close"), cls: "btn-primary" }] });
  }

  /* ================= RESULT ================= */
  function renderResult(d) {
    const root = $("resultBody");
    const frag = document.createDocumentFragment();
    const card = el("div", "media-card");
    card.appendChild(thumbEl(d.thumbnail, d.type));
    const meta = el("div", "meta");
    meta.appendChild(el("h2", "", d.title));
    const chips = el("div", "chips");
    chips.append(el("span", "chip hi", d.platform.label), el("span", "chip", TYPE_LABEL[d.type] || d.type), el("span", "chip", t("res.files", { n: d.downloads.length })));
    meta.appendChild(chips);
    if (d.author) meta.appendChild(el("div", "author", t("res.by", { a: d.author })));
    card.appendChild(meta);
    frag.appendChild(card);
    frag.appendChild(el("div", "list-title", t("res.list")));
    const ul = el("ul", "dl-list");
    d.downloads.forEach((it, i) => {
      const li = el("li", "dl");
      const ic = el("div", "ico");
      ic.appendChild(icon(typeIcon(it.type)));
      const info = el("div", "info");
      const main = [it.quality, it.label].filter(Boolean).join(" · ") || (TYPE_LABEL[it.type] || "File") + " " + (i + 1);
      info.appendChild(el("strong", "", main));
      info.appendChild(el("span", "", [TYPE_LABEL[it.type] || it.type, it.ext && it.ext.toUpperCase(), it.size].filter(Boolean).join(" · ")));
      const actions = el("div", "actions");
      const a = el("a", "btn-get");
      a.href = it.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.setAttribute("download", "");
      a.append(icon("download"), document.createTextNode(t("res.get")));
      a.addEventListener("click", (e) => { e.preventDefault(); startDownload(d, it); });
      const cp = el("button", "nbtn");
      cp.type = "button";
      cp.setAttribute("aria-label", t("res.copy"));
      cp.appendChild(icon("copy"));
      cp.addEventListener("click", () => copyText(it.url));
      actions.append(a, cp);
      li.append(ic, info, actions);
      ul.appendChild(li);
    });
    frag.appendChild(ul);
    frag.appendChild(el("p", "hint", t("res.hint")));
    root.replaceChildren(frag);
  }

  /* ================= SUCCESS ================= */
  const savedList = () => store.get(K_SAVED, []);
  const isSaved = (url) => savedList().some((s) => s.url === url);
  function toggleSaved(h) {
    let list = savedList();
    if (list.some((s) => s.url === h.url)) {
      list = list.filter((s) => s.url !== h.url);
      toast(t("t.unsaved"));
    } else {
      list.unshift({ url: h.url, key: h.key, title: h.title, thumb: h.thumb, type: h.type, ts: Date.now() });
      toast(t("t.saved"));
    }
    store.set(K_SAVED, list.slice(0, 100));
  }

  function renderSuccess() {
    const L = ctx.last;
    if (!L) return;
    const { d, it, entry } = L;
    const body = $("okBody");
    const pv = el("div", "preview");
    const th = thumbEl(d.thumbnail, it.type);
    pv.appendChild(th);
    const open = () => window.open(L.blobUrl || it.url, "_blank", "noopener");
    const play = () => {
      if (!L.blobUrl) return open();
      if (it.type === "video") {
        const v = el("video");
        v.src = L.blobUrl; v.controls = true; v.autoplay = true; v.playsInline = true;
        th.appendChild(v);
        pv.querySelector(".play") && pv.querySelector(".play").remove();
      } else if (it.type === "image") {
        const im = el("img", "big-img");
        im.alt = ""; im.src = L.blobUrl;
        th.appendChild(im);
        pv.querySelector(".play") && pv.querySelector(".play").remove();
      } else if (it.type === "audio") {
        let a = pv.querySelector("audio");
        if (!a) { a = el("audio"); a.src = L.blobUrl; a.controls = true; pv.appendChild(a); }
        a.play().catch(() => {});
      } else open();
    };
    if (it.type !== "file") {
      const pl = el("button", "play");
      pl.type = "button";
      pl.setAttribute("aria-label", t("a.play"));
      const sp = el("span");
      sp.appendChild(icon(it.type === "image" ? "image" : "play"));
      pl.appendChild(sp);
      pl.addEventListener("click", play);
      pv.appendChild(pl);
    }
    const meta = el("div", "ok-meta");
    meta.appendChild(icon(typeIcon(it.type)));
    meta.appendChild(document.createTextNode([d.platform.label, TYPE_LABEL[it.type] || "File", L.bytes ? fmtBytes(L.bytes) : it.size].filter(Boolean).join(" · ")));

    const btns = el("div", "ok-btns");
    const bPlay = el("button", "btn btn-primary block");
    bPlay.type = "button";
    bPlay.append(icon("play"), document.createTextNode(t("ok.play")));
    bPlay.addEventListener("click", play);
    const bOpen = el("button", "btn btn-soft block");
    bOpen.type = "button";
    bOpen.append(icon("external"), document.createTextNode(t("ok.open")));
    bOpen.addEventListener("click", open);
    btns.append(bPlay, bOpen);

    const acts = el("div", "ok-acts");
    const act = (ic, label, fn) => {
      const b = el("button");
      b.type = "button";
      const n = el("span", "nbtn");
      n.appendChild(icon(ic));
      b.append(n, document.createTextNode(label));
      b.addEventListener("click", fn);
      acts.appendChild(b);
    };
    act("share", t("ok.share"), () => {
      if (navigator.share) navigator.share({ title: d.title, url: d.sourceUrl }).catch(() => {});
      else copyText(d.sourceUrl);
    });
    act("download", t("ok.save"), () => {
      if (L.blobUrl) { saveBlobOrLink(L.blobUrl, L.fileName, false); toast(t("ok.saving")); }
      else saveBlobOrLink(it.url, L.fileName, true);
    });
    act("trash", t("ok.del"), () =>
      confirmDialog(t("ok.delq"), t("ok.delp"), t("btn.delete"), () => {
        removeHistory(entry.id);
        toast(t("t.unhist"));
        back();
      })
    );
    body.replaceChildren(pv, el("h3", "ok-title", d.title), meta, btns, acts);
    const mark = $("okMark");
    const sync = () => mark.setAttribute("aria-pressed", String(isSaved(d.sourceUrl)));
    mark.onclick = () => { toggleSaved(entry); sync(); };
    sync();
  }

  /* ================= HISTORY & SAVED ================= */
  function removeHistory(id) { store.set(K_HIST, store.get(K_HIST, []).filter((h) => h.id !== id)); }

  function rowEl(h, meta, onOpen, onMenu) {
    const li = el("li", "row");
    const main = el("button", "row-main");
    main.type = "button";
    const tx = el("div", "tx");
    tx.append(el("strong", "", h.title || h.url), el("small", "", meta));
    if (h.ts) tx.appendChild(el("small", "", fmtDate(h.ts)));
    main.append(thumbEl(h.thumb, h.type), tx);
    main.addEventListener("click", onOpen);
    const k = el("button", "kebab");
    k.type = "button";
    k.setAttribute("aria-label", t("a.menu"));
    k.appendChild(icon("more"));
    k.addEventListener("click", onMenu);
    li.append(main, k);
    return li;
  }
  function reopen(h) {
    const p = BY_KEY[h.key] || detect(h.url);
    if (!p) return toast(t("t.unknownplat"));
    openInput(p, h.url);
  }
  function itemMenu(h, kind) {
    const saved = isSaved(h.url);
    const menu = [
      { label: t("hm.redo"), icon: "download", fn: () => reopen(h) },
      { label: saved ? t("hm.unsave") : t("hm.save"), icon: "bookmark", fn: () => { toggleSaved(h); renderLists(); } },
      { label: t("hm.copy"), icon: "copy", fn: () => copyText(h.url) },
      {
        label: kind === "history" ? t("hm.delhist") : t("hm.del"), icon: "trash",
        fn: () => {
          if (kind === "history") removeHistory(h.id);
          else store.set(K_SAVED, savedList().filter((s) => s.url !== h.url));
          renderLists();
        },
      },
    ];
    dialog({ title: h.title || t("a.menu"), menu });
  }
  function renderHistory() {
    const all = store.get(K_HIST, []);
    const f = ctx.filter;
    const list = f === "all" ? all : all.filter((h) => h.type === f);
    const ul = $("histList");
    ul.replaceChildren();
    list.forEach((h) => {
      const p = BY_KEY[h.key];
      ul.appendChild(rowEl(h, [p ? p.label : "", h.size || TYPE_LABEL[h.type]].filter(Boolean).join(" · "), () => reopen(h), () => itemMenu(h, "history")));
    });
    $("histEmpty").hidden = list.length > 0;
    const empty = $("histEmpty");
    empty.querySelector("h3").textContent = all.length && !list.length ? t("hist.n.t") : t("hist.e.t");
    empty.querySelector("p").textContent = all.length && !list.length ? t("hist.n.p") : t("hist.e.p");
    $("histFilter").hidden = !all.length;
    $("histMenu").hidden = !all.length;
  }
  function renderSaved() {
    const list = savedList();
    const ul = $("savedList");
    ul.replaceChildren();
    list.forEach((h) => {
      const p = BY_KEY[h.key];
      ul.appendChild(rowEl(h, [p ? p.label : "", TYPE_LABEL[h.type]].filter(Boolean).join(" · "), () => reopen(h), () => itemMenu(h, "saved")));
    });
    $("savedEmpty").hidden = list.length > 0;
  }
  function renderLists() {
    if (current === "history") renderHistory();
    else if (current === "saved") renderSaved();
    renderStats();
  }
  $("histFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-t]");
    if (!b) return;
    ctx.filter = b.dataset.t;
    $$("#histFilter button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderHistory();
  });
  $("histMenu").addEventListener("click", () =>
    dialog({
      title: t("hist.menu"),
      menu: [{
        label: t("hist.clear"), icon: "trash",
        fn: () => confirmDialog(t("hist.clearq"), t("hist.clearp"), t("btn.delete"), () => { store.set(K_HIST, []); renderHistory(); toast(t("t.histclear")); }),
      }],
    })
  );

  /* ================= PROFILE ================= */
  function setAvatar(node, data) {
    if (data) node.style.setProperty("--av", "url(" + data + ")"); else node.style.removeProperty("--av");
  }
  function renderStats() {
    $("stDl").textContent = String(store.get(K_HIST, []).length);
    $("stSv").textContent = String(savedList().length);
    $("stPl").textContent = String(PLATFORMS.length);
  }
  function renderProfile() {
    $("meNameTxt").textContent = profile.name;
    setAvatar($("meAvatarImg"), profile.avatar);
    renderStats();
  }
  function fileToAvatar(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const S = 256, c = document.createElement("canvas");
        c.width = c.height = S;
        const m = Math.min(img.width, img.height) || 1;
        c.getContext("2d").drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, S, S);
        URL.revokeObjectURL(url);
        res(c.toDataURL("image/webp", 0.88));
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("img")); };
      img.src = url;
    });
  }
  function editProfile() {
    let draft = profile.avatar;
    const wrap = el("div", "av-edit");
    const av = el("div", "avatar");
    const avImg = el("span", "avatar-img");
    av.appendChild(avImg);
    setAvatar(avImg, draft);
    const col = el("div", "col");
    const bChange = el("button", "btn btn-soft sm");
    bChange.type = "button";
    bChange.append(icon("camera"), document.createTextNode(t("edit.change")));
    const bRemove = el("button", "btn btn-soft sm");
    bRemove.type = "button";
    bRemove.append(icon("trash"), document.createTextNode(t("edit.remove")));
    col.append(bChange, bRemove);
    wrap.append(av, col);
    const fileIn = $("avatarFile");
    bChange.addEventListener("click", () => fileIn.click());
    fileIn.onchange = async () => {
      const f = fileIn.files && fileIn.files[0];
      fileIn.value = "";
      if (!f) return;
      try { draft = await fileToAvatar(f); setAvatar(avImg, draft); } catch { toast(t("t.imgfail")); }
    };
    bRemove.addEventListener("click", () => { draft = null; setAvatar(avImg, null); });
    const field = el("div", "p-field");
    const inp = el("input");
    inp.type = "text"; inp.maxLength = 24; inp.value = profile.name; inp.placeholder = t("edit.name"); inp.setAttribute("aria-label", t("edit.nameLabel"));
    field.appendChild(inp);
    dialog({
      title: t("edit.title"), body: [wrap, field],
      actions: [{ text: t("btn.cancel") }, {
        text: t("btn.save"), cls: "btn-primary",
        fn: () => {
          const n = inp.value.trim().replace(/\s+/g, " ");
          if (!n) { toast(t("t.noname")); return false; }
          profile.name = n;
          profile.avatar = draft;
          saveProfile();
          renderProfile();
          toast(t("t.profileok"));
        },
      }],
    });
  }
  $("meAvatar").addEventListener("click", editProfile);
  $("meName").addEventListener("click", editProfile);

  $("themeSw").addEventListener("click", () => { applyTheme(settings.theme === "dark" ? "light" : "dark"); saveSettings(); });

  function switchRow(label, hint, on, onToggle) {
    const row = el("div", "p-row");
    const tx = el("div");
    tx.append(document.createTextNode(label), el("small", "", hint));
    const sw = el("button", "switch");
    sw.type = "button";
    sw.setAttribute("role", "switch");
    sw.setAttribute("aria-label", label);
    sw.setAttribute("aria-checked", String(on));
    sw.appendChild(el("i"));
    sw.addEventListener("click", () => {
      const v = sw.getAttribute("aria-checked") !== "true";
      sw.setAttribute("aria-checked", String(v));
      onToggle(v);
    });
    row.append(tx, sw);
    return row;
  }
  $("mNotif").addEventListener("click", () =>
    dialog({
      title: t("n.title"),
      body: [switchRow(t("n.row"), t("n.hint"), settings.notify, async (v) => {
        settings.notify = v;
        saveSettings();
        if (v && "Notification" in window && Notification.permission === "default") {
          try { const r = await Notification.requestPermission(); if (r !== "granted") toast(t("t.notifdenied")); } catch { /* abaikan */ }
        }
      })],
      actions: [{ text: t("btn.close"), cls: "btn-primary" }],
    })
  );
  $("mSettings").addEventListener("click", () => {
    const seg = el("div", "seg");
    seg.style.marginTop = "0";
    [["mp4", t("fmt.video")], ["mp3", t("fmt.audio")]].forEach(([f, lbl]) => {
      const b = el("button", "", lbl);
      b.type = "button";
      b.setAttribute("aria-pressed", String(format === f));
      b.addEventListener("click", () => {
        format = f;
        settings.ytFormat = f;
        saveSettings();
        syncFormat();
        $$("button", seg).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      });
      seg.appendChild(b);
    });
    const label = el("p", "p-txt", t("s.yt"));
    const clear = (txt, q, key, msg) => {
      const b = el("button", "btn btn-soft block", txt);
      b.type = "button";
      b.addEventListener("click", () => confirmDialog(q, t("s.irrev"), t("btn.delete"), () => { store.set(key, []); renderStats(); toast(msg); }));
      return b;
    };
    dialog({
      title: t("s.title"), body: [label, seg, clear(t("s.clearhist"), t("s.clearhistq"), K_HIST, t("t.histclear")), clear(t("s.clearsaved"), t("s.clearsavedq"), K_SAVED, t("t.savedclear"))],
      actions: [{ text: t("btn.close"), cls: "btn-primary" }],
    });
  });
  $("mHelp").addEventListener("click", () => {
    const faq = el("div", "faq");
    [1, 2, 3, 4].map((n) => [t("h.q" + n), t("h.a" + n)]).forEach(([q, a]) => {
      const d = el("details");
      d.append(el("summary", "", q), el("p", "", a));
      faq.appendChild(d);
    });
    dialog({ title: t("h.title"), body: [faq], actions: [{ text: t("btn.close"), cls: "btn-primary" }] });
  });
  $("mReset").addEventListener("click", () =>
    confirmDialog(t("r.title"), t("r.p"), t("btn.reset"), () => {
      try { Object.keys(localStorage).filter((k) => k.startsWith("vexora.")).forEach((k) => localStorage.removeItem(k)); sessionStorage.removeItem("vexora.intro"); } catch { /* abaikan */ }
      location.reload();
    })
  );

  /* ================= STATUS PILL: battery · clock · date ================= */
  const sb = { time: $("sbTime"), sec: $("sbSec"), date: $("sbDate"), pct: $("sbPct"), fill: $("sbFill"), bolt: $("sbBolt"), bat: $("sbBat"), div: $("sbDiv") };
  let fmtT, fmtD, fmtLoc = "", lastDay = "", lastMin = "";
  function tickClock() {
    const loc = window.VX.meta().loc + "-u-nu-latn";
    if (loc !== fmtLoc) {
      fmtLoc = loc; lastDay = ""; lastMin = "";
      try {
        fmtT = new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
        fmtD = new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric" });
      } catch { fmtT = fmtD = null; }
    }
    const d = new Date();
    const ss = String(d.getSeconds()).padStart(2, "0");
    sb.sec.textContent = ":" + ss;
    const hm = fmtT ? fmtT.format(d) : String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    if (hm !== lastMin) { lastMin = hm; sb.time.textContent = hm; }
    const day = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
    if (day !== lastDay) { lastDay = day; sb.date.textContent = fmtD ? fmtD.format(d) : d.toDateString(); }
  }
  (function startClock() {
    tickClock();
    const align = () => { tickClock(); setTimeout(align, 1000 - (Date.now() % 1000) + 5); };
    setTimeout(align, 1000 - (Date.now() % 1000) + 5);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) tickClock(); });
  })();
  (function startBattery() {
    if (!navigator.getBattery) return; // unsupported (e.g. iOS): pill shows clock + date only
    navigator.getBattery().then((b) => {
      const paint = () => {
        const lv = Math.max(0, Math.min(1, b.level));
        sb.pct.textContent = Math.round(lv * 100) + "%";
        sb.fill.setAttribute("width", String(Math.max(1.5, 20 * lv)));
        sb.bolt.toggleAttribute("hidden", !b.charging); /* SVG has no .hidden property */
      };
      sb.bat.hidden = false; sb.div.hidden = false;
      paint();
      ["levelchange", "chargingchange"].forEach((ev) => b.addEventListener(ev, paint));
    }).catch(() => {});
  })();

  /* ================= LANGUAGE ================= */
  const langName = () => window.VX.meta().name;
  function retranslate() {
    window.VX.apply();
    tickClock();
    applyTheme(settings.theme);
    $("langVal").textContent = langName();
    $("homeGo").setAttribute("aria-label", t("a.paste"));
    $("inPaste").setAttribute("aria-label", t("a.paste"));
    refreshHome();
    if (ctx.platform) { inUrl.placeholder = t("in.ph", { p: ctx.platform.label }); refreshInput(); }
    renderPlatforms($("platSearch").value);
    renderProfile();
    if (ctx.result) renderResult(ctx.result);
    if (ctx.last) renderSuccess();
    if (current === "history") renderHistory();
    else if (current === "saved") renderSaved();
  }
  $("mLang").addEventListener("click", () => {
    const menu = window.VX.LANGS.map((l) => ({
      label: l.name,
      fn: () => { settings.lang = l.code; window.VX.setLang(l.code); saveSettings(); retranslate(); },
    }));
    const dlg = dialog({ title: t("l.title"), menu });
    const idx = window.VX.LANGS.findIndex((l) => l.code === window.VX.lang());
    const cur = $$(".m-list button", dlg.panel)[idx];
    if (cur) { cur.classList.add("cur"); cur.setAttribute("aria-current", "true"); cur.appendChild(icon("check")); }
  });

  /* ================= INTRO ================= */
  (function intro() {
    const root = $("intro");
    let seen = false;
    try { seen = sessionStorage.getItem("vexora.intro") === "1"; } catch { /* abaikan */ }
    if (seen) { root.remove(); return; }
    document.body.classList.add("lock", "booting");
    let ended = false, timer = 0;
    const end = () => {
      if (ended) return;
      ended = true;
      clearTimeout(timer);
      root.classList.add("out");                 // splash memudar keluar
      requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove("booting"))); // app fade-in
      if (!layers.length) document.body.classList.remove("lock");
      try { sessionStorage.setItem("vexora.intro", "1"); } catch { /* abaikan */ }
      setTimeout(() => root.remove(), 1000);
    };
    timer = setTimeout(end, 3000);               // sama dengan durasi bar Initializing (3 detik)
    root.addEventListener("click", end);
  })();

  /* ================= PWA: service worker (hanya web, bukan APK) ================= */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol) && !isNative() && location.hostname !== "localhost") {
    window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => {}); });
  }

  /* ================= init ================= */
  window.VX.setLang(window.VX.lang(), true);
  applyTheme(settings.theme);
  buildHomeGrid();
  renderPlatforms("");
  syncFormat();
  refreshHome();
  renderProfile();
  $("langVal").textContent = langName();
  window.VX.apply();
  $("homeGo").setAttribute("aria-label", t("a.paste"));
  $("inPaste").setAttribute("aria-label", t("a.paste"));
})();


/* Sembunyikan bottom nav saat keyboard terbuka agar tidak ikut naik */
(function(){
  var root=document.documentElement, t;
  var isField=function(el){return el&&/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)||(el&&el.isContentEditable)};
  var set=function(on){root.classList.toggle("kb-open",on)};
  document.addEventListener("focusin",function(e){clearTimeout(t);if(isField(e.target))set(true)});
  document.addEventListener("focusout",function(){clearTimeout(t);t=setTimeout(function(){if(!isField(document.activeElement))set(false)},120)});
  if(window.visualViewport){
    var base=window.innerHeight;
    window.addEventListener("orientationchange",function(){setTimeout(function(){base=window.innerHeight},400)});
    visualViewport.addEventListener("resize",function(){
      var shrunk=base-visualViewport.height>140;
      if(shrunk)set(true);else if(!isField(document.activeElement))set(false);
    });
  }
})();
