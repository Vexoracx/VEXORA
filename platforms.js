/**
 * Registry platform -> daftar scraper (urutan = fallback chain).
 * Hanya scraper HTTP murni (axios + cheerio). Scraper berbasis browser
 * (fdown, snapinsta, savetik) sengaja dibuang karena tidak jalan di Vercel.
 */
const L = (p) => require("../../scrapr/lib/" + p).scrape;

const PLATFORMS = {
  tiktok: {
    label: "TikTok",
    hosts: ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"],
    chain: [
      ["tiktokio", () => L("tiktok/tiktokio")],
      ["snaptik", () => L("tiktok/snaptik")],
      ["ssstik", () => L("tiktok/ssstik")],
    ],
  },
  instagram: {
    label: "Instagram",
    hosts: ["instagram.com", "instagr.am"],
    chain: [
      ["indown", () => L("instagram/indown")],
      ["snapsave", () => L("instagram/snapsave")],
      ["direct", () => L("instagram/direct")],
    ],
  },
  facebook: {
    label: "Facebook",
    hosts: ["facebook.com", "fb.watch", "fb.com"],
    chain: [["snapsave", () => L("facebook/snapsave")]],
  },
  twitter: {
    label: "X / Twitter",
    hosts: ["twitter.com", "x.com", "t.co"],
    chain: [
      ["tweeload", () => L("twitter/tweeload")],
      ["tvd", () => L("twitter/tvd")],
      ["savetwt", () => L("twitter/savetwt")],
      ["direct", () => L("twitter/direct")],
    ],
  },
  youtube: {
    label: "YouTube",
    hosts: ["youtube.com", "youtu.be", "music.youtube.com"],
    // argumen kedua = format ("mp4" | "mp3")
    chain: [
      ["ytmp3", () => L("youtube/ytmp3"), (o) => [o.format]],
      ["ytmp3gg", () => L("youtube/ytmp3gg"), (o) => [{ format: o.format }]],
    ],
  },
  pinterest: {
    label: "Pinterest",
    hosts: ["pinterest.com", "pin.it", "pinterest.co.uk", "id.pinterest.com"],
    chain: [
      ["pindown", () => L("pinterest/pindown")],
      ["direct", () => L("pinterest/direct")],
    ],
  },
  threads: {
    label: "Threads",
    hosts: ["threads.net", "threads.com"],
    chain: [["threadster", () => L("threads/threadster")]],
  },
  spotify: {
    label: "Spotify",
    hosts: ["open.spotify.com", "spotify.link"],
    chain: [
      ["spotmate", () => L("spotify/spotmate")],
      ["soundloaders", () => L("spotify/soundloaders")],
      ["spotisaver", () => L("spotify/spotisaver")],
      ["spotidown", () => L("spotify/spotidown")],
    ],
  },
  soundcloud: {
    label: "SoundCloud",
    hosts: ["soundcloud.com", "on.soundcloud.com"],
    chain: [["klickaud", () => L("soundcloud/klickaud")]],
  },
  applemusic: {
    label: "Apple Music",
    hosts: ["music.apple.com"],
    chain: [["aplmate", () => L("applemusic/aplmate")]],
  },
  bandcamp: {
    label: "Bandcamp",
    hosts: ["bandcamp.com"],
    chain: [
      ["bandcampdownloader", () => L("bandcamp/bandcampdownloader"), () => [{ quality: "320" }]],
      ["direct", () => L("bandcamp/direct"), () => [{ quality: "320" }]],
    ],
  },
  bilibili: {
    label: "Bilibili",
    hosts: ["bilibili.com", "b23.tv", "bilibili.tv"],
    chain: [["direct", () => L("bilibili/direct")]],
  },
  douyin: {
    label: "Douyin",
    hosts: ["douyin.com", "iesdouyin.com"],
    chain: [["direct", () => L("douyin/direct")]],
  },
  rednote: {
    label: "RedNote",
    hosts: ["xiaohongshu.com", "xhslink.com", "rednote.com"],
    chain: [["direct", () => L("rednote/direct")]],
  },
  reddit: {
    label: "Reddit",
    hosts: ["reddit.com", "redd.it", "old.reddit.com"],
    chain: [["rapidsave", () => L("reddit/rapidsave")]],
  },
  terabox: {
    label: "Terabox",
    hosts: ["terabox.com", "teraboxapp.com", "1024terabox.com", "terabox.app", "4funbox.com"],
    chain: [["sechno", () => L("terabox/sechno")]],
  },
  pixiv: {
    label: "Pixiv",
    hosts: ["pixiv.net"],
    chain: [["ajax", () => L("pixiv/ajax")]],
  },
};

/** Cocokkan hostname (termasuk subdomain) ke platform. */
function detectPlatform(rawUrl) {
  let u;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol)) return null;
  const host = u.hostname.toLowerCase();
  for (const [key, p] of Object.entries(PLATFORMS)) {
    if (p.hosts.some((h) => host === h || host.endsWith("." + h))) {
      return { key, url: u.toString(), platform: p };
    }
  }
  return null;
}

module.exports = { PLATFORMS, detectPlatform };
