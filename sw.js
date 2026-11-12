// Offline support: keep the app and its fonts on the phone.
const CACHE = "boa-judo-v6";
const CORE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isPage = req.mode === "navigate";
  const isFont = url.host.includes("fonts.googleapis.com") || url.host.includes("fonts.gstatic.com");
  if (isPage) {
    // Network first so updates arrive; fall back to the saved copy offline.
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put("./index.html", c)); return r; })
      .catch(() => caches.match("./index.html")));
  } else if (url.origin === location.origin || isFont) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })));
  }
});
