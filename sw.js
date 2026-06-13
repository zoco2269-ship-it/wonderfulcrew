// WonderfulCrew Service Worker — Push + Offline shell cache
const CACHE_NAME = 'wc-en-v3';
const APP_SHELL = [
  '/index-en.html',
  '/curriculum-en.html',
  '/plans-en.html',
  '/leveltest-en.html',
  '/images/logo.png',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/apple-touch-icon.png',
  '/manifest-en.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // 캐시 실패해도 install은 계속 (오프라인 cache는 best-effort)
      return Promise.allSettled(APP_SHELL.map(function(u) {
        return cache.add(new Request(u, { cache: 'reload' })).catch(function(){});
      }));
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; })
        .map(function(k) { return caches.delete(k); }));
    }).then(function() { return clients.claim(); })
  );
});

// Network-first for HTML/API (always fresh), cache-first for static assets
self.addEventListener('fetch', function(event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // Same-origin only
  if (url.origin !== self.location.origin) return;
  // Skip API calls (always live)
  if (url.pathname.startsWith('/api/')) return;

  var isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1;

  if (isHTML) {
    // Network-first: fresh HTML, fall back to cache offline
    event.respondWith(
      fetch(req).then(function(res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(c) { c.put(req, copy); }).catch(function(){});
        return res;
      }).catch(function() { return caches.match(req).then(function(r){ return r || caches.match('/index-en.html'); }); })
    );
    return;
  }

  // Static: cache-first
  if (/\.(png|jpg|jpeg|svg|webp|ico|css|js|woff2?|ttf|otf|json)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(function(cached) {
        if (cached) return cached;
        return fetch(req).then(function(res) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(req, copy); }).catch(function(){});
          return res;
        });
      })
    );
  }
});

// Push notifications (existing functionality)
self.addEventListener('push', function(event) {
  var data = { title: 'WonderfulCrew', body: 'You have a new update.', url: '/' };
  try { data = event.data.json(); } catch(e) {}

  event.waitUntil(
    self.registration.showNotification(data.title || 'WonderfulCrew', {
      body: data.body || '',
      icon: '/images/icon-192.png',
      badge: '/images/badge-72.png',
      data: { url: data.url || '/' },
      tag: data.tag || 'wc-notification',
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].url.indexOf(url) !== -1 && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
