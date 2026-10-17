import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';

import { routes } from './app.routes';

/**
 * Öffentliche Firebase-Konfiguration.
 *
 * Platzhalter — die echten Werte stammen aus dem noch anzulegenden
 * Firebase-Projekt (siehe Tasks 1.2 / 11.1). Bis dahin ermöglichen diese
 * Platzhalter das Verdrahten der AngularFire-Provider, ohne den Build zu
 * blockieren.
 */
export const firebaseConfig = {
  apiKey: 'TODO_API_KEY',
  authDomain: 'TODO.firebaseapp.com',
  projectId: 'TODO_PROJECT_ID',
  storageBucket: 'TODO.appspot.com',
  messagingSenderId: 'TODO_SENDER_ID',
  appId: 'TODO_APP_ID',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideMessaging(() => getMessaging()),
  ],
};
