import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart.service';
import { MuentschiPipe } from '../../shared/muentschi-pipe';
import { ButtonComponent } from '../../shared/ui';

/**
 * Warenkorb-Ansicht der Besucherin (Req 3.2–3.5).
 *
 * Zeigt die aktuellen Warenkorb-Linien mit Menge und Kosten, erlaubt das
 * Entfernen einzelner Artikel, stellt die Gesamtsumme in Müntschis dar und
 * bietet einen Checkout-Weiter-Link, der bei leerem Warenkorb deaktiviert ist.
 *
 * Die Komponente ist reine Präsentation: Sie konsumiert die Signals des
 * {@link CartService} und löst dessen Methoden aus. Der Checkout-Link führt zur
 * Route `/checkout` (in Task 11.1 ins Routing verdrahtet).
 *
 * Optik: herzlich-warme, verspielte PTG-Palette (Req 11.1), component-scoped.
 */
@Component({
  selector: 'ptg-cart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MuentschiPipe, ButtonComponent],
  template: `
    <section class="cart" aria-labelledby="cart-heading">
      <h1 id="cart-heading" class="cart__heading">Dis Warächörbli 🧺</h1>

      @if (cart.lines().length === 0) {
        <p class="cart__empty">
          Dis Warächörbli isch no läär. Suech der öppis Schöns us – i freu mi
          druf! 💕
        </p>
      } @else {
        <ul class="cart__lines">
          @for (line of cart.lines(); track line.item.id) {
            <li class="line">
              <div class="line__info">
                <span class="line__title">{{ line.item.title }}</span>
                <span class="line__meta">
                  {{ line.quantity }}× {{ line.item.cost | muentschi }}
                </span>
              </div>

              <div class="line__right">
                <span class="line__sum">
                  {{ line.item.cost * line.quantity | muentschi }}
                </span>
                <ptg-button
                  variant="ghost"
                  (click)="cart.remove(line.item.id)"
                  [attr.aria-label]="'Entferne ' + line.item.title"
                >
                  Ewägg
                </ptg-button>
              </div>
            </li>
          }
        </ul>

        <div class="cart__total">
          <span class="cart__total-label">Total</span>
          <span class="cart__total-value">{{ cart.total() | muentschi }}</span>
        </div>
      }

      <div class="cart__checkout">
        @if (cart.canCheckout()) {
          <a class="checkout-link" routerLink="/checkout">
            Wiiter zur Bstellig 💌
          </a>
        } @else {
          <span
            class="checkout-link checkout-link--disabled"
            aria-disabled="true"
          >
            Wiiter zur Bstellig 💌
          </span>
        }
      </div>
    </section>
  `,
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  /** Reiner, in-memory gehaltener Warenkorb-Service (Signals). */
  readonly cart = inject(CartService);
}
