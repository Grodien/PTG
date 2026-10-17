import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

import { Item } from '../../core/models';
import { CartService } from '../../core/services/cart.service';
import { ItemService } from '../../core/services/item.service';
import { ItemCardComponent } from '../item-card/item-card.component';

/**
 * Listet alle Artikel der gewählten Kategorie (Req 1.3) und zeigt bei leerer
 * Kategorie einen herzlichen Hinweis (Req 1.4).
 *
 * Die `categoryId` kommt über das Routing als Component-Input
 * (`withComponentInputBinding`), die Route ist `/kategorie/:categoryId`
 * (verdrahtet in Task 11.1). Daraus werden die Artikel reaktiv via
 * {@link ItemService.itemsByCategory} geladen und als {@link ItemCardComponent}
 * dargestellt. Das `addToCart`-Event jeder Karte wird mit
 * {@link CartService.add} verdrahtet (Req 3.1).
 */
@Component({
  selector: 'ptg-item-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ItemCardComponent],
  template: `
    <section class="item-list">
      @if (items(); as list) {
        @if (list.length > 0) {
          <div class="item-list__grid">
            @for (item of list; track item.id) {
              <ptg-item-card [item]="item" (addToCart)="cart.add($event)" />
            }
          </div>
        } @else {
          <p class="item-list__empty">
            Hie het's grad no nüt – di Kategorie isch momentan läär. Lueg
            schpäter no einisch verbi! 💕
          </p>
        }
      } @else {
        <p class="item-list__loading">Ei Momänt, mir lade d'Artikel…</p>
      }
    </section>
  `,
  styleUrl: './item-list.component.scss',
})
export class ItemListComponent {
  private readonly itemService = inject(ItemService);
  protected readonly cart = inject(CartService);

  /** Kategorie-ID aus dem Routen-Parameter `/kategorie/:categoryId`. */
  readonly categoryId = input.required<string>();

  /** Signal der Kategorie-ID als Observable-Quelle für den Artikel-Stream. */
  private readonly categoryId$ = toObservable(this.categoryId);

  /** Reaktiver Artikel-Stream: lädt bei jeder `categoryId`-Änderung neu. */
  protected readonly items = toSignal<Item[] | undefined, undefined>(
    this.categoryId$.pipe(
      switchMap((categoryId) => this.itemService.itemsByCategory(categoryId)),
    ),
    { initialValue: undefined },
  );
}
