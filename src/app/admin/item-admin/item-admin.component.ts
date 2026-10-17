import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { of, switchMap } from 'rxjs';

import { Item } from '../../core/models';
import { CategoryService } from '../../core/services/category.service';
import {
  ItemCreateInput,
  ItemService,
} from '../../core/services/item.service';
import {
  ItemValidationErrors,
  validateItem,
} from '../../core/util/validation';
import { MuentschiPipe } from '../../shared/muentschi-pipe';
import { ButtonComponent } from '../../shared/ui';

/**
 * Formularmodus des Artikel-Admins.
 *
 * - `create`: Ein neuer Artikel wird unter der gewählten Kategorie angelegt.
 * - `edit`: Ein bestehender Artikel (`editingId`) wird bearbeitet.
 */
type FormMode = 'create' | 'edit';

/**
 * Admin-Komponente zur Verwaltung von Artikeln (Req 9.1–9.5).
 *
 * Ablauf:
 * 1. Der Administrator wählt eine Kategorie aus einem Dropdown
 *    ({@link CategoryService.categories}).
 * 2. Zu dieser Kategorie werden die Artikel live geladen
 *    ({@link ItemService.itemsByCategory}) und als Liste dargestellt.
 * 3. Über ein Formular lassen sich Artikel anlegen (Req 9.1), bearbeiten
 *    (Req 9.2) und löschen (Req 9.3).
 *
 * Vor jedem Speichern (anlegen/bearbeiten) prüft die Komponente die Eingaben
 * mit der reinen {@link validateItem}-Logik. Fehlt der Titel oder sind die
 * Kosten ungültig (keine ganze, nicht-negative Zahl), wird das Speichern
 * abgelehnt und ein berndeutscher Hinweis auf die betroffenen Felder angezeigt
 * (Req 9.4, 9.5). Die Validierung bleibt damit die einzige Quelle der Wahrheit;
 * die Komponente übersetzt deren Ergebnis nur in warme, verspielte Hinweise.
 *
 * Standalone, OnPush. Zustand wird über Signals verwaltet.
 */
