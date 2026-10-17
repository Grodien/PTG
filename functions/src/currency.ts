/**
 * Formatiert einen Müntschi-Betrag mit korrekter Pluralisierung.
 *
 * Reine, seiteneffektfreie Funktion ohne Firebase-Abhängigkeiten, damit sie
 * (zusammen mit den Buildern) property-basiert getestet werden kann.
 *
 * Verhalten identisch zur Angular-Variante (src/app/core/util/currency.ts).
 * Das Functions-Projekt ist ein eigenständiges TS-Projekt (CommonJS) und kann
 * nicht aus dem Angular-`src` importieren, daher diese Kopie.
 *
 * @param amount Betrag in Müntschis (ganzzahlig, >= 0).
 * @returns "1 Müntschi" bei `amount === 1`, sonst "{amount} Müntschis".
 */
export function formatMuentschi(amount: number): string {
  // Einzahl nur bei exakt 1, ansonsten immer Mehrzahl (Req 11.2).
  return amount === 1 ? "1 Müntschi" : `${amount} Müntschis`;
}
