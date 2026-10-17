import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { Item } from '../../core/models';
import { MuentschiPipe } from '../../shared/muentschi-pipe';
import { ButtonComponent } from '../../shared/ui';

/**
 * Zeigt einen einzelnen Artikel als Karte in der warm-verspielten PTG-Optik
 * (Req 11.1): Titel, Beschreibung und Kosten in Müntschis (via
 * {@link MuentschiPipe}, Req 2.1, 2.2).
 *
 * Die Aktion "In den Warenkorb" (Req 3.1) wird bewusst als {@link addToCart}
 * nach aussen gereicht, damit die Karte frei von Service-Abhängigkeiten bleibt
 * und isoliert getestet werden kann. Die {@link ItemListComponent} verdrahtet
 * das Event mit `CartService.add`.
 *
 * Verwendung:
 * ```html
 * <ptg-item-card [item]="item" (addToCart)="cart.add($event)" />
 * ```
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
        <ptg-button (click)="addToCart.emit(item)">
          In Warächorb
        </ptg-button>
      </div>
    </article>
  `,
  styleUrl: './item-card.component.scss',
})
export class ItemCardComponent {
  /** Der darzustellende Artikel. Pflicht-Input. */
  @Input({ required: true }) item!: Item;

  /** Ausgelöst, wenn die Besucherin den Artikel in den Warenkorb legt (Req 3.1). */
  @Output() addToCart = new EventEmitter<Item>();
}
