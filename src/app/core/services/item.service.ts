import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { Item } from '../models';

/** Name der Firestore-Collection für Artikel. */
const ITEMS_COLLECTION = 'items';

/** Maximale Anzahl Operationen pro Firestore-`writeBatch`. */
const BATCH_LIMIT = 500;

/** Eingabedaten zum Anlegen eines neuen Artikels. */
export interface ItemCreateInput {
  /** Referenz auf die zugehörige Kategorie (`categories/{id}`). */
  categoryId: string;
  /** Pflichtfeld: Titel des Artikels. */
  title: string;
  /** Optionale Beschreibung; Default "". */
  description?: string;
  /** Stückpreis in Müntschis. Invariante: Integer und ≥ 0. */
  cost: number;
}

/**
 * Firestore-Daten-Service für Artikel (`items/{itemId}`).
 *
 * Kapselt die CRUD-Operationen sowie die Abfrage nach `categoryId` über die
 * modulare AngularFire-API. Die Methoden sind bewusst schlank und von
 * Komponentenlogik entkoppelt, damit sie gegen den Firestore-Emulator
 * property-basiert getestet werden können (siehe Design-Properties 2, 18, 19).
 */
@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly firestore = inject(Firestore);

  /** Referenz auf die `items`-Collection. */
  private readonly itemsRef = collection(this.firestore, ITEMS_COLLECTION);

  /**
   * Liefert alle Artikel einer Kategorie als Live-Stream.
   *
   * Filtert über `where('categoryId', '==', categoryId)`; die Dokument-ID wird
   * als Feld `id` auf das {@link Item}-Objekt gemappt.
   */
  itemsByCategory(categoryId: string): Observable<Item[]> {
    const categoryQuery = query(
      this.itemsRef,
      where('categoryId', '==', categoryId),
    );
    return collectionData(categoryQuery, { idField: 'id' }) as Observable<Item[]>;
  }

  /**
   * Legt einen neuen Artikel an.
   *
   * Setzt `createdAt` serverseitig (`serverTimestamp()`) und füllt eine fehlende
   * Beschreibung mit "" auf. Gibt die neu vergebene Dokument-ID zurück.
   */
  async create(item: ItemCreateInput): Promise<string> {
    const ref = await addDoc(this.itemsRef, {
      categoryId: item.categoryId,
      title: item.title,
      description: item.description ?? '',
      cost: item.cost,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  /**
   * Aktualisiert die angegebenen Felder eines Artikels.
   *
   * `id` und `createdAt` sollten nicht via `patch` geändert werden; der Aufrufer
   * übergibt nur die zu ändernden Attribute (z. B. `title`, `description`, `cost`).
   */
  update(id: string, patch: Partial<Item>): Promise<void> {
    const ref = doc(this.firestore, ITEMS_COLLECTION, id);
    return updateDoc(ref, patch);
  }

  /** Löscht den Artikel mit der angegebenen ID. */
  delete(id: string): Promise<void> {
    const ref = doc(this.firestore, ITEMS_COLLECTION, id);
    return deleteDoc(ref);
  }

  /**
   * Kaskaden-Löschung: entfernt alle Artikel einer Kategorie.
   *
   * Wird beim Löschen einer Kategorie (Req 8.4) verwendet, damit keine
   * verwaisten Artikel zurückbleiben. Da ein `writeBatch` auf
   * {@link BATCH_LIMIT} Operationen begrenzt ist, werden die Löschungen in
   * entsprechende Blöcke aufgeteilt und nacheinander committet.
   */
  async deleteByCategory(categoryId: string): Promise<void> {
    const categoryQuery = query(
      this.itemsRef,
      where('categoryId', '==', categoryId),
    );
    const snapshot = await getDocs(categoryQuery);
    const refs = snapshot.docs.map((d) => d.ref);

    for (let start = 0; start < refs.length; start += BATCH_LIMIT) {
      const chunk = refs.slice(start, start + BATCH_LIMIT);
      const batch = writeBatch(this.firestore);
      for (const ref of chunk) {
        batch.delete(ref);
      }
      await batch.commit();
    }
  }
}
