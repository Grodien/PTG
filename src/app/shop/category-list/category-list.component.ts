import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CategoryService } from '../../core/services/category.service';

/**
 * Startseite des Besucherinnen-Bereichs (Req 1.2).
 *
 * Zeigt alle vorhandenen Kategorien aus dem {@link CategoryService} als warm-
 * verspielte Kachel-Galerie. Eine Auswahl navigiert zur Artikelliste der
 * gewählten Kategorie. Die konkrete Shop-Route wird in Task 11.1 verdrahtet;
 * hier wird bewusst der stabile Pfad `['/kategorie', category.id]` verwendet.
 *
 * Standalone, OnPush. Die Kategorien kommen als Signal direkt aus dem Service,
 * sodass das Template mit der neuen Control-Flow-Syntax (`@for`) reaktiv bleibt.
 */
@Component({
  selector: 'ptg-category-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss',
})
export class CategoryListComponent {
  /** Firestore-Daten-Service für Kategorien. */
  private readonly categoryService = inject(CategoryService);

  /** Alle vorhandenen Kategorien (reaktives Signal, leeres Array als Startwert). */
  readonly categories = this.categoryService.categories;

  /**
   * Verspielte Emoji-Verzierung je nach Kategoriename (Berner Charme).
   *
   * Rein kosmetisch: trifft der Name keinen bekannten Begriff, gibt es ein
   * freundliches Standard-Herz. Die Zuordnung ist tolerant (Teilstring,
   * case-insensitiv), damit Varianten wie "Snacks/Süsses" ebenfalls greifen.
   */
  emojiFor(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('esse')) return '🍽️';
    if (n.includes('trink')) return '🥤';
    if (n.includes('massage')) return '💆';
    if (n.includes('brettspiel') || n.includes('spiel')) return '🎲';
    if (n.includes('umarm') || n.includes('kuschel')) return '🤗';
    if (n.includes('snack') || n.includes('süss') || n.includes('suess')) return '🍬';
    if (n.includes('erledig') || n.includes('botengang')) return '🏃';
    if (n.includes('entertain') || n.includes('film')) return '🎬';
    if (n.includes('ruhe') || n.includes('me-time') || n.includes('metime')) return '🧘';
    return '💗';
  }
}
