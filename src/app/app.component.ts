import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * Wurzel-Komponente der App: schlanke Hülle mit warmer Kopfzeile/Navigation
 * für den Besucherinnen-Bereich und dem zentralen `<router-outlet />`.
 *
 * Die eigentlichen Seiten werden über die Routen-Tabelle (siehe
 * {@link ./app.routes}) lazy geladen. Der Admin-Bereich bringt seine eigene
 * Navigation in der AdminShellComponent mit und nutzt diese Kopfzeile nur als
 * dezenten Rahmen.
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
}
