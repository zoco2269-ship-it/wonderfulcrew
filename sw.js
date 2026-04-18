// WonderfulCrew Service Worker - Web Push
self.addEventListener('push', function(event) {
  var data = { title: 'WonderfulCrew', body: '새로운 소식이 있습니다.', url: '/' };
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

self.addEventListener('install', function(event) { self.skipWaiting(); });
self.addEventListener('activate', function(event) { event.waitUntil(clients.claim()); });
