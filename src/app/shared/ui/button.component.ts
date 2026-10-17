import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Leichtgewichtiger, wiederverwendbarer Button in der warm-verspielten
 * PTG-Optik (Req 11.1). Ohne Angular Material, nur component-scoped SCSS.
 *
 * Varianten:
 * - `primary` (Default): gefüllter Beeren-Button für Hauptaktionen.
 * - `ghost`: dezenter Umriss-Button für sekundäre Aktionen.
 *
 * Verwendung:
 * ```html
 * <ptg-button (click)="add()">In Warächorb</ptg-button>
 * <ptg-button variant="ghost" [disabled]="!canCheckout()">Wiiter</ptg-button>
 * ```
 */
@Component({
  selector: 'ptg-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      [class.btn--ghost]="variant === 'ghost'"
      [class.btn--primary]="variant === 'primary'"
      class="btn"
    >
      <ng-content />
    </button>
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  /** Visuelle Variante des Buttons. */
  @Input() variant: 'primary' | 'ghost' = 'primary';
  /** HTML-Button-Typ (z. B. `submit` in Formularen). */
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  /** Deaktiviert den Button (z. B. leerer Warenkorb, Req 3.5). */
  @Input() disabled = false;
}
