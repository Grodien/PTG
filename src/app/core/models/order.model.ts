import { Timestamp } from '@angular/fire/firestore';

/**
 * Eine einzelne Bestelllinie innerhalb einer Bestellung.
 *
 * Bestelllinien werden **denormalisiert** gespeichert (Titel und Stückpreis als
 * Snapshot zum Bestellzeitpunkt), damit eine Bestellung auch nach Änderung oder
 * Löschung eines Artikels nachvollziehbar bleibt.
 */
export interface OrderLine {
  /** Referenz auf den bestellten Artikel (`items/{id}`). */
  itemId: string;
  /** Denormalisierter Titel (Snapshot zum Bestellzeitpunkt). */
  title: string;
  /** Stückpreis in Müntschis zum Bestellzeitpunkt. Invariante: Integer und ≥ 0. */
  cost: number;
  /** Bestellte Menge. Invariante: ≥ 1. */
  quantity: number;
}

/**
 * Eine persistierte Bestellung (Firestore-Collection `orders/{orderId}`).
 *
 * Invarianten:
 * - `total` ist ganzzahlig und ≥ 0 (Summe `cost * quantity` über alle Linien).
 * - `itemCount` ist ganzzahlig und ≥ 1 (Summe aller `quantity`).
 */
export interface Order {
  /** Firestore-Dokument-ID. */
  id: string;
  /** Alle Bestelllinien dieser Bestellung. */
  lines: OrderLine[];
  /** Gesamtsumme in Müntschis. Invariante: Integer und ≥ 0. */
  total: number;
  /** Gesamtanzahl aller Artikel (Summe der Mengen). Invariante: Integer und ≥ 1. */
  itemCount: number;
  /** Optionale Notiz der Besucherin; `null`, wenn keine Notiz angegeben wurde. */
  note: string | null;
  /** Zeitpunkt der Erstellung (Firestore-Timestamp). */
  createdAt: Timestamp;
  /** Vom Backend gesetzter Best-Effort-Status: Push wurde verschickt. */
  pushSent?: boolean;
  /** Vom Backend gesetzter Best-Effort-Status: E-Mail wurde verschickt. */
  emailSent?: boolean;
}
