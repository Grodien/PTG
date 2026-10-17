import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  signal,
} from '@angular/core';

import { Item } from '../../core/models';
import { MuentschiPipe } from '../../shared/muentschi-pipe';
import { ButtonComponent } from '../../shared/ui';

/**
 * Zeigt einen einzelnen Artikel als Karte in der warm-verspielten PTG-Optik
 * (Req 11.1): Titel, Beschreibung und Kosten in Müntschis (via
 * {@link MuentschiPipe}, Req 2.1, 2.2).
 *
 * Die Aktion "In den Warenkorb" (Req 3.1) wird als {@link addToCart} nach aussen
 * gereicht, damit die Karte frei von Service-Abhängigkeiten bleibt. Nach dem
 * Klick zeigt die Karte kurz eine Bestätigung ("Zuegfüegt ✓") als direktes
 * visuelles Feedback.
 */
@Component({
  selector: 'ptg-item-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MuentschiPipe, ButtonComponent],
  template: `
    <article class="card">
      <h3 class="card__title">{{ item.title }}</h3>

      @if (item.description) {
        <p class="card__description">{{ item.description }}</p>
      }

      <div class="card__footer">
        <span class="card__cost">{{ item.cost | muentschi }}</span>
        <ptg-button (click)="onAdd()">
          @if (justAdded()) {
            Zuegfüegt ✓
          } @else {
            In Warächorb
          }
        </ptg-button>
      </div>

      <!-- Kurzes, dezentes Feedback nach dem Hinzufügen -->
      @if (justAdded()) {
        <span class="card__feedback" role="status" aria-live="polite">
          Im Warächorb glandet! 💕
        </span>
      }
    </article>
  `,
  styleUrl: './item-card.component.scss',
})
export class ItemCardComponent implements OnDestroy {
  /** Der darzustellende Artikel. Pflicht-Input. */
  @Input({ required: true }) item!: Item;

  /** Ausgelöst, wenn die Besucherin den Artikel in den Warenkorb legt (Req 3.1). */
  @Output() addToCart = new EventEmitter<Item>();

  /** Zeigt für kurze Zeit die Hinzufügen-Bestätigung an. */
  readonly justAdded = signal(false);

  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  /** Emittiert das Hinzufügen und blendet kurz ein Feedback ein. */
  onAdd(): void {
    this.addToCart.emit(this.item);
    this.justAdded.set(true);
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    this.resetTimer = setTimeout(() => this.justAdded.set(false), 1600);
  }

  ngOnDestroy(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
  }
}
