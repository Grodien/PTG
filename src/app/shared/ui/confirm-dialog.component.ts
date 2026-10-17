import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  AfterViewInit,
} from '@angular/core';

/**
 * Leichtgewichtiger, wiederverwendbarer Bestätigungsdialog für destruktive
 * Aktionen (z. B. Kaskaden-Löschung einer Kategorie, Req 8.4).
 *
 * Bewusst ohne Angular Material gebaut – nur Overlay + Karte + zwei Buttons,
 * gestylt mit der herzlich-warmen, verspielten PTG-Optik (Req 11.1).
 *
 * Barrierefreiheit:
 * - `role="dialog"` mit `aria-modal` und `aria-labelledby`/`aria-describedby`
 * - Fokus landet beim Öffnen auf dem Bestätigungs-Button
 * - Escape sowie Klick auf den Hintergrund lösen Abbruch aus
 *
 * Verwendung:
 * ```html
 * @if (showDelete()) {
 *   <ptg-confirm-dialog
 *     title="Kategorie löschen?"
 *     message="Alle zugeordneten Artikel werden ebenfalls entfernt."
 *     confirmLabel="Löschen"
 *     cancelLabel="Behalten"
 *     (confirm)="onDelete()"
 *     (cancel)="showDelete.set(false)" />
 * }
 * ```
 */
@Component({
  selector: 'ptg-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="overlay"
      (click)="onBackdropClick($event)"
    >
      <div
        #card
        class="card"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [attr.aria-describedby]="messageId"
        (click)="$event.stopPropagation()"
      >
        <h2 class="title" [id]="titleId">{{ title }}</h2>
        <p class="message" [id]="messageId">{{ message }}</p>

        <div class="actions">
          <button
            type="button"
            class="btn btn--ghost"
            (click)="cancel.emit()"
          >
            {{ cancelLabel }}
          </button>
          <button
            #confirmButton
            type="button"
            class="btn btn--danger"
            (click)="confirm.emit()"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent implements AfterViewInit {
  /** Titelzeile des Dialogs. */
  @Input() title = 'Bisch sicher?';
  /** Beschreibender Text, was passiert, wenn bestätigt wird. */
  @Input() message = 'Die Aktion cha nid rückgängig gmacht werde.';
  /** Beschriftung des bestätigenden (destruktiven) Buttons. */
  @Input() confirmLabel = 'Ja, mache';
  /** Beschriftung des abbrechenden Buttons. */
  @Input() cancelLabel = 'Abbräche';

  /** Ausgelöst, wenn die Benutzerin die Aktion bestätigt. */
  @Output() confirm = new EventEmitter<void>();
  /** Ausgelöst bei Abbruch (Button, Escape oder Klick auf den Hintergrund). */
  @Output() cancel = new EventEmitter<void>();

  /** Eindeutige IDs für die aria-Verknüpfung (mehrere Dialoge pro Seite möglich). */
  private static nextId = 0;
  private readonly uid = ConfirmDialogComponent.nextId++;
  readonly titleId = `ptg-confirm-title-${this.uid}`;
  readonly messageId = `ptg-confirm-message-${this.uid}`;

  @ViewChild('confirmButton') private confirmButton?: ElementRef<HTMLButtonElement>;

  ngAfterViewInit(): void {
    // Fokus auf den primären Button, damit Tastaturnutzerinnen direkt agieren können.
    this.confirmButton?.nativeElement.focus();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    // Nur der Hintergrund selbst schliesst den Dialog, nicht die Karte.
    if (event.target === event.currentTarget) {
      this.cancel.emit();
    }
  }
}
