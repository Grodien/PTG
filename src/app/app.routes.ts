import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';

/**
 * Routen-Tabelle der Papa-to-Go-App (Req 1.2, 7.1–7.3).
 *
 * Alle Komponenten werden als Standalone-Komponenten lazy via `loadComponent`
 * geladen, damit nur der jeweils benötigte Code ins Bundle gelangt. Der
 * Besucherinnen-Bereich (Shop) lebt auf den Top-Level-Pfaden, der geschützte
 * Admin-Bereich hängt hinter dem {@link adminGuard} und rendert seine
 * Unterseiten im `<router-outlet />` der {@link AdminShellComponent}.
 *
 * Die Pfade sind bewusst stabil gehalten, weil Komponenten-Templates direkt
 * darauf verlinken (z. B. `/warenkorb`, `/checkout`, `/admin/kategorien`).
 */
export const routes: Routes = [
  // --- Shop (Besucherinnen) ---------------------------------------------
  {
    path: '',
    loadComponent: () =>
      import('./shop/category-list/category-list.component').then(
        (m) => m.CategoryListComponent,
      ),
  },
  {
    // Der Routen-Parameter `categoryId` bindet via `withComponentInputBinding()`
    // direkt an das `input.required<string>()` der ItemListComponent.
    path: 'kategorie/:categoryId',
    loadComponent: () =>
      import('./shop/item-list/item-list.component').then(
        (m) => m.ItemListComponent,
      ),
  },
  {
    path: 'warenkorb',
    loadComponent: () =>
      import('./shop/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./shop/checkout/checkout.component').then(
        (m) => m.CheckoutComponent,
      ),
  },

  // --- Admin ------------------------------------------------------------
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./admin/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin/admin-shell/admin-shell.component').then(
        (m) => m.AdminShellComponent,
      ),
    children: [
      { path: '', redirectTo: 'bstellige', pathMatch: 'full' },
      {
        path: 'bstellige',
        loadComponent: () =>
          import('./admin/order-list/order-list.component').then(
            (m) => m.OrderListComponent,
          ),
      },
      {
        path: 'kategorien',
        loadComponent: () =>
          import('./admin/category-admin/category-admin.component').then(
            (m) => m.CategoryAdminComponent,
          ),
      },
      {
        path: 'artikel',
        loadComponent: () =>
          import('./admin/item-admin/item-admin.component').then(
            (m) => m.ItemAdminComponent,
          ),
      },
      {
        path: 'geraet',
        loadComponent: () =>
          import(
            './admin/device-registration/device-registration.component'
          ).then((m) => m.DeviceRegistrationComponent),
      },
    ],
  },

  // --- Fallback ---------------------------------------------------------
  { path: '**', redirectTo: '' },
];
