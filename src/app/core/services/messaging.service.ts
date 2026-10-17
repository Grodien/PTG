import { Injectable, inject } from '@angular/core';
import { Firestore, doc, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { Messaging, getToken, isSupported } from '@angular/fire/messaging';

/**
 * VAPID-Public-Key (Web-Push) des Firebase-Projekts.
 *
 * TODO: PLATZHALTER — mit dem echten VAPID-Key aus der Firebase Console
 * ersetzen (Project Settings → Cloud Messaging → Web Push certificates →
 * "Key pair"). Wird erst beim Deployment / in Task 11.1 mit dem realen Wert
 * befüllt, sobald das Firebase-Projekt existiert. Ohne gültigen Key schlägt
 * `getToken` zur Laufzeit fehl; der Build ist davon nicht betroffen.
 */
const VAPID_KEY = 'TODO_VAPID_KEY';

/**
 * Pfad des einzelnen, fest benannten Push-Token-Dokuments des Admin-Geräts.
 * Eine erneute Registrierung überschreibt das Token (siehe Design).
 */
const PUSH_TOKEN_DOC = 'pushTokens/admin';

/**
 * Pfad des im Hosting-Root ausgelieferten Service-Workers für Background-Push.
 */
const SERVICE_WORKER_PATH = 'firebase-messaging-sw.js';

/**
 * Ergebnis einer Geräte-Registrierung:
 * - `granted`: Berechtigung erteilt und FCM-Token gespeichert (Req 10.1, 10.2).
 * - `denied`: Berechtigung verweigert, kein Token gespeichert (Req 10.3).
 * - `unsupported`: Dieser Browser/dieses Gerät unterstützt Web-Push nicht.
 */
export type RegistrationResult = 'granted' | 'denied' | 'unsupported';

/**
 * Registriert das Administrator-Gerät für Push-Benachrichtigungen (Req 10).
 *
 * Kapselt den Web-Push-Flow aus dem Design ("Registrierung"):
 * Service-Worker registrieren → Notification-Permission anfragen → bei
 * Erteilung ein FCM-Token holen und in `pushTokens/admin` speichern.
 *
 * Standalone, `providedIn: 'root'`.
 */
@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly messaging = inject(Messaging);
  private readonly firestore = inject(Firestore);

  /**
   * Registriert den Service-Worker, fragt die Notification-Berechtigung an und
   * speichert bei Erteilung das FCM-Token in Firestore.
   *
   * Ablauf:
   * 1. Prüft, ob Web-Push in diesem Browser überhaupt unterstützt wird. Wenn
   *    nicht → `'unsupported'` (es wird nichts registriert oder gespeichert).
   * 2. Registriert den Service-Worker (`firebase-messaging-sw.js`).
   * 3. Fragt die Notification-Berechtigung an. Bei Ablehnung → `'denied'` und
   *    es wird **kein** Token angefordert oder gespeichert (Req 10.3).
   * 4. Bei Erteilung wird via {@link getToken} das FCM-Token geholt und in
   *    `pushTokens/admin` als `{ token, updatedAt: serverTimestamp() }`
   *    gespeichert (Req 10.1, 10.2) → `'granted'`.
   *
   * @returns `'granted' | 'denied' | 'unsupported'` je nach Ausgang.
   * @throws Lehnt ab, wenn das Holen des Tokens oder das Speichern fehlschlägt;
   *   die aufrufende Komponente behandelt den Fehlerfall.
   */
  async registerDevice(): Promise<RegistrationResult> {
    // 1) Unterstützung prüfen – FCM-Web-Push verlangt Service-Worker,
    // Notification-API und Push-API.
    const supported = await isSupported().catch(() => false);
    if (
      !supported ||
      typeof Notification === 'undefined' ||
      !('serviceWorker' in navigator)
    ) {
      return 'unsupported';
    }

    // 2) Service-Worker registrieren (aus dem Hosting-Root ausgeliefert).
    const serviceWorkerRegistration =
      await navigator.serviceWorker.register(SERVICE_WORKER_PATH);

    // 3) Berechtigung anfragen. Ohne Bewilligung kein Token (Req 10.3).
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return 'denied';
    }

    // 4) FCM-Token holen und in Firestore speichern (Req 10.1, 10.2).
    const token = await getToken(this.messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration,
    });

    await setDoc(doc(this.firestore, PUSH_TOKEN_DOC), {
      token,
      updatedAt: serverTimestamp(),
    });

    return 'granted';
  }
}
