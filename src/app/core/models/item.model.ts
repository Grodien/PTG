import { Timestamp } from '@angular/fire/firestore';

/**
 * Ein bestellbarer Artikel (Firestore-Collection `items/{itemId}`).
 *
 * Invariante: `cost` ist ganzzahlig und ≥ 0 (Müntschis werden stets als
 * ganze, nicht-negative Zahl geführt).
 */
export interface Item {
  /** Firestore-Dokument-ID. */
  id: string;
  /** Referenz auf die zugehörige Kategorie (`categories/{id}`). */
  categoryId: string;
  /** Pflichtfeld: Titel des Artikels. */
  title: string;
  /** Beschreibung; optional, Default "". */
  description: string;
  /** Stückpreis in Müntschis. Invariante: Integer und ≥ 0. */
  cost: number;
  /** Zeitpunkt der Erstellung (Firestore-Timestamp). */
  createdAt: Timestamp;
}
