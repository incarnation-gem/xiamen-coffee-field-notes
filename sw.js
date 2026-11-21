const CACHE_PREFIX = 'xmcf-field-notes-';
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const ENTRY = new URL('./', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(ENTRY)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const canonical = new URL(ENTRY);
  const entryPaths = [canonical.pathname, `${canonical.pathname}index.html`];
  if (event.request.mode !== 'navigate' || url.origin !== canonical.origin || !entryPaths.includes(url.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(ENTRY, response.clone());
      return response;
    } catch {
      return (await cache.match(ENTRY)) || Response.error();
    }
  })());
});
