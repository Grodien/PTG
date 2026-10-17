/**
 * Firestore-`onCreate`-Trigger für neue Bestellungen (Firebase Functions 2nd gen).
 *
 * Bei jedem neu angelegten Dokument unter `orders/{orderId}` werden zwei
 * Best-Effort-Aktionen ausgelöst (Design: "Trigger: onOrderCreated"):
 *
 *   1. Push-Benachrichtigung an das registrierte Admin-Token via FCM
 *      (Req 5.1, 5.2). Fehlt das Token, bleibt die Bestellung gültig und es
 *      passiert nichts (Req 5.3).
 *   2. Best-Effort-E-Mail via Nodemailer/SMTP (Req 6.1, 6.2).
 *
 * Beide Aktionen sind "Best Effort": der Checkout gilt unabhängig vom Erfolg
 * als abgeschlossen. Fehler werden ausschliesslich geloggt, niemals geworfen.
 * Die Status-Felder `pushSent`/`emailSent` werden hier über das Admin SDK
 * gesetzt (Req 5.1, 6.1).
 */

import { getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

import { buildEmailBody, sendEmail } from "./email";
import { buildPushPayload, sendPush } from "./push";
import { Order } from "./types";

// SMTP-Zugangsdaten als Firebase-Functions-Secrets – nie im Code hartcodiert.
// Die Bindung über die `secrets`-Option stellt sie zur Laufzeit als
// `process.env.SMTP_*` bereit (wird von `sendEmail` gelesen).
const SMTP_HOST = defineSecret("SMTP_HOST");
const SMTP_PORT = defineSecret("SMTP_PORT");
const SMTP_USER = defineSecret("SMTP_USER");
const SMTP_PASS = defineSecret("SMTP_PASS");

/**
 * Trigger: feuert bei jeder neu angelegten Bestellung unter `orders/{orderId}`.
 *
 * Push und E-Mail laufen jeweils in einem eigenen try/catch; ein Fehler in der
 * einen Aktion beeinträchtigt die andere nicht und lässt den Trigger nicht
 * scheitern.
 */
export const onOrderCreated = onDocumentCreated(
  {
    document: "orders/{orderId}",
    region: "europe-west1",
    secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      // Kein Dokument-Snapshot vorhanden – nichts zu tun.
      return;
    }

    const order = snapshot.data() as Order;
    const db = getFirestore();

    // 1) Push (Best Effort) – Req 5.1, 5.2, 5.3
    try {
      const tokenDoc = await db.doc("pushTokens/admin").get();
      const token = tokenDoc.exists ? (tokenDoc.get("token") as string) : null;
      if (token) {
        await sendPush(token, buildPushPayload(order, event.params.orderId));
        await snapshot.ref.update({ pushSent: true });
      }
      // Kein Token -> nichts tun, Bestellung bleibt gültig (Req 5.3).
    } catch (e) {
      logger.error("Push fehlgeschlagen", e); // Best Effort
    }

    // 2) E-Mail (Best Effort) – Req 6.1, 6.2
    try {
      await sendEmail(buildEmailBody(order));
      await snapshot.ref.update({ emailSent: true });
    } catch (e) {
      logger.error("E-Mail fehlgeschlagen", e); // Req 6.2
    }
  }
);
