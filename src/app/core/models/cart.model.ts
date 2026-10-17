import { Item } from './item.model';

/**
 * Eine Zeile im In-Memory-Warenkorb (nur im Browser, nicht persistiert).
 *
 * Invariante: `quantity` ≥ 1 (eine Linie mit Menge 0 existiert nicht; beim
 * vollständigen Entfernen wird die Linie entfernt).
 */
export interface CartLine {
  /** Der im Warenkorb liegende Artikel. */
  item: Item;
  /** Menge dieses Artikels im Warenkorb. Invariante: ≥ 1. */
  quantity: number;
}

/**
 * Der gesamte Zustand des In-Memory-Warenkorbs.
 *
 * Der Warenkorb lebt ausschliesslich im Browser (Signal im `CartService`,
 * optional in `localStorage` gespiegelt) und wird erst beim Checkout in eine
 * {@link OrderDraft} bzw. {@link Order} überführt.
 */
export interface CartState {
  /** Alle Warenkorb-Linien. */
  lines: CartLine[];
}
