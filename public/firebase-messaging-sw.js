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
 * Aufgabe: Empfängt Push-Nachrichten, während die App im Hintergrund/geschlossen
 * ist, und zeigt dafür eine System-Benachrichtigung an (Req 5.1, 10.1).
 */

// Firebase Compat-SDK (klassische Skripte, kompatibel mit `importScripts`).
// Version an das installierte `firebase`-Paket (^10.14.1) angelehnt.
importScripts(
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js'
);

// Öffentliche Firebase-Konfiguration.
//
// TODO: Platzhalter — mit den echten Werten des Firebase-Projekts ersetzen
// (siehe Tasks 11.1 / Deploy). Die Felder müssen mit `firebaseConfig` in
// `src/app/app.config.ts` übereinstimmen.
firebase.initializeApp({
  apiKey: 'TODO_API_KEY',
  authDomain: 'TODO.firebaseapp.com',
  projectId: 'TODO_PROJECT_ID',
  storageBucket: 'TODO.appspot.com',
  messagingSenderId: 'TODO_SENDER_ID',
  appId: 'TODO_APP_ID',
});

const messaging = firebase.messaging();

// Hintergrund-Nachrichten: Benachrichtigung mit Titel + Text aus der Payload
// anzeigen.
messaging.onBackgroundMessage((payload) => {
  const notification = (payload && payload.notification) || {};
  const data = (payload && payload.data) || {};

  const title = notification.title || data.title || 'PapaToGo';
  const options = {
    body: notification.body || data.body || '',
    icon: notification.icon || '/favicon.ico',
    data: data,
  };

  return self.registration.showNotification(title, options);
});

// Klick auf die Benachrichtigung: App in den Vordergrund holen bzw. öffnen.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
        return undefined;
      })
  );
});
