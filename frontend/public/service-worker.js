/* VAANI service worker — offline-first with network-first freshness.
   Caches the app shell + previously accessed knowledge, schemes, FAQs and
   conversations so a kiosk keeps working with no internet. */
const CACHE = "vaani-v1";
const API_GET = /\/api\/(knowledge|conversations|system\/status|hardware|documents|bookmarks)/;

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Never intercept SSE streams / dev sockets.
  if (url.pathname.includes("/chat/stream") || url.pathname.includes("/documents/") && url.pathname.endsWith("/ask")) return;
  if (url.pathname.startsWith("/ws") || url.pathname.includes("sockjs") || url.pathname.includes("hot-update")) return;

  const cacheable = request.mode === "navigate" ||
    API_GET.test(url.pathname) ||
    /\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ttf)$/.test(url.pathname);
  if (!cacheable) return;

  // Network-first: fresh when online, cached when offline.
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") return caches.match("/");
        return new Response(JSON.stringify({ offline: true }), { headers: { "Content-Type": "application/json" }, status: 503 });
      })
  );
});
