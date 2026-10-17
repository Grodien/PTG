/**
 * Formatiert einen Müntschi-Betrag mit korrekter Pluralisierung.
 *
 * Reine, seiteneffektfreie Funktion ohne Firebase-/Angular-Abhängigkeiten,
 * damit sie als Property getestet werden kann (Design: Property 21).
 *
 * @param amount Betrag in Müntschis (ganzzahlig, >= 0).
 * @returns "1 Müntschi" bei `amount === 1`, sonst "{amount} Müntschis".
 */
export function formatMuentschi(amount: number): string {
  // Einzahl nur bei exakt 1, ansonsten immer Mehrzahl (Req 11.2).
  return amount === 1 ? '1 Müntschi' : `${amount} Müntschis`;
}
