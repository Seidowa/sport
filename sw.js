// Incrémente VERSION à chaque mise à jour de l'appli pour forcer le rafraîchissement du cache
const VERSION = 'v14';
const CACHE = 'stat-tracker-' + VERSION;
const CORE = ['./', './index.html', './manifest.webmanifest', './premium.css', './icons/splash.jpg', './icons/logo.png', './icons/dash-head.jpg', './icons/avatar.jpg', './icons/motiv.jpg', './icons/banner.jpg', './icons/ranks/bronze.png', './icons/ranks/argent.png', './icons/ranks/or.png', './icons/ranks/platine.png', './icons/ranks/diamant.png', './icons/ranks/champion.png', './icons/ranks/grandchampion.png', './icons/ranks/ssl.png', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Polices Google : cache au fil de l'eau (fonctionne ensuite hors-ligne)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE).then(async c => {
        const hit = await c.match(req);
        const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Pages : réseau d'abord, repli sur le cache (toujours à jour si connecté)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Le reste : cache d'abord
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r;
  })));
});
