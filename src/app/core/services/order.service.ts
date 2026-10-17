import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  serverTimestamp,
} from '@angular/fire/firestore';

import { OrderDraft } from '../models';

/**
 * Persistiert Bestellungen in der Firestore-Collection `orders`.
 *
 * Nutzt die modulare AngularFire-API. Der Service ergänzt den vom
 * {@link CartService} erzeugten {@link OrderDraft} um das vom Server gesetzte
 * Feld `createdAt`. Die Felder `pushSent`/`emailSent` werden bewusst **nicht**
 * gesetzt – diese schreibt ausschliesslich die Cloud Function (Admin SDK).
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly firestore = inject(Firestore);

  /** Referenz auf die `orders`-Collection. */
  private readonly ordersRef = collection(this.firestore, 'orders');

  /**
   * Speichert eine Bestellung aus dem übergebenen {@link OrderDraft}.
   *
   * Das persistierte Dokument entspricht der von den Security-Rules
   * (`isValidOrder`) erwarteten Form: `total` (Integer ≥ 0), `itemCount`
   * (Integer ≥ 1), `lines` (Liste) sowie `note` (`string | null`, unverändert
   * durchgereicht). `createdAt` wird serverseitig gesetzt.
   *
   * @returns Die ID des neu angelegten Bestell-Dokuments.
   * @throws Lehnt bei einem Firestore-Fehler ab (z. B. verweigerte Rechte oder
   *   Netzwerkfehler). Fehler werden nicht verschluckt, damit die
   *   Checkout-Komponente den Fehlerfall behandeln kann (Req 4.6).
   */
  async create(draft: OrderDraft): Promise<string> {
    const ref = await addDoc(this.ordersRef, {
      lines: draft.lines,
      total: draft.total,
      itemCount: draft.itemCount,
      note: draft.note,
      createdAt: serverTimestamp(),
    });

    return ref.id;
  }
}
