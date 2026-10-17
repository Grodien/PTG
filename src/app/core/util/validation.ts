/**
 * Reine Validierungs-Utilities für Artikel-Stammdaten.
 *
 * Alle Funktionen sind seiteneffektfrei und ohne Firebase-/Angular-Abhängigkeiten,
 * damit sie als Properties getestet werden können (Design: Property 4 und Property 20).
 */

/** Ergebnis der Kosten-Validierung. */
export type CostValidationResult =
  | { ok: true; value: number }
  | { ok: false; reason: string };

/**
 * Eingabe für die Artikel-Validierung.
 *
 * Bewusst locker typisiert (`cost: unknown`), weil die Werte z. B. aus
 * Formularfeldern stammen und noch nicht geprüft sind.
 */
export interface ItemInput {
  title: string;
  description?: string;
  cost: unknown;
  categoryId?: string;
}

/** Normalisierter Artikel nach erfolgreicher Validierung. */
export interface ValidatedItem {
  title: string;
  description: string;
  cost: number;
  categoryId?: string;
}

/** Feldbezogene Fehlermeldungen der Artikel-Validierung. */
export interface ItemValidationErrors {
  title?: string;
  cost?: string;
}

/** Ergebnis der Artikel-Validierung mit feldbezogenen Hinweisen. */
export type ValidationResult =
  | { ok: true; value: ValidatedItem }
  | { ok: false; errors: ItemValidationErrors };

/**
 * Validiert die Kosten eines Artikels.
 *
 * Gültig ist ausschliesslich eine ganze, nicht-negative Zahl (Req 2.2, 9.5).
 * Abgelehnt werden damit Nicht-Zahlen, NaN, Infinity, Nachkommastellen und
 * negative Werte.
 *
 * @param input Ungeprüfter Eingabewert (z. B. aus einem Formularfeld).
 * @returns `{ ok: true, value }` mit der geprüften Zahl, sonst `{ ok: false, reason }`.
 */
export function validateCost(input: unknown): CostValidationResult {
  // Nur echte Zahlen zulassen (keine Strings, Booleans, null, undefined, ...).
  if (typeof input !== 'number') {
    return { ok: false, reason: 'Kosten müssen eine Zahl sein.' };
  }

  // NaN und Infinity sind zwar vom Typ "number", aber keine gültigen Beträge.
  if (!Number.isFinite(input)) {
    return { ok: false, reason: 'Kosten müssen eine endliche Zahl sein.' };
  }

  // Müntschis sind ganzzahlig – Nachkommastellen sind nicht erlaubt.
  if (!Number.isInteger(input)) {
    return { ok: false, reason: 'Kosten müssen eine ganze Zahl sein.' };
  }

  // Nicht-negativ: 0 ist erlaubt, negative Werte nicht.
  if (input < 0) {
    return { ok: false, reason: 'Kosten dürfen nicht negativ sein.' };
  }

  return { ok: true, value: input };
}

/**
 * Validiert einen Artikel vor dem Speichern.
 *
 * Pflichtfelder sind ein nicht-leerer Titel (nach Trimmen) und gültige Kosten
 * (geprüft via {@link validateCost}). Die Beschreibung ist optional und wird
 * auf "" normalisiert (Req 9.4, 9.5, 2.2).
 *
 * @param input Ungeprüfte Artikel-Eingabe.
 * @returns `{ ok: true, value }` mit normalisiertem Artikel, sonst
 *          `{ ok: false, errors }` mit feldbezogenen Hinweisen.
 */
export function validateItem(input: ItemInput): ValidationResult {
  const errors: ItemValidationErrors = {};

  // Titel: muss vorhanden und nach Trimmen nicht leer sein (Req 9.4).
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (title.length === 0) {
    errors.title = 'Titel ist erforderlich.';
  }

  // Kosten: gültige ganze, nicht-negative Zahl (Req 9.5, 2.2).
  const cost = validateCost(input.cost);
  if (!cost.ok) {
    errors.cost = cost.reason;
  }

  // Bei irgendeinem Fehler ablehnen und die gesammelten Hinweise zurückgeben.
  if (errors.title !== undefined || errors.cost !== undefined) {
    return { ok: false, errors };
  }

  // Beschreibung ist optional und wird auf einen leeren String normalisiert.
  const description =
    typeof input.description === 'string' ? input.description : '';

  const value: ValidatedItem = {
    title,
    description,
    // `cost.ok` ist hier garantiert true – TypeScript kennt den Wert aber nicht,
    // deshalb der sichere Zugriff über die zuvor geprüfte Variable.
    cost: (cost as { ok: true; value: number }).value,
  };

  if (input.categoryId !== undefined) {
    value.categoryId = input.categoryId;
  }

  return { ok: true, value };
}
