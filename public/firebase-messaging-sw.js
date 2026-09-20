// Load Firebase compat libraries for service worker
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Immediate activation for new service worker versions
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Default config matching active Firebase project
try {
  firebase.initializeApp({
    apiKey: 'AIzaSyBKDSH1WeCu3M2y134Z9mAtkqA8YKPqxXA',
    authDomain: 'testflutterfirebase-26e7c.firebaseapp.com',
    projectId: 'testflutterfirebase-26e7c',
    storageBucket: 'testflutterfirebase-26e7c.firebasestorage.app',
    messagingSenderId: '1043117609248',
    appId: '1:1043117609248:web:78aa5b0f4905b4fcfb8745',
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || 'Cyber Apple Store';
    const options = {
      body: payload.notification?.body || payload.data?.body || '',
      icon: payload.notification?.icon || '/icon-192.png',
      badge: '/apple-touch-icon.png',
      data: payload.data || {},
      vibrate: [100, 50, 100],
    };

    return self.registration.showNotification(title, options);
  });
} catch (e) {
  // Service worker initialization fallback
}

// Fallback native push event listener (catches standard push / VAPID payloads)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || payload.notification?.title || 'Cyber Apple Store';
    const options = {
      body: payload.body || payload.notification?.body || '',
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/apple-touch-icon.png',
      data: payload.data || {},
      vibrate: [100, 50, 100],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    // If text payload
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Cyber Apple Store', {
        body: text,
        icon: '/icon-192.png',
      })
    );
  }
});

// Handle notification click: focus existing window or open target link
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.link || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
