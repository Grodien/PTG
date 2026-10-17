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
  /**
   * Optionales Emoji-Icon der Kategorie (z. B. "💆"). Fehlt es, wählt die
   * Anzeige automatisch ein passendes Icon anhand des Namens.
   */
  icon?: string;
  /** Optionale Sortierreihenfolge; kleinere Werte zuerst. */
  order?: number;
  /** Zeitpunkt der Erstellung (Firestore-Timestamp). */
  createdAt: Timestamp;
}
