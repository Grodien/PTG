import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

import { isAdminEmail } from '../services/auth.service';

/**
 * Schützt die Admin-Routen: Nur die verifizierte Admin-E-Mail darf aktivieren,
 * andernfalls wird auf die Login-Seite umgeleitet.
 *
 * Die Entscheidung wird aus dem {@link authState}-Observable abgeleitet (erster
 * aufgelöster Wert via `take(1)`), damit beim ersten Laden kein Fehlnegativ
 * entsteht, solange der Auth-Zustand noch nicht initialisiert ist – ein
 * synchron gelesenes Signal wäre zu diesem Zeitpunkt möglicherweise noch `null`.
 *
 * @returns `true` für die Admin-Benutzerin, sonst eine {@link UrlTree}-Weiterleitung
 *   nach `/admin/login`.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map((user): boolean | UrlTree => {
      const erlaubt = isAdminEmail(user?.email) && !!user?.emailVerified;
      return erlaubt ? true : router.createUrlTree(['/admin/login']);
    }),
  );
};
