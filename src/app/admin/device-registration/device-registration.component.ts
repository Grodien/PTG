import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  MessagingService,
  RegistrationResult,
} from '../../core/services/messaging.service';
import { ButtonComponent } from '../../shared/ui';

/**
 * Status der Geräte-Registrierung aus Sicht der Oberfläche.
 *
 * - `idle`: Noch nichts ausgelöst.
 * - `busy`: Registrierung läuft gerade.
 * - `granted` / `denied` / `unsupported`: Ausgang gemäss {@link RegistrationResult}.
 * - `error`: Ein unerwarteter Fehler ist aufgetreten.
 */
type DeviceStatus = 'idle' | 'busy' | RegistrationResult | 'error';

/**
 * Admin-Komponente zur Registrierung des Handys für Push-Benachrichtigungen
 * (Req 10.1–10.3).
 *
 * Bietet einen Auslöser für {@link MessagingService.registerDevice} und zeigt
 * je nach Ausgang einen passenden, warm-berndeutschen Hinweis:
 * - `granted`: Erfolgs-Hinweis (Gerät registriert).
 * - `denied`: Hinweis, dass ohne Berechtigung keine Push zugestellt werden
 *   können (Req 10.3).
 * - `unsupported`: Hinweis, dass dieser Browser/dieses Gerät kein Web-Push kann.
 *
 * Standalone, OnPush. Der Status wird über ein Signal gehalten.
 */
@Component({
  selector: 'ptg-device-registration',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  templateUrl: './device-registration.component.html',
  styleUrl: './device-registration.component.scss',
})
export class DeviceRegistrationComponent {
  private readonly messaging = inject(MessagingService);

  /** Aktueller UI-Status der Registrierung. */
  readonly status = signal<DeviceStatus>('idle');

  /** `true`, solange die Registrierung läuft (deaktiviert den Button). */
  readonly busy = computed(() => this.status() === 'busy');

  /**
   * Löst die Geräte-Registrierung aus und übersetzt das Ergebnis in den
   * UI-Status. Fehler (z. B. beim Token-Holen oder Speichern) werden abgefangen
   * und als `error` signalisiert, ohne die Komponente zu unterbrechen.
   */
  async register(): Promise<void> {
    this.status.set('busy');
    try {
      const result = await this.messaging.registerDevice();
      this.status.set(result);
    } catch {
      this.status.set('error');
    }
  }
}
