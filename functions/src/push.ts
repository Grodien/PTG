/**
 * Push-Nachricht (FCM) einer neuen Bestellung: reiner Builder + Versand.
 *
 * `buildPushPayload` bleibt rein und seiteneffektfrei und kann isoliert
 * property-basiert getestet werden (Design: Property 13). Der eigentliche
 * FCM-Versand erfolgt separat in `sendPush` (Task 14.5).
 */

import { getMessaging } from "firebase-admin/messaging";

import { formatMuentschi } from "./currency";
import { Order } from "./types";

/** Minimale Payload-Form (entspricht dem `notification`-Teil einer FCM-Message). */
export interface PushPayload {
  notification: {
    title: string;
    body: string;
  };
}

/**
 * Baut die Push-Payload für eine neue Bestellung.
 *
 * Titel ist fix; der Body nennt Artikelanzahl und Total und hängt – falls
 * vorhanden – die Notiz der Besucherin an (Req 5.1, 5.2).
 *
 * @param order Die neu eingegangene Bestellung.
 * @returns Payload mit `notification.title` und `notification.body`.
 */
export function buildPushPayload(order: Order): PushPayload {
  const title = "Neui Bestellig! 🎁";
  const base = `${order.itemCount} Artikel · ${formatMuentschi(order.total)}`;
  // Notiz nur anhängen, wenn vorhanden (Req 5.2).
  const body = order.note ? `${base}\nNotiz: ${order.note}` : base;
  return { notification: { title, body } };
}

/**
 * Sendet eine Push-Payload via Firebase Cloud Messaging an ein Gerät.
 *
 * Nutzt das firebase-admin Messaging-SDK; die App-Initialisierung erfolgt im
 * Trigger (Task 14.6). Wirft bei FCM-Fehlern – der Aufrufer behandelt Push als
 * Best Effort und fängt/loggt entsprechend (Req 5.1).
 *
 * @param token FCM-Token des Zielgeräts.
 * @param payload Zuvor gebaute Push-Payload (`buildPushPayload`).
 */
export async function sendPush(
  token: string,
  payload: PushPayload
): Promise<void> {
  await getMessaging().send({ token, notification: payload.notification });
}
