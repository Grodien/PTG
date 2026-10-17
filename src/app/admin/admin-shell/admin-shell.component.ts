import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ButtonComponent } from '../../shared/ui';

/**
 * Rahmen/Layout des Admin-Bereichs (Req 7.4).
 *
 * Stellt eine Kopfzeile mit der E-Mail der angemeldeten Person und einem
 * Logout-Button bereit sowie eine einfache Navigation zu den Admin-Unterseiten
 * (Kategorie-, Artikel-Verwaltung, Geräte-Registrierung). Die Kind-Routen
 * werden über das `<router-outlet />` gerendert.
 *
 * Der Logout beendet die Sitzung via {@link AuthService.logout} und kehrt zur
 * Login-Route (`['/admin/login']`) zurück. Die Pfade der Navigation
 * (`['/admin/kategorien']`, `['/admin/artikel']`, `['/admin/geraet']`) werden
 * erst in Task 11.1 im Routing verdrahtet; sie sind hier bewusst stabil
 * vorgegeben.
 *
 * Standalone, OnPush.
 */
@Component({
  selector: 'ptg-admin-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonComponent],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Angemeldeter Benutzer (oder `null`) – reaktiv aus dem AuthService. */
  readonly user = this.auth.user;

  /**
   * Beendet die Admin-Sitzung und kehrt zur Login-Route zurück (Req 7.4).
   */
  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/admin/login']);
  }
}
