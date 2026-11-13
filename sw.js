/* Service worker de Polo A: app instalable, funcionamiento sin conexión y notificaciones push */
const CACHE = 'polo-a-v16';
const SHELL = ['/', '/index.html', '/styles.css', '/app.js', '/config.js', '/club-config.js', '/report-doc.js', '/access.js', '/club.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/badge-96.png', '/img/ball.webp', '/img/escudo.webp', '/img/escudo-sm.webp', '/img/court.jpg', '/img/felt.jpg', '/img/fuzz.webp'];

// Notificaciones (Firebase Cloud Messaging)
try {
  self.window = self;               // config.js escribe en window.POLO_CONFIG
  importScripts('/config.js');
  const cfg = self.POLO_CONFIG && self.POLO_CONFIG.firebase;
  if (cfg && cfg.apiKey) {
    importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
                  'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
    firebase.initializeApp(cfg);
    firebase.messaging().onBackgroundMessage(p => {
      const d = (p && p.data) || {};
      return self.registration.showNotification(d.title || 'Polo A', {
        body: d.body || '', icon: '/icons/icon-192.png', badge: '/icons/badge-96.png',
        tag: d.tag || undefined, renotify: !!d.tag, data: { url: d.url || '/' }
      });
    });
  }
} catch (e) { /* sin configuración: la app funciona igual, sin push */ }

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) { c.navigate(url).catch(() => {}); return c.focus(); } }
    return clients.openWindow(url);
  }));
});

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
// Red primero (siempre la última versión); si no hay conexión, la copia guardada
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('/index.html'))));
});
