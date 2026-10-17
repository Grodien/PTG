import { Timestamp } from '@angular/fire/firestore';

/**
 * Das FCM-Token des Administrator-Geräts
 * (einzelnes Firestore-Dokument `pushTokens/admin`).
 *
 * Es genügt ein einzelnes, fest benanntes Dokument (`admin`), da nur ein
 * Administrator-Gerät registriert wird. Eine erneute Registrierung
 * überschreibt das Token.
 */
export interface PushTokenDoc {
  /** Aktuelles FCM-Token des Admin-Geräts. */
  token: string;
  /** Zeitpunkt der letzten Aktualisierung (Firestore-Timestamp). */
  updatedAt: Timestamp;
}
