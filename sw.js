'use strict';
const VERSION = '20261010-054400';
const SCOPE = self.registration.scope;
const PREFIX = 'kyowa-drawing-iphone:' + SCOPE + ':';
const CACHE = PREFIX + VERSION;
const INDEX = new URL('index.html', SCOPE).href;
const MANIFEST = new URL('manifest.json', SCOPE).href;
const ICONS = ['icon-180.png', 'icon-192.png', 'icon-512.png'].map(path => new URL(path, SCOPE).href);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const response = await fetch(INDEX, { cache: 'reload' });
    if (!response.ok) throw new Error('index.html could not be loaded');
    await cache.put(INDEX, response);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const root = new URL(SCOPE);
  if (url.origin !== root.origin) return;
  const isIndex = request.mode === 'navigate' &&
    (url.pathname === root.pathname || url.pathname === new URL(INDEX).pathname);
  const resource = url.origin + url.pathname;
  if (!isIndex && resource !== MANIFEST && !ICONS.includes(resource)) return;
  const key = isIndex ? INDEX : resource;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request, { cache: 'no-store' });
      if (response.ok) {
        try { await cache.put(key, response.clone()); } catch (_) {}
        return response;
      }
      const saved = await cache.match(key);
      return saved || response;
    } catch (error) {
      const saved = await cache.match(key);
      if (saved) return saved;
      throw error;
    }
  })());
});
