// ─── SERVICE WORKER — Push Notifications + Offline ───────────────────────────
const CACHE_NAME = 'devops90-v3';
const OFFLINE_ASSETS = ['/', '/index.html', '/js/app.js', '/js/data.js', '/js/state.js', '/js/labs.js', '/js/qbank.js', '/js/ai.js'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache) { return cache.addAll(OFFLINE_ASSETS.map(function(u){ try{return u;}catch(x){return '';}})); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k){ return k!==CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(caches.match(e.request).then(function(cached) {
    return cached || fetch(e.request).catch(function(){ return caches.match('/index.html'); });
  }));
});

// ── PUSH NOTIFICATION HANDLER ─────────────────────────────────────────────────
self.addEventListener('push', function(e) {
  const data = e.data ? e.data.json() : { title:'DevOps Review Due', body:'You have spaced repetition tasks due today!' };
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'devops-review',
    requireInteraction: false,
    actions: [{ action: 'open', title: 'Review Now' }]
  }));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window'}).then(function(cls) {
    if(cls.length){ return cls[0].focus(); }
    return clients.openWindow('/');
  }));
});
