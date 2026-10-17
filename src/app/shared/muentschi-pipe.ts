import { Pipe, PipeTransform } from '@angular/core';

import { formatMuentschi } from '../core/util/currency';

/**
 * Formatiert einen Betrag als Müntschi-Währung für die Anzeige im Template.
 *
 * Delegiert an die reine Funktion `formatMuentschi`, damit die
 * Pluralisierungs-Logik an einer Stelle bleibt und property-getestet werden
 * kann (Design: Property 21, Req 11.2).
 *
 * Verwendung im Template: `{{ item.cost | muentschi }}` → z. B. "3 Müntschis".
 */
@Pipe({
  name: 'muentschi',
  standalone: true,
})
export class MuentschiPipe implements PipeTransform {
  transform(amount: number): string {
    return formatMuentschi(amount);
  }
}
