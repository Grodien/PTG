import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import { OrderService } from '../../core/services/order.service';
import { MuentschiPipe } from '../../shared/muentschi-pipe';

/**
 * Admin-Übersicht aller eingegangenen Bestellungen.
 *
 * Zeigt die Bestellungen neueste zuerst, jeweils mit Zeitpunkt, den einzelnen
 * Linien (Menge × Titel, Stückpreis), der optionalen Notiz, dem Total in
 * Müntschis sowie dem Best-Effort-Status von Push und E-Mail.
 *
 * Standalone, OnPush. Liest reaktiv aus {@link OrderService.orders$} (nur der
 * Administrator darf gemäss Security Rules lesen).
 */
@Component({
  selector: 'ptg-order-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MuentschiPipe],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss',
})
export class OrderListComponent {
  private readonly orderService = inject(OrderService);

  /** Alle Bestellungen (neueste zuerst), reaktiv als Signal. */
  readonly orders = toSignal(this.orderService.orders$, { initialValue: undefined });
}
