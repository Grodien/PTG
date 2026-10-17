import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  orderBy,
  query,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { Order, OrderDraft } from '../models';

/**
 * Persistiert und liest Bestellungen in der Firestore-Collection `orders`.
 *
 * Nutzt die modulare AngularFire-API. Beim Anlegen ergänzt der Service den vom
 * {@link CartService} erzeugten {@link OrderDraft} um das vom Server gesetzte
 * Feld `createdAt`. Die Felder `pushSent`/`emailSent` werden bewusst **nicht**
 * hier gesetzt – diese schreibt ausschliesslich die Cloud Function (Admin SDK).
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly firestore = inject(Firestore);

  /** Referenz auf die `orders`-Collection. */
  private readonly ordersRef = collection(this.firestore, 'orders');

  /**
   * Live-Stream aller Bestellungen, neueste zuerst (`createdAt` absteigend).
   *
   * Nur der Administrator darf gemäss den Security Rules lesen; die Admin-
   * Bestellübersicht konsumiert diesen Stream.
   */
  readonly orders$: Observable<Order[]> = collectionData(
    query(this.ordersRef, orderBy('createdAt', 'desc')),
    { idField: 'id' },
  ) as Observable<Order[]>;

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
