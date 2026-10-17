import { Injectable, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  GoogleAuthProvider,
  User,
  authState,
  signInWithPopup,
  signOut,
} from '@angular/fire/auth';

/** E-Mail-Adresse der einzigen Administratorin. */
export const ADMIN_EMAIL = 'thomas.bomatter@gmail.com';

/**
 * Reines Prädikat: Entscheidet, ob die übergebene E-Mail der Admin-Adresse
 * entspricht.
 *
 * Bewusst als frei stehende, seiteneffektfreie Funktion ausgelagert, damit sie
 * ohne Angular-/Firebase-Kontext property-basiert getestet werden kann
 * (Property 16).
 *
 * @param email Zu prüfende E-Mail-Adresse (oder `null`/`undefined`).
 * @returns `true`, wenn die E-Mail exakt der Admin-Adresse entspricht.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}

/**
 * Kapselt den Firebase-Authentifizierungszustand und den Admin-Login.
 *
 * Der {@link authState}-Observable wird über {@link toSignal} in ein Signal
 * überführt, sodass Komponenten reaktiv auf den angemeldeten Benutzer und den
 * Admin-Status zugreifen können. Der Zugriff auf geschützte Bereiche wird vom
 * `adminGuard` anhand desselben Zustands kontrolliert.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);

  /**
   * Aktuell angemeldeter Firebase-Benutzer oder `null`, falls niemand
   * angemeldet ist. Startwert `null`, bis der Auth-Zustand aufgelöst ist.
   */
  readonly user: Signal<User | null> = toSignal(authState(this.auth), {
    initialValue: null,
  });

  /**
   * `true`, wenn der angemeldete Benutzer die Admin-E-Mail besitzt und diese
   * verifiziert ist. Sonst `false`.
   */
  readonly isAdmin: Signal<boolean> = computed(() => {
    const user = this.user();
    return isAdminEmail(user?.email) && !!user?.emailVerified;
  });

  /**
   * Startet den Google-Login per Popup.
   *
   * @throws Lehnt bei abgebrochenem oder fehlgeschlagenem Login ab; die
   *   Login-Komponente behandelt den Fehlerfall.
   */
  async loginWithGoogle(): Promise<void> {
    await signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  /** Meldet den aktuellen Benutzer ab. */
  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}
