import { inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  addDoc,
  collection,
  collectionData,
  CollectionReference,
  deleteDoc,
  doc,
  Firestore,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { Category } from '../models';

/** Name der Firestore-Collection für Kategorien. */
const CATEGORIES_COLLECTION = 'categories';

/**
 * Firestore-Daten-Service für Kategorien (`categories/{categoryId}`).
 *
 * Kapselt sämtlichen CRUD-Zugriff über die modulare AngularFire-API und ist
 * bewusst schlank/entkoppelt gehalten, damit der CRUD-Round-Trip-Property-Test
 * (siehe Task 6.2, Firestore-Emulator) den Service isoliert ausüben kann.
 */
@Injectable({ providedIn: 'root' })
export class CategoryService {
  /** Injizierte Firestore-Instanz (modulare API). */
  private readonly firestore = inject(Firestore);

  /** Typisierte Referenz auf die `categories`-Collection. */
  private readonly categoriesRef = collection(
    this.firestore,
    CATEGORIES_COLLECTION,
  ) as CollectionReference<Category>;

  /**
   * Alle Kategorien als Observable, sortiert nach `order` (aufsteigend) und
   * danach nach `name`. Die Dokument-ID wird als Feld `id` eingemischt und auf
   * das {@link Category}-Modell abgebildet.
   */
  readonly categories$: Observable<Category[]> = collectionData(
    query(this.categoriesRef, orderBy('order'), orderBy('name')),
    { idField: 'id' },
  ) as Observable<Category[]>;

  /** Bequeme Signal-Variante der Kategorien (leeres Array als Startwert). */
  readonly categories: Signal<Category[]> = toSignal(this.categories$, {
    initialValue: [],
  });

  /**
   * Legt eine neue Kategorie an.
   *
   * `createdAt` wird serverseitig gesetzt; `order` wird mit `Date.now()` als
   * sinnvolle, monoton steigende Default-Reihenfolge vorbelegt, sodass neue
   * Kategorien standardmässig hinten einsortiert werden.
   *
   * @param name Anzeigename der Kategorie.
   * @returns Die ID des neu erstellten Dokuments.
   */
  async create(name: string, icon?: string): Promise<string> {
    const ref = await addDoc(this.categoriesRef, {
      name,
      icon: icon?.trim() || '',
      order: Date.now(),
      createdAt: serverTimestamp(),
    } as Partial<Category>);
    return ref.id;
  }

  /**
   * Aktualisiert Name und optionales Icon einer bestehenden Kategorie.
   *
   * @param id Dokument-ID der Kategorie.
   * @param changes Zu ändernde Felder (`name` und/oder `icon`).
   */
  async update(
    id: string,
    changes: { name?: string; icon?: string },
  ): Promise<void> {
    const ref = doc(this.firestore, CATEGORIES_COLLECTION, id);
    const patch: Partial<Category> = {};
    if (changes.name !== undefined) patch.name = changes.name.trim();
    if (changes.icon !== undefined) patch.icon = changes.icon.trim();
    await updateDoc(ref, patch);
  }

  /**
   * Benennt eine bestehende Kategorie um (Komfort-Wrapper um {@link update}).
   *
   * @param id Dokument-ID der Kategorie.
   * @param name Neuer Anzeigename.
   */
  async rename(id: string, name: string): Promise<void> {
    await this.update(id, { name });
  }

  /**
   * Löscht eine Kategorie.
   *
   * @param id Dokument-ID der zu löschenden Kategorie.
   */
  async delete(id: string): Promise<void> {
    const ref = doc(this.firestore, CATEGORIES_COLLECTION, id);
    await deleteDoc(ref);
  }
}
