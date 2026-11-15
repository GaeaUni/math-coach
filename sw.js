// 自动生成，别手改（tools/build-static.mjs）
const VER = 'mc-25480ef9bef1';
const FILES = ["./","content/g1.js","content/g2.js","content/g3.js","content/g4.js","content/g5.js","content/g6.js","content/hanzi/ARPHICPL.TXT","content/hanzi/g1.json","content/hanzi/g2.json","content/hanzi/g3.json","content/hanzi/g4.json","content/hanzi/g5.json","content/hanzi/g6.json","content/hanzi/index.json","content/yw/data/gushi-bihua.js","content/yw/data/gushi-changshi.js","content/yw/data/gushi-jilei.js","content/yw/data/gushi-shi-high.js","content/yw/data/gushi-shi-low.js","content/yw/data/gushi-wenyan.js","content/yw/data/ju-biaodian.js","content/yw/data/ju-bing.js","content/yw/data/ju-guanlian.js","content/yw/data/ju-juzi.js","content/yw/data/ju-xiuci.js","content/yw/data/pinyin-hz.js","content/yw/data/pinyin-syl.js","content/yw/data/pinyin-zi.js","content/yw/data/yuedu-high-1.js","content/yw/data/yuedu-high-2.js","content/yw/data/yuedu-low-1.js","content/yw/data/yuedu-low-2.js","content/yw/data/yuedu-mid-1.js","content/yw/data/yuedu-mid-3.js","content/yw/data/zibiao.js","content/yw/data/ziyin-duoyin.js","content/yw/data/ziyin-tongyin.js","content/yw/data/ziyin-xingjin.js","content/yw/data/ziyin-yin.js","content/yw/data/ziyin-ziyi.js","content/yw/gushi.js","content/yw/index.js","content/yw/ju.js","content/yw/pinyin.js","content/yw/xiezi.js","content/yw/yuedu.js","content/yw/ziyin.js","css/app.css","icon.png","js/ai.js","js/app.js","js/core.js","js/lib.js","js/pad.js","js/rewards.js","js/ui.js","js/vendor/hanzi-writer.LICENSE","js/vendor/hanzi-writer.min.js","js/yw.js","manifest.webmanifest"];
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
