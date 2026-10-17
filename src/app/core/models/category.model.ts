import { Timestamp } from '@angular/fire/firestore';

/**
 * Eine Kategorie im Angebot (Firestore-Collection `categories/{categoryId}`).
 *
 * Kategorien gruppieren Artikel (z. B. "Massage", "Snacks/Süsses").
 */
export interface Category {
  /** Firestore-Dokument-ID. */
  id: string;
  /** Anzeigename der Kategorie, z. B. "Massage". */
  name: string;
  /** Optionale Sortierreihenfolge; kleinere Werte zuerst. */
  order?: number;
  /** Zeitpunkt der Erstellung (Firestore-Timestamp). */
  createdAt: Timestamp;
}
