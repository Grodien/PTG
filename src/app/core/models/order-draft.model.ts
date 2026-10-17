import { OrderLine } from './order.model';

/**
 * Vorstufe einer Bestellung, erzeugt von `CartService.toOrderDraft(note)`.
 *
 * Entspricht der Form einer {@link Order} **vor** der Persistierung, d. h. ohne
 * die vom Backend bzw. Firestore gesetzten Felder `id`, `createdAt`,
 * `pushSent` und `emailSent`. Der `OrderService` ergänzt diese Felder beim
 * Speichern.
 *
 * Invarianten (vom `CartService` sichergestellt):
 * - `total` ist ganzzahlig und ≥ 0 (Summe `cost * quantity` über alle Linien).
 * - `itemCount` ist ganzzahlig und ≥ 1 (Summe aller `quantity`).
 */
export interface OrderDraft {
  /** Alle Bestelllinien (denormalisierter Snapshot). */
  lines: OrderLine[];
  /** Gesamtsumme in Müntschis. Invariante: Integer und ≥ 0. */
  total: number;
  /** Gesamtanzahl aller Artikel (Summe der Mengen). Invariante: Integer und ≥ 1. */
  itemCount: number;
  /** Optionale Notiz der Besucherin; `null`, wenn keine Notiz angegeben wurde. */
  note: string | null;
}
