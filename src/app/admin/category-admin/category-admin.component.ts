import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, take } from 'rxjs';

import { Category } from '../../core/models';
import { CategoryService } from '../../core/services/category.service';
import { ItemService } from '../../core/services/item.service';
import { ButtonComponent, ConfirmDialogComponent } from '../../shared/ui';

/**
 * Admin-Verwaltung der Kategorien (Req 8.1–8.4).
 *
 * Bietet in einer warm-verspielten, berndeutschen Oberfläche:
 * - Anlegen neuer Kategorien über ein Namensfeld + "Dezue"-Button
 *   ({@link CategoryService.create}, Req 8.1).
 * - Inline-Umbenennen bestehender Kategorien ({@link CategoryService.rename},
 *   Req 8.2).
 * - Löschen von Kategorien ({@link CategoryService.delete}, Req 8.3).
 * - Kaskaden-sichere Löschung (Req 8.4): Bevor eine Kategorie entfernt wird,
 *   prüft die Komponente über {@link ItemService.itemsByCategory} (erste
 *   Emission), ob ihr Artikel zugeordnet sind. Falls ja, erscheint der
 *   gemeinsame {@link ConfirmDialogComponent} mit einer Warnung, dass die
 *   Kategorie samt ihren Artikeln verschwindet; erst bei Bestätigung werden
 *   zuerst die Artikel ({@link ItemService.deleteByCategory}) und danach die
 *   Kategorie gelöscht.
 *
 * Standalone, OnPush.
 */
@Component({
  selector: 'ptg-category-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent, ConfirmDialogComponent],
  templateUrl: './category-admin.component.html',
  styleUrl: './category-admin.component.scss',
})
export class CategoryAdminComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly itemService = inject(ItemService);

  /** Alle Kategorien, reaktiv aus dem CategoryService (sortiert). */
  readonly categories = this.categoryService.categories;

  /** Eingabewert des Anlege-Felds (gebunden via ngModel). */
  readonly newName = signal('');
  /** Optionales Emoji-Icon für die neue Kategorie. */
  readonly newIcon = signal('');

  /** ID der aktuell inline bearbeiteten Kategorie (oder `null`). */
  readonly editingId = signal<string | null>(null);
  /** Zwischengespeicherter Name während des Bearbeitens. */
  readonly editName = signal('');
  /** Zwischengespeichertes Icon während des Bearbeitens. */
  readonly editIcon = signal('');

  /**
   * Kategorie, deren Löschung (mit Artikeln) noch bestätigt werden muss.
   * `null`, solange kein Kaskaden-Dialog offen ist.
   */
  readonly pendingDelete = signal<Category | null>(null);

  /** Läuft gerade eine schreibende Operation? Deaktiviert Doppel-Klicks. */
  readonly busy = signal(false);

  // --- Anlegen (Req 8.1) --------------------------------------------------

  /** Legt eine neue Kategorie an, sofern der Name nicht leer ist. */
  async add(): Promise<void> {
    const name = this.newName().trim();
    if (!name || this.busy()) {
      return;
    }
    this.busy.set(true);
    try {
      await this.categoryService.create(name, this.newIcon().trim());
      this.newName.set('');
      this.newIcon.set('');
    } finally {
      this.busy.set(false);
    }
  }

  // --- Umbenennen (Req 8.2) ----------------------------------------------

  /** Startet das Inline-Umbenennen einer Kategorie. */
  startEdit(category: Category): void {
    this.editingId.set(category.id);
    this.editName.set(category.name);
    this.editIcon.set(category.icon ?? '');
  }

  /** Bricht das Umbenennen ohne Speichern ab. */
  cancelEdit(): void {
    this.editingId.set(null);
    this.editName.set('');
    this.editIcon.set('');
  }

  /** Speichert den geänderten Namen, sofern er nicht leer ist. */
  async saveEdit(category: Category): Promise<void> {
    const name = this.editName().trim();
    if (!name || this.busy()) {
      return;
    }
    const icon = this.editIcon().trim();
    const nameChanged = name !== category.name;
    const iconChanged = icon !== (category.icon ?? '');
    if (nameChanged || iconChanged) {
      this.busy.set(true);
      try {
        await this.categoryService.update(category.id, { name, icon });
      } finally {
        this.busy.set(false);
      }
    }
    this.cancelEdit();
  }

  // --- Löschen (Req 8.3, 8.4) --------------------------------------------

  /**
   * Fordert die Löschung einer Kategorie an.
   *
   * Prüft zuerst (erste Emission von {@link ItemService.itemsByCategory}), ob
   * der Kategorie Artikel zugeordnet sind. Gibt es Artikel, öffnet sich der
   * Bestätigungsdialog für die Kaskaden-Löschung (Req 8.4). Ohne Artikel wird
   * direkt gelöscht.
   */
  async requestDelete(category: Category): Promise<void> {
    if (this.busy()) {
      return;
    }
    const items = await firstValueFrom(
      this.itemService.itemsByCategory(category.id).pipe(take(1)),
    );
    if (items.length > 0) {
      this.pendingDelete.set(category);
      return;
    }
    await this.deleteCategory(category.id);
  }

  /**
   * Bestätigte Kaskaden-Löschung: entfernt zuerst alle Artikel der Kategorie
   * und danach die Kategorie selbst (Req 8.4).
   */
  async confirmCascadeDelete(): Promise<void> {
    const category = this.pendingDelete();
    if (!category || this.busy()) {
      return;
    }
    this.busy.set(true);
    try {
      await this.itemService.deleteByCategory(category.id);
      await this.categoryService.delete(category.id);
    } finally {
      this.pendingDelete.set(null);
      this.busy.set(false);
    }
  }

  /** Schliesst den Kaskaden-Dialog ohne zu löschen. */
  cancelCascadeDelete(): void {
    this.pendingDelete.set(null);
  }

  /** Löscht eine Kategorie ohne Artikel direkt. */
  private async deleteCategory(id: string): Promise<void> {
    this.busy.set(true);
    try {
      await this.categoryService.delete(id);
    } finally {
      this.busy.set(false);
    }
  }
}
