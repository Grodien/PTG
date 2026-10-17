import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { CartService } from './core/services/cart.service';

/**
 * Wurzel-Komponente der App: schlanke Hülle mit warmer Kopfzeile/Navigation
 * für den Besucherinnen-Bereich und dem zentralen `<router-outlet />`.
 *
 * Die Kopfzeile zeigt im Warenkorb-Link einen Zähler mit der Anzahl Artikel
 * im Warenkorb (reaktiv aus dem {@link CartService}). Die eigentlichen Seiten
 * werden über die Routen-Tabelle (siehe {@link ./app.routes}) lazy geladen.
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

  /** Warenkorb-Service für den Artikel-Zähler in der Kopfzeile. */
  private readonly cart = inject(CartService);

  /** Anzahl Artikel im Warenkorb (reaktiv). */
  readonly cartCount = this.cart.itemCount;
}
