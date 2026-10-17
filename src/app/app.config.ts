import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

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
  apiKey: 'AIzaSyD2lv2myn6degZKTPsXey-wZV0pP0u_AA8',
  authDomain: 'ptg-papa-to-go.firebaseapp.com',
  projectId: 'ptg-papa-to-go',
  storageBucket: 'ptg-papa-to-go.firebasestorage.app',
  messagingSenderId: '136510299124',
  appId: '1:136510299124:web:b8fe5b29e61f3133cdb7a1',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideMessaging(() => getMessaging()),
  ],
};