@Component({
  selector: 'ptg-item-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MuentschiPipe, ButtonComponent],
  templateUrl: './item-admin.component.html',
  styleUrl: './item-admin.component.scss',
})
export class ItemAdminComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly itemService = inject(ItemService);

  /** Alle Kategorien für das Auswahl-Dropdown. */
  readonly categories = this.categoryService.categories;

  /** Aktuell gewählte Kategorie-ID (leer = noch keine Auswahl getroffen). */
  readonly selectedCategoryId = signal('');

  /** Gewählte Kategorie-ID als Observable-Quelle für den Artikel-Stream. */
  private readonly selectedCategoryId$ = toObservable(this.selectedCategoryId);

  /**
   * Live-Stream der Artikel der gewählten Kategorie. Ohne Auswahl ein leeres
   * Array; bei Auswahl lädt {@link ItemService.itemsByCategory} reaktiv neu.
   */
  readonly items = toSignal(
    this.selectedCategoryId$.pipe(
      switchMap((categoryId) =>
        categoryId
          ? this.itemService.itemsByCategory(categoryId)
          : of<Item[]>([]),
      ),
    ),
    { initialValue: [] as Item[] },
  );

  /** Aktueller Formularmodus (neu anlegen vs. bestehenden Artikel bearbeiten). */
  readonly mode = signal<FormMode>('create');

  /** ID des gerade bearbeiteten Artikels (nur relevant im Modus `edit`). */
  readonly editingId = signal<string | null>(null);

  /** Formularfeld: Titel des Artikels. */
  readonly title = signal('');
  /** Formularfeld: optionale Beschreibung. */
  readonly description = signal('');
  /**
   * Formularfeld: Kosten als Roh-Text aus dem Eingabefeld.
   *
   * Bewusst als String gehalten, damit die Eingabe unverändert an
   * {@link validateItem}/`validateCost` übergeben werden kann (die den gültigen
   * Wertebereich prüfen) und nicht vorab durch eine Typumwandlung verfälscht
   * wird.
   */
  readonly costInput = signal('');

  /** Feldbezogene Validierungsfehler des letzten Speicherversuchs. */
  readonly errors = signal<ItemValidationErrors>({});

  /**
   * `true`, sobald eine Kategorie gewählt wurde – erst dann sind Liste und
   * Formular sinnvoll nutzbar.
   */
  readonly hasCategory = computed(() => this.selectedCategoryId().length > 0);

  /** Reagiert auf die Kategorie-Auswahl im Dropdown. */
  onCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedCategoryId.set(value);
    // Bei Kategoriewechsel das Formular zurücksetzen, damit keine Bearbeitung
    // aus der vorherigen Kategorie „hängen bleibt“.
    this.resetForm();
  }

  /**
   * Speichert den Artikel (anlegen oder bearbeiten) nach erfolgreicher
   * Validierung (Req 9.1, 9.2).
   *
   * Vor dem Schreiben wird {@link validateItem} aufgerufen. Schlägt die
   * Validierung fehl (fehlender Titel / ungültige Kosten), werden die
   * Fehlermeldungen gesetzt und das Speichern abgebrochen (Req 9.4, 9.5).
   */
  async save(): Promise<void> {
    const categoryId = this.selectedCategoryId();
    if (!categoryId) {
      return;
    }

    // Kosten als Zahl interpretieren, aber die eigentliche Gültigkeitsprüfung
    // der reinen Validierung überlassen. Leere Eingabe → NaN, was von
    // validateCost korrekt als ungültig abgelehnt wird (Req 9.4/9.5).
    const costRaw = this.costInput().trim();
    const cost = costRaw === '' ? Number.NaN : Number(costRaw);

    const result = validateItem({
      title: this.title(),
      description: this.description(),
      cost,
      categoryId,
    });

    if (!result.ok) {
      // Speichern ablehnen und auf die betroffenen Felder hinweisen.
      this.errors.set(result.errors);
      return;
    }

    // Validierung bestanden → keine Fehler mehr anzeigen.
    this.errors.set({});

    const editingId = this.editingId();
    if (this.mode() === 'edit' && editingId) {
      // Bearbeiten: nur die änderbaren Attribute patchen (Req 9.2).
      await this.itemService.update(editingId, {
        title: result.value.title,
        description: result.value.description,
        cost: result.value.cost,
      });
    } else {
      // Anlegen unter der gewählten Kategorie (Req 9.1).
      const input: ItemCreateInput = {
        categoryId,
        title: result.value.title,
        description: result.value.description,
        cost: result.value.cost,
      };
      await this.itemService.create(input);
    }

    // Nach erfolgreichem Speichern das Formular leeren/zurücksetzen.
    this.resetForm();
  }

  /** Übernimmt einen Artikel in das Formular zur Bearbeitung (Req 9.2). */
  startEdit(item: Item): void {
    this.mode.set('edit');
    this.editingId.set(item.id);
    this.title.set(item.title);
    this.description.set(item.description);
    this.costInput.set(String(item.cost));
    this.errors.set({});
  }

  /** Bricht die laufende Bearbeitung ab und leert das Formular. */
  cancelEdit(): void {
    this.resetForm();
  }

  /** Löscht den angegebenen Artikel (Req 9.3). */
  async delete(item: Item): Promise<void> {
    await this.itemService.delete(item.id);
    // Falls genau dieser Artikel gerade bearbeitet wird, Formular zurücksetzen.
    if (this.editingId() === item.id) {
      this.resetForm();
    }
  }

  /** Aktualisiert das Titel-Signal aus dem Eingabeereignis. */
  onTitleInput(event: Event): void {
    this.title.set((event.target as HTMLInputElement).value);
  }

  /** Aktualisiert das Beschreibungs-Signal aus dem Eingabeereignis. */
  onDescriptionInput(event: Event): void {
    this.description.set((event.target as HTMLTextAreaElement).value);
  }

  /** Aktualisiert das Kosten-Signal (Roh-Text) aus dem Eingabeereignis. */
  onCostInput(event: Event): void {
    this.costInput.set((event.target as HTMLInputElement).value);
  }

  /** Setzt das Formular in den Ausgangszustand (Modus `create`). */
  private resetForm(): void {
    this.mode.set('create');
    this.editingId.set(null);
    this.title.set('');
    this.description.set('');
    this.costInput.set('');
    this.errors.set({});
  }
}
