import { computed, Injectable, Signal, signal } from '@angular/core';

import { CartLine, Item, OrderDraft, OrderLine } from '../models';

/**
 * Reiner, in-memory gehaltener Warenkorb-Service auf Basis von Angular Signals.
 *
 * Die gesamte Logik ist bewusst deterministisch und frei von Firebase-
 * Abhängigkeiten, damit sie isoliert und property-basiert getestet werden kann
 * (siehe Design-Properties 5–10). Der Warenkorb lebt ausschliesslich im Browser.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  /** Interner, schreibbarer Zustand: die aktuellen Warenkorb-Linien. */
  private readonly _lines = signal<CartLine[]>([]);

  /** Alle Warenkorb-Linien (nur lesbar). */
  readonly lines: Signal<CartLine[]> = this._lines.asReadonly();

  /** Gesamtsumme in Müntschis: Summe über alle Linien von `item.cost * quantity`. */
  readonly total: Signal<number> = computed(() =>
    this._lines().reduce((sum, line) => sum + line.item.cost * line.quantity, 0),
  );

  /** Gesamtanzahl aller Artikel: Summe aller Mengen. */
  readonly itemCount: Signal<number> = computed(() =>
    this._lines().reduce((count, line) => count + line.quantity, 0),
  );

  /** Checkout ist nur möglich, wenn der Warenkorb mindestens einen Artikel enthält. */
  readonly canCheckout: Signal<boolean> = computed(() => this._lines().length > 0);

  /**
   * Fügt einen Artikel hinzu.
   *
   * Neuer Artikel → neue Linie mit Menge 1; bereits vorhandener Artikel
   * (Abgleich über `item.id`) → Menge um eins erhöhen. Die Reihenfolge der
   * Linien bleibt dabei stabil.
   */
  add(item: Item): void {
    this._lines.update((lines) => {
      const existing = lines.find((line) => line.item.id === item.id);
      if (existing) {
        // Vorhandene Linie: Menge um eins erhöhen (neue Objekte für Immutabilität).
        return lines.map((line) =>
          line.item.id === item.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      // Neuer Artikel: Linie mit Menge 1 anhängen.
      return [...lines, { item, quantity: 1 }];
    });
  }

  /**
   * Entfernt die Linie des angegebenen Artikels vollständig aus dem Warenkorb.
   * Ist der Artikel nicht vorhanden, bleibt der Warenkorb unverändert.
   */
  remove(itemId: string): void {
    this._lines.update((lines) => lines.filter((line) => line.item.id !== itemId));
  }

  /** Leert den Warenkorb vollständig. */
  clear(): void {
    this._lines.set([]);
  }

  /**
   * Erzeugt einen {@link OrderDraft} aus dem aktuellen Warenkorb.
   *
   * Die Bestelllinien werden denormalisiert (Titel und Stückpreis als Snapshot
   * zum aktuellen Zeitpunkt). `total` und `itemCount` entsprechen den
   * abgeleiteten Signalen.
   */
  toOrderDraft(note: string | null): OrderDraft {
    const lines: OrderLine[] = this._lines().map((line) => ({
      itemId: line.item.id,
      title: line.item.title,
      cost: line.item.cost,
      quantity: line.quantity,
    }));

    return {
      lines,
      total: this.total(),
      itemCount: this.itemCount(),
      note,
    };
  }
}
