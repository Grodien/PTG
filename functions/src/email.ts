/**
 * E-Mail einer neuen Bestellung: reiner Body-Builder + SMTP-Versand.
 *
 * `buildEmailBody` bleibt rein und seiteneffektfrei und kann isoliert
 * property-basiert getestet werden (Design: Property 14/15). Der eigentliche
 * SMTP-/Nodemailer-Versand erfolgt separat in `sendEmail` (Task 14.5).
 */

import * as nodemailer from "nodemailer";

import { formatMuentschi } from "./currency";
import { Order } from "./types";

/** Fixe Empfängeradresse für Bestell-Benachrichtigungen (Req 6.1). */
const EMAIL_RECIPIENT = "thomas.bomatter@bluewin.ch";

/** Betreff + Klartext-Body einer Bestell-E-Mail. */
export interface EmailBody {
  subject: string;
  text: string;
}

/**
 * Baut Betreff und Klartext-Body für eine neue Bestellung.
 *
 * Der Text listet jede Bestelllinie als `- {quantity}× {title} ({cost})` auf,
 * nennt das Total und hängt – falls vorhanden – die Notiz an (Req 6.1).
 *
 * @param order Die neu eingegangene Bestellung.
 * @returns Objekt mit `subject` und `text`.
 */
export function buildEmailBody(order: Order): EmailBody {
  const lines = order.lines
    .map((l) => `- ${l.quantity}× ${l.title} (${formatMuentschi(l.cost)})`)
    .join("\n");
  const text =
    `${lines}\n\nTotal: ${formatMuentschi(order.total)}` +
    // Notiz nur anhängen, wenn vorhanden (Req 6.1).
    (order.note ? `\n\nNotiz: ${order.note}` : "");
  return { subject: "PapaToGo — neui Bestellig", text };
}

/**
 * Versendet den gebauten E-Mail-Body via SMTP (Nodemailer).
 *
 * SMTP-Zugangsdaten werden aus den Umgebungsvariablen gelesen
 * (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`). Diese sind als
 * Firebase-Functions-Secrets hinterlegt und werden in Task 14.6 via `secrets`
 * an die Function gebunden – niemals im Code hartcodiert.
 *
 * Fehlen Werte oder scheitert der Versand, wirft die Funktion; der Trigger
 * behandelt die E-Mail als Best Effort und fängt/loggt (Req 6.2, Task 14.6).
 *
 * @param body Zuvor gebauter E-Mail-Body (`buildEmailBody`).
 */
export async function sendEmail(body: EmailBody): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const transport = nodemailer.createTransport({
    host,
    port,
    // Implizites TLS für den klassischen SMTPS-Port 465, sonst STARTTLS.
    secure: port === 465,
    auth: { user, pass },
  });

  await transport.sendMail({
    from: user,
    to: EMAIL_RECIPIENT,
    subject: body.subject,
    text: body.text,
  });
}
