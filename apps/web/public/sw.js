const CACHE = "zerpa-offline-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/offline.html"])).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: "window" });
    await Promise.all(windows.map((client) => {
      if (new URL(client.url).pathname === "/offline.html") return client.navigate("/dashboard");
      return undefined;
    }));
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  // Chrome asks for some navigations as only-if-cached. fetch() rejects those, which was opening this page while Zerpa was running.
  if (event.request.cache === "only-if-cached") return;
  event.respondWith((async () => {
    try {
      return await fetch(event.request);
    } catch (error) {
      if (self.navigator.onLine) throw error;
      const cached = await caches.match("/offline.html");
      if (cached) return cached;
      throw error;
    }
  })());
});
