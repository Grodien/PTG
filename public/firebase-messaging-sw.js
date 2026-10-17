/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging – Background Service Worker (PapaToGo)
 *
 * Dieses Skript wird aus dem Hosting-Root unter `/firebase-messaging-sw.js`
 * ausgeliefert (die Datei liegt in `public/` und wird von Angular 1:1 in das
 * Build-Output-Root `dist/ptg/browser` kopiert). Es ist ein klassischer
 * Service-Worker (kein ES-Modul) und nutzt daher das Firebase-Compat-SDK via
 * `importScripts`.
 *
 * Aufgabe: Empfängt Push-Data-Nachrichten (im Hintergrund/geschlossen), zeigt
 * eine System-Benachrichtigung an und öffnet beim Klick direkt die betroffene
 * Bestellung (Deep-Link via `data.url`).
 */

importScripts(
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: 'AIzaSyD2lv2myn6degZKTPsXey-wZV0pP0u_AA8',
  authDomain: 'ptg-papa-to-go.firebaseapp.com',
  projectId: 'ptg-papa-to-go',
  storageBucket: 'ptg-papa-to-go.firebasestorage.app',
  messagingSenderId: '136510299124',
  appId: '1:136510299124:web:b8fe5b29e61f3133cdb7a1',
});

const messaging = firebase.messaging();

// Hintergrund-Nachrichten: Es kommt eine reine `data`-Message. Wir bauen die
// Benachrichtigung selbst und hängen `url`/`orderId` an, damit sie beim Klick
// verfügbar sind.
messaging.onBackgroundMessage((payload) => {
  const data = (payload && payload.data) || {};
  const title = data.title || 'PapaToGo';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    // Gleiche Bestellung nicht doppelt stapeln.
    tag: data.orderId || undefined,
    data: {
      url: data.url || '/admin/bstellige',
      orderId: data.orderId || '',
    },
  };
  return self.registration.showNotification(title, options);
});

// Klick auf die Benachrichtigung: App öffnen bzw. fokussieren und zur
// Bestell-URL navigieren.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/admin/bstellige';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Bereits offenes App-Fenster fokussieren und dorthin navigieren.
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            try {
              await client.navigate(targetUrl);
            } catch (e) {
              // navigate kann bei fremdem Origin/State fehlschlagen – dann
              // bleibt zumindest das Fenster fokussiert.
            }
          }
          return;
        }
      }

      // Sonst neues Fenster öffnen.
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});
