/**
 * Seed script: create the nine base categories in Firestore.
 *
 * Writes exactly the categories defined in {@link BASE_CATEGORIES} to the
 * `categories` collection. Each document has the shape:
 *
 *   { name: string, order: number (0..8), createdAt: <server timestamp> }
 *
 * The write is idempotent: existing categories (matched by `name`) are updated
 * in place rather than duplicated, so re-running the script keeps exactly the
 * nine base categories.
 *
 * _Requirements: 1.1_
 * Design: "Basiskategorien (Seed, Req 1.1)".
 *
 * --------------------------------------------------------------------------
 * How to run
 * --------------------------------------------------------------------------
 * This script uses Application Default Credentials (ADC) against the project
 * `ptg-papa-to-go`. Provide credentials in one of these ways:
 *
 *   1. A service-account key file:
 *        export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *
 *   2. gcloud / Firebase ADC (local developer login):
 *        gcloud auth application-default login
 *        # or: firebase login  (then use an environment that exposes ADC)
 *
 * Then run it with ts-node (no build step required):
 *
 *        cd scripts
 *        npm install
 *        npm run seed
 *
 * Or compile and run with plain node:
 *
 *        cd scripts
 *        npx tsc
 *        node dist/seed-categories.js
 *
 * NOTE: Do not run this before the Firestore database exists for the project
 * (that is a deploy-time step). Running it against a project without a
 * Firestore database will fail.
 * --------------------------------------------------------------------------
 */

import {
  applicationDefault,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import { BASE_CATEGORIES, buildSeedCategories } from './categories';

const PROJECT_ID = 'ptg-papa-to-go';
const COLLECTION = 'categories';

/**
 * Upsert the nine base categories into Firestore.
 *
 * For each base category, we look up an existing document by `name`. If found,
 * we update its `order` (and leave `createdAt` untouched); otherwise we create
 * a new document with a server `createdAt` timestamp. This guarantees exactly
 * nine base-category documents regardless of how many times the script runs.
 */
async function seedCategories(): Promise<void> {
  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
      projectId: PROJECT_ID,
    });
  }

  const db = getFirestore();
  const col = db.collection(COLLECTION);
  const seeds = buildSeedCategories();

  let created = 0;
  let updated = 0;

  for (const seed of seeds) {
    const existing = await col.where('name', '==', seed.name).limit(1).get();

    if (existing.empty) {
      await col.add({
        name: seed.name,
        order: seed.order,
        createdAt: FieldValue.serverTimestamp(),
      });
      created += 1;
    } else {
      await existing.docs[0].ref.set({ order: seed.order }, { merge: true });
      updated += 1;
    }
  }

  console.log(
    `Seed complete for project "${PROJECT_ID}": ` +
      `${created} created, ${updated} updated ` +
      `(${BASE_CATEGORIES.length} base categories total).`,
  );
}

// Only run when invoked directly (so tests can import without side effects).
if (require.main === module) {
  seedCategories()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

export { seedCategories };
