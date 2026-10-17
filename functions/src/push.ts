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

/**
 * Payload-Form für den Push.
 *
 * Es wird bewusst eine reine `data`-Message gebaut (keine `notification`-
 * Sektion): Nur so bekommt der Service Worker beim Klick die `data`-Felder
 * (insb. `orderId`/`url`) zuverlässig, und die Anzeige der Benachrichtigung
 * liegt vollständig im Service Worker (`onBackgroundMessage`).
 */
export interface PushPayload {
  data: {
    title: string;
    body: string;
    orderId: string;
    url: string;
  };
}

/**
 * Baut die Push-Payload für eine neue Bestellung.
 *
 * Titel ist fix; der Body nennt Artikelanzahl und Total und hängt – falls
 * vorhanden – die Notiz der Besucherin an (Req 5.1, 5.2). Zusätzlich wird die
 * Bestell-ID und eine Deep-Link-URL zur betreffenden Bestellung mitgegeben,
 * damit ein Klick auf die Benachrichtigung direkt zu ihr führt.
 *
 * @param order Die neu eingegangene Bestellung.
 * @param orderId Firestore-Dokument-ID der Bestellung.
 * @returns Payload mit `data` (Titel, Body, orderId, url).
 */
export function buildPushPayload(order: Order, orderId: string): PushPayload {
  const title = "Neui Bestellig! 🎁";
  const base = `${order.itemCount} Artikel · ${formatMuentschi(order.total)}`;
  // Notiz nur anhängen, wenn vorhanden (Req 5.2).
  const body = order.note ? `${base}\nNotiz: ${order.note}` : base;
  return {
    data: {
      title,
      body,
      orderId,
      url: `/admin/bstellige/${orderId}`,
    },
  };
}

/**
 * Sendet eine Push-Payload via Firebase Cloud Messaging an ein Gerät.
 *
 * Nutzt das firebase-admin Messaging-SDK; die App-Initialisierung erfolgt im
 * Trigger (Task 14.6). Es wird eine reine `data`-Message gesendet, damit der
 * Service Worker die Anzeige und das Klick-Deep-Linking übernimmt. Wirft bei
 * FCM-Fehlern – der Aufrufer behandelt Push als Best Effort (Req 5.1).
 *
 * @param token FCM-Token des Zielgeräts.
 * @param payload Zuvor gebaute Push-Payload (`buildPushPayload`).
 */
export async function sendPush(
  token: string,
  payload: PushPayload
): Promise<void> {
  await getMessaging().send({
    token,
    data: payload.data,
    // Für iOS/Safari-Web-Push: hohe Priorität, damit die Data-Message
    // zuverlässig zugestellt und vom Service Worker verarbeitet wird.
    webpush: {
      headers: { Urgency: "high" },
      fcmOptions: { link: payload.data.url },
    },
  });
}
