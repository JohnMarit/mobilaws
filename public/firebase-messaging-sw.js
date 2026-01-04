importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

let messaging;
let initialized = false;

function initMessaging(config) {
  if (initialized) return;
  if (!config) return;
  firebase.initializeApp(config);
  messaging = firebase.messaging();
  initialized = true;

  messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification || {};
    const title = notification.title || 'Learning reminder';
    const body = notification.body || 'Time for today’s lesson.';
    const data = payload.data || {};

    self.registration.showNotification(title, {
      body,
      data,
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      vibrate: [100, 50, 100],
      tag: 'learning-daily-reminder',
    });

    // Notify all open clients so foreground tabs can ring immediately
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: 'NEW_COUNSEL_REQUEST',
          data,
        });
      });
    });
  });
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_FIREBASE_MESSAGING') {
    initMessaging(event.data.config);
  }
});

self.addEventListener('notificationclick', (event) => {
  const targetUrl = event.notification?.data?.click_action || event.notification?.data?.url || '/';
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return null;
    }),
  );
});

