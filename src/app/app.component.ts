import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';

/**
 * Wurzel-Komponente der App: schlanke Hülle mit warmer, am oberen Rand
 * klebender Kopfzeile (sticky) und dem zentralen `<router-outlet />`.
 *
 * Die Kopfzeile zeigt den Warenkorb-Link stets sichtbar (mit Artikel-Zähler)
 * und – sobald der Administrator eingeloggt ist – zusätzlich einen direkten
 * Admin-Link. Die eigentlichen Seiten werden über die Routen-Tabelle lazy
 * geladen.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly title = 'Papa-to-Go';

  private readonly cart = inject(CartService);
  private readonly auth = inject(AuthService);

  /** Anzahl Artikel im Warenkorb (reaktiv). */
  readonly cartCount = this.cart.itemCount;

  /** `true`, wenn der Administrator eingeloggt ist – blendet den Admin-Link ein. */
  readonly isAdmin = this.auth.isAdmin;
}
