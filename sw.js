// 自动生成，别手改（tools/build-static.mjs）
const VER = 'mc-953b519b40bb';
const FILES = ["./","content/g1.js","content/g2.js","content/g3.js","content/g4.js","content/g5.js","content/g6.js","css/app.css","icon.png","js/ai.js","js/app.js","js/core.js","js/lib.js","js/pad.js","js/rewards.js","js/ui.js","manifest.webmanifest"];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VER).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('mc-') && k !== VER).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(VER);
    const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await c.match('./') : null);
    if (hit) return hit;
    return fetch(req);
  })());
});
