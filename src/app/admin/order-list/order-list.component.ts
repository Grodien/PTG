import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
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
 * Offene Bestellungen lassen sich als erledigt markieren (und wieder öffnen).
 *
 * Wird die Komponente über den Deep-Link `/admin/bstellige/:orderId` (z. B. aus
 * einer Push-Benachrichtigung) geöffnet, wird die betroffene Bestellung
 * hervorgehoben und ins Sichtfeld gescrollt.
 *
 * Standalone, OnPush.
 */
@Component({
  selector: 'ptg-order-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MuentschiPipe, ButtonComponent],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss',
})
export class OrderListComponent implements AfterViewInit {
  private readonly orderService = inject(OrderService);
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Optionale Bestell-ID aus dem Deep-Link (`/admin/bstellige/:orderId`). */
  readonly orderId = input<string | undefined>(undefined);

  /** ID der hervorzuhebenden Bestellung (gesetzt via Deep-Link). */
  readonly highlightId = computed(() => this.orderId() ?? null);

  /** Alle Bestellungen (neueste zuerst), reaktiv als Signal. */
  readonly orders = toSignal(this.orderService.orders$, { initialValue: undefined });

  /** Offene (noch nicht erledigte) Bestellungen. */
  readonly openOrders = computed(() => (this.orders() ?? []).filter((o) => !o.done));

  /** Bereits erledigte Bestellungen. */
  readonly doneOrders = computed(() => (this.orders() ?? []).filter((o) => o.done));

  /** Verhindert wiederholtes Scrollen, wenn die Liste erneut emittiert. */
  private readonly hasScrolled = signal(false);

  constructor() {
    // Sobald die Bestellungen geladen sind und ein Deep-Link-Ziel existiert,
    // einmalig zur hervorgehobenen Bestellung scrollen.
    effect(() => {
      const target = this.highlightId();
      const loaded = this.orders() !== undefined;
      if (target && loaded && !this.hasScrolled()) {
        this.hasScrolled.set(true);
        // Nach dem Rendern scrollen.
        setTimeout(() => this.scrollToTarget(target), 0);
      }
    });
  }

  ngAfterViewInit(): void {
    const target = this.highlightId();
    if (target && this.orders() !== undefined && !this.hasScrolled()) {
      this.hasScrolled.set(true);
      setTimeout(() => this.scrollToTarget(target), 0);
    }
  }

  private scrollToTarget(id: string): void {
    const el = this.host.nativeElement.querySelector(`[data-order-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /** Markiert eine Bestellung als erledigt bzw. wieder als offen. */
  async toggleDone(order: Order): Promise<void> {
    await this.orderService.setDone(order.id, !order.done);
  }
}
