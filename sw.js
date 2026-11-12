/* 한밤의 사건 파일 — 오프라인 저장(서비스 워커)
   한 번 접속하면 게임 파일을 휴대폰에 저장해 두고, 데이터가 없어도 저장된 파일로 연다. */
const CACHE = "midnight-v1";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  /* 게임 파일: 인터넷이 되면 새 버전을 받고, 안 되면 저장된 것으로 */
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
    return;
  }
  /* 글꼴: 한 번 받은 건 저장해 두고 다시 쓴다 (없으면 기기 글꼴로 보인다) */
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; }).catch(() => new Response("", { status: 200, headers: { "Content-Type": "text/css" } }))));
  }
});
