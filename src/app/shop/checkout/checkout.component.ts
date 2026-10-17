import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { MuentschiPipe } from '../../shared/muentschi-pipe';
import { ButtonComponent } from '../../shared/ui';

/**
 * Möglicher Zustand des Checkout-Vorgangs.
 *
 * - `idle`: Noch nicht abgeschickt bzw. bereit für eine (weitere) Bestellung.
 * - `submitting`: Die Bestellung wird gerade gespeichert.
 * - `success`: Die Bestellung wurde erfolgreich gespeichert (Req 4.4).
 * - `error`: Das Speichern ist fehlgeschlagen (Req 4.6).
 */
type CheckoutState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Checkout-Komponente des Besucherinnen-Bereichs (Req 4.1–4.6).
 *
 * Zeigt eine Zusammenfassung des Warenkorbs, ein optionales Freitext-Notizfeld
 * sowie einen Absenden-Button. Beim Absenden wird aus dem {@link CartService}
 * ein `OrderDraft` erzeugt und über den {@link OrderService} in Firestore
 * gespeichert:
 *
 * - Erfolg (Req 4.4, 4.5): freundliche, berndeutsche Bestätigung anzeigen und
 *   den Warenkorb leeren.
 * - Fehler (Req 4.6): berndeutsche Fehlermeldung anzeigen; der Warenkorb bleibt
 *   unverändert (kein `clear()`).
 *
 * Der Checkout ist bewusst anonym – es werden weder Name noch Authentifizierung
 * verlangt (Req 4.3). Der Absenden-Button ist deaktiviert, solange gespeichert
 * wird oder der Warenkorb leer ist (abgeleitet aus `canCheckout`).
 *
 * Standalone, OnPush. Der Zustand wird über ein Signal (`state`) nachverfolgt.
 */
@Component({
  selector: 'ptg-checkout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MuentschiPipe, ButtonComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  /** Reine Warenkorb-Logik (Signals für `lines`, `total`, `canCheckout`, …). */
  private readonly cart = inject(CartService);
  /** Persistiert die Bestellung in Firestore. */
  private readonly orderService = inject(OrderService);

  /** Alle Warenkorb-Linien (reaktiv, für die Zusammenfassung). */
  readonly lines = this.cart.lines;
  /** Gesamtsumme in Müntschis. */
  readonly total = this.cart.total;
  /** Gesamtanzahl aller Artikel. */
  readonly itemCount = this.cart.itemCount;
  /** `true`, wenn der Warenkorb mindestens einen Artikel enthält (Req 3.5). */
  readonly canCheckout = this.cart.canCheckout;

  /** Inhalt des optionalen Notizfeldes (Req 4.1). */
  readonly note = signal('');
  /** Aktueller Checkout-Zustand (idle/submitting/success/error). */
  readonly state = signal<CheckoutState>('idle');

  /**
   * Schliesst den Checkout ab (Req 4.2).
   *
   * Erzeugt einen `OrderDraft` aus dem aktuellen Warenkorb – die Notiz wird auf
   * `null` normalisiert, wenn sie leer ist oder nur aus Leerzeichen besteht –
   * und speichert ihn über den {@link OrderService}.
   *
   * Bei Erfolg (Req 4.4, 4.5) wechselt der Zustand auf `success` und der
   * Warenkorb wird geleert. Bei einem Fehler (Req 4.6) wechselt der Zustand auf
   * `error`; der Warenkorb bleibt unangetastet.
   */
  async submit(): Promise<void> {
    // Doppeltes Absenden und Absenden bei leerem Warenkorb verhindern.
    if (this.state() === 'submitting' || !this.canCheckout()) {
      return;
    }

    this.state.set('submitting');

    // Leere oder reine Whitespace-Notizen zu `null` normalisieren (Req 4.1).
    const trimmed = this.note().trim();
    const note = trimmed.length > 0 ? trimmed : null;

    try {
      await this.orderService.create(this.cart.toOrderDraft(note));
      // Erfolg: Bestätigung anzeigen und Warenkorb leeren (Req 4.4, 4.5).
      this.state.set('success');
      this.cart.clear();
      this.note.set('');
    } catch {
      // Fehler: Meldung anzeigen, Warenkorb unverändert lassen (Req 4.6).
      this.state.set('error');
    }
  }

  /**
   * Setzt den Checkout nach einem Fehler zurück, damit die Besucherin es erneut
   * versuchen kann. Der Warenkorb bleibt dabei erhalten.
   */
  retry(): void {
    this.state.set('idle');
  }

  /** Aktualisiert die Notiz aus dem Textarea-Eingabeereignis. */
  onNoteInput(event: Event): void {
    this.note.set((event.target as HTMLTextAreaElement).value);
  }
}
