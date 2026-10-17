/**
 * Base category definitions for PapaToGo (PTG).
 *
 * This module holds the pure, side-effect-free data definition so that it can
 * be imported by both the seed script and the smoke test (task 15.3) without
 * initializing firebase-admin or touching Firestore.
 *
 * _Requirements: 1.1_
 * Design: "Basiskategorien (Seed, Req 1.1)".
 */

/**
 * The nine base categories, in their canonical display order.
 *
 * The exact strings and their order are significant: the `order` field written
 * to Firestore is the index of each name in this array (0..8), which gives a
 * stable sort order in the shop.
 */
export const BASE_CATEGORIES: readonly string[] = [
  'Essen',
  'Trinken',
  'Massage',
  'Brettspiel',
  'Umarmung/Kuscheln',
  'Snacks/Süsses',
  'Erledigung/Botengang',
  'Entertainment/Film',
  'Ruhe/Me-Time',
] as const;

/** Shape of a category document as written by the seed script (sans server timestamp). */
export interface SeedCategory {
  name: string;
  order: number;
}

/**
 * Build the ordered list of category documents to seed.
 *
 * Pure function: maps {@link BASE_CATEGORIES} to `{ name, order }` pairs where
 * `order` is the array index (0..8). `createdAt` is added at write time by the
 * seed script via a Firestore server timestamp.
 */
export function buildSeedCategories(): SeedCategory[] {
  return BASE_CATEGORIES.map((name, order) => ({ name, order }));
}
