/**
 * Cloud Functions Einstiegspunkt für PapaToGo (PTG).
 *
 * Firebase Functions 2nd gen. Die eigentlichen Trigger (Push + E-Mail bei
 * neuer Bestellung) werden in Task 14 implementiert und hier exportiert.
 */

import { initializeApp } from "firebase-admin/app";

initializeApp();

// Trigger-Exporte folgen in Task 14 (z. B. export { onOrderCreated } from "./onOrderCreated";)
