import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import { Order } from '../../core/models';
import { OrderService } from '../../core/services/order.service';
import { MuentschiPipe } from '../../shared/muentschi-pipe';
import { ButtonComponent } from '../../shared/ui';

/**
 * Admin-Übersicht aller eingegangenen Bestellungen.
 *
 * Zeigt die Bestellungen neueste zuerst, getrennt in offene und erledigte.
 * Jede Bestellung listet Zeitpunkt, Linien (Menge × Titel, Stückpreis), die
 * optionale Notiz, das Total in Müntschis und den Push-/E-Mail-Status. Offene
 * Bestellungen lassen sich als erledigt markieren (und wieder öffnen).
 *
 * Standalone, OnPush. Liest reaktiv aus {@link OrderService.orders$} und
 * schreibt den Erledigt-Status über {@link OrderService.setDone}.
 */
@Component({
  selector: 'ptg-order-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MuentschiPipe, ButtonComponent],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss',
})
export class OrderListComponent {
  private readonly orderService = inject(OrderService);

  /** Alle Bestellungen (neueste zuerst), reaktiv als Signal. */
  readonly orders = toSignal(this.orderService.orders$, { initialValue: undefined });

  /** Offene (noch nicht erledigte) Bestellungen. */
  readonly openOrders = computed(() => (this.orders() ?? []).filter((o) => !o.done));

  /** Bereits erledigte Bestellungen. */
  readonly doneOrders = computed(() => (this.orders() ?? []).filter((o) => o.done));

  /** Markiert eine Bestellung als erledigt bzw. wieder als offen. */
  async toggleDone(order: Order): Promise<void> {
    await this.orderService.setDone(order.id, !order.done);
  }
}
