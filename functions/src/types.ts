/**
 * Datenmodell der Bestellungen auf der Functions-Seite.
 *
 * Bewusst eigenständig gehalten (keine Abhängigkeit auf die Angular-Modelle),
 * da das Functions-Projekt ein separates TS-Projekt ist. Es werden nur die
 * Felder abgebildet, welche die reinen Builder (`buildPushPayload`,
 * `buildEmailBody`) benötigen.
 */

/** Eine denormalisierte Bestelllinie (Snapshot zum Bestellzeitpunkt). */
export interface OrderLine {
  itemId: string;
  title: string;
  cost: number; // Stückpreis in Müntschis
  quantity: number; // >= 1
}

/** Eine gespeicherte Bestellung. */
export interface Order {
  lines: OrderLine[];
  total: number; // Summe cost*quantity in Müntschis
  itemCount: number; // Summe aller quantities
  note: string | null; // optionale Notiz der Besucherin
}
