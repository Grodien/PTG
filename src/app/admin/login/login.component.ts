import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ButtonComponent } from '../../shared/ui';

/**
 * Login-Einstieg des Admin-Bereichs (Req 7.1).
 *
 * Bietet einer nicht authentifizierten Person den Google-Login an. Nach einem
 * erfolgreichen Login entscheidet der {@link AuthService}-Zustand über das
 * weitere Vorgehen:
 * - Ist die angemeldete Person Admin ({@link AuthService.isAdmin}), wird zur
 *   Admin-Startseite (`['/admin']`) weitergeleitet.
 * - Meldet sich eine Nicht-Admin-Person an, zeigt die Komponente einen
 *   freundlichen berndeutschen "kein Zugriff"-Hinweis und bietet die Abmeldung
 *   an. Die eigentliche Zugriffskontrolle übernimmt der `adminGuard`; dieser
 *   Hinweis dient nur der UX (unterstützt Req 7.3).
 *
 * Standalone, OnPush. Der reaktive Weiterleitungs-{@link effect} reagiert auf
 * Änderungen des Auth-Signals.
 */
@Component({
  selector: 'ptg-admin-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Angemeldeter Benutzer (oder `null`) – reaktiv aus dem AuthService. */
  readonly user = this.auth.user;

  /** `true`, wenn der angemeldete Benutzer Admin ist. */
  readonly isAdmin = this.auth.isAdmin;

  /** Läuft gerade ein Login-Popup? Dient dem Deaktivieren des Buttons. */
  readonly busy = signal(false);

  /** Freundliche Fehlermeldung, falls der Login scheitert (sonst `null`). */
  readonly errorMessage = signal<string | null>(null);

  /**
   * Leitet Admins nach erfolgreichem Login automatisch auf die Admin-Startseite
   * weiter. Der Effect lauscht auf das `isAdmin`-Signal und greift auch, wenn
   * eine bereits angemeldete Admin-Person die Login-Seite direkt aufruft.
   */
  private readonly redirectEffect = effect(() => {
    if (this.isAdmin()) {
      void this.router.navigate(['/admin']);
    }
  });

  ngOnDestroy(): void {
    this.redirectEffect.destroy();
  }

  /**
   * Startet den Google-Login. Bei Erfolg übernimmt der
   * {@link redirectEffect} eine allfällige Weiterleitung; bei Misserfolg wird
   * eine berndeutsche Hinweismeldung angezeigt.
   */
  async login(): Promise<void> {
    this.errorMessage.set(null);
    this.busy.set(true);
    try {
      await this.auth.loginWithGoogle();
    } catch {
      this.errorMessage.set(
        'Hoppla, s\u2019Aalogge het nid klappet. Probier\u2019s doch grad nomal. \uD83C\uDF38',
      );
    } finally {
      this.busy.set(false);
    }
  }

  /** Meldet eine Nicht-Admin-Person wieder ab. */
  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
