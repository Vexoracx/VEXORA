/** Header CORS untuk API VEXORA (dipakai website, PWA, dan APK/WebView). */
function applyCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Key");
  res.setHeader("Access-Control-Max-Age", "86400");
}
module.exports = { applyCors };
