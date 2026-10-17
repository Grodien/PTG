# Implementation Plan: PapaToGo (PTG)

## Übersicht

Dieser Plan setzt das Design schrittweise um: zuerst Projekt-Scaffolding (Angular + Firebase CLI/`firebase init`), dann reine, property-basiert testbare Logik (Utilities, `CartService`), danach Firestore-Services, Shop- und Admin-Komponenten, Security Rules, Cloud Functions (Push + E-Mail), Service Worker und Seed. Jeder Schritt baut auf dem vorherigen auf und endet mit der Verdrahtung ins Routing/die App. Property-basierte Tests (mit `fast-check`, mind. 100 Iterationen) begleiten jede reine Logikeinheit und referenzieren die Design-Property im Format **Feature: papa-to-go, Property {Nummer}**. Zum Schluss folgen Git-Setup und das Firebase-Deployment mit öffentlicher URL.

## Tasks

- [x] 1. Projekt- und Firebase-Grundgerüst aufsetzen
  - [x] 1.1 Angular-Workspace scaffolden
    - Angular 18+ Workspace `ptg` mit Standalone-Komponenten, Routing und SCSS erstellen (`ng new ptg --standalone --routing --style=scss`)
    - AngularFire installieren (`ng add @angular/fire`), `app.config.ts` mit `provideFirebaseApp`, `provideFirestore`, `provideAuth`, `provideMessaging` vorbereiten
    - `fast-check` als Dev-Dependency für Property-Tests ergänzen
    - Ordnerstruktur anlegen: `src/app/core/{models,services,guards,util}`, `src/app/shop`, `src/app/admin`, `src/app/shared`
    - _Requirements: 12.1_

  - [x] 1.2 Firebase-Projekt per CLI anlegen und initialisieren
    - `firebase login`, dann `firebase projects:create ptg-papa-to-go --display-name "PapaToGo"`
    - `firebase init hosting firestore functions` ausführen: Hosting `public` auf `dist/ptg/browser`, SPA-Rewrite aller Routen auf `/index.html` mit Ausnahme für `firebase-messaging-sw.js`; Firestore Rules + Indexes; Functions in TypeScript
    - `.firebaserc` auf das angelegte Projekt setzen, `firebase.json` prüfen/anpassen
    - _Requirements: 12.1, 12.2_

- [x] 2. Datenmodelle definieren
  - [x] 2.1 TypeScript-Interfaces für Kern-Datenmodelle erstellen
    - `Category`, `Item`, `Order`, `OrderLine`, `PushTokenDoc`, `CartLine`, `CartState`, `OrderDraft` in `core/models/` definieren
    - Invariante dokumentieren: `cost`/`total` ganzzahlig und ≥ 0, `quantity` ≥ 1, `itemCount` ≥ 1
    - _Requirements: 2.2, 4.2_

- [x] 3. Reine Utility-Logik (Währung & Validierung)
  - [x] 3.1 `formatMuentschi` implementieren
    - `core/util/currency.ts`: `formatMuentschi(amount)` → "1 Müntschi" bei amount === 1, sonst "{amount} Müntschis"
    - _Requirements: 11.2_

  - [ ]* 3.2 Property-Test für `formatMuentschi`
    - **Feature: papa-to-go, Property 21: Korrekte Pluralisierung der Währung**
    - **Validates: Requirements 11.2**

  - [x] 3.3 `validateCost` und `validateItem` implementieren
    - `core/util/validation.ts`: `validateCost(input)` akzeptiert nur Integer ≥ 0; `validateItem(input)` verlangt nicht-leeren Titel und gültige Kosten
    - _Requirements: 9.4, 9.5, 2.2_

  - [ ]* 3.4 Property-Test für `validateCost`
    - **Feature: papa-to-go, Property 4: Kosten-Invariante und -Validierung**
    - **Validates: Requirements 2.2, 9.5**

  - [ ]* 3.5 Property-Test für `validateItem` (Pflichtfelder)
    - **Feature: papa-to-go, Property 20: Pflichtfeld-Validierung bei Artikeln**
    - **Validates: Requirements 9.4**

- [x] 4. Warenkorb-Logik (rein, Signals)
  - [x] 4.1 `CartService` implementieren
    - `core/services/cart.service.ts`: Signals `lines`, `total`, `itemCount`, `canCheckout`; Methoden `add(item)`, `remove(itemId)`, `clear()`, `toOrderDraft(note)`
    - `add`: neuer Artikel → quantity 1; vorhandener Artikel → quantity +1; `total` = Summe `cost*quantity`; `canCheckout` false bei leerem Warenkorb
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2_

  - [ ]* 4.2 Property-Test: Hinzufügen zum Warenkorb
    - **Feature: papa-to-go, Property 5: Hinzufügen zum Warenkorb**
    - **Validates: Requirements 3.1**

  - [ ]* 4.3 Property-Test: Mehrfaches Hinzufügen erhöht nur die Menge
    - **Feature: papa-to-go, Property 6: Mehrfaches Hinzufügen erhöht nur die Menge**
    - **Validates: Requirements 3.2**

  - [ ]* 4.4 Property-Test: Entfernen ist Umkehrung des Hinzufügens
    - **Feature: papa-to-go, Property 7: Entfernen ist Umkehrung des Hinzufügens**
    - **Validates: Requirements 3.3**

  - [ ]* 4.5 Property-Test: Warenkorbsumme ist konsistent
    - **Feature: papa-to-go, Property 8: Warenkorbsumme ist konsistent**
    - **Validates: Requirements 3.4**

  - [ ]* 4.6 Property-Test: Checkout-Verfügbarkeit hängt an Warenkorb-Füllung
    - **Feature: papa-to-go, Property 9: Checkout-Verfügbarkeit hängt an Warenkorb-Füllung**
    - **Validates: Requirements 3.5**

  - [ ]* 4.7 Property-Test: Bestellungsentwurf spiegelt den Warenkorb
    - **Feature: papa-to-go, Property 10: Bestellungsentwurf spiegelt den Warenkorb**
    - **Validates: Requirements 4.2**

- [~] 5. Checkpoint — Reine Logik verifizieren
  - Sicherstellen, dass alle Tests der reinen Logik (Utilities, CartService) grün sind; bei Fragen die Benutzerin fragen.

- [ ] 6. Firestore-Daten-Services
  - [~] 6.1 `CategoryService` (CRUD categories) implementieren
    - `core/services/category.service.ts`: Lesen aller Kategorien, `create(name)`, `rename(id, name)`, `delete(id)` via AngularFire/Firestore
    - _Requirements: 1.2, 8.1, 8.2, 8.3_

  - [ ]* 6.2 Property-Test: Kategorie-CRUD Round-Trip (Firestore-Emulator)
    - **Feature: papa-to-go, Property 17: Kategorie-CRUD Round-Trip**
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [~] 6.3 `ItemService` (CRUD items, Query nach categoryId) implementieren
    - `core/services/item.service.ts`: Query der Artikel nach `categoryId`, `create(item)`, `update(id, patch)`, `delete(id)`; Kaskaden-Löschung aller Artikel einer Kategorie als Batch
    - _Requirements: 1.3, 1.4, 9.1, 9.2, 9.3, 8.4_

  - [ ]* 6.4 Property-Test: Artikelfilterung nach Kategorie
    - **Feature: papa-to-go, Property 2: Artikelfilterung nach Kategorie**
    - **Validates: Requirements 1.3, 1.4**

  - [ ]* 6.5 Property-Test: Artikel-CRUD Round-Trip (Firestore-Emulator)
    - **Feature: papa-to-go, Property 19: Artikel-CRUD Round-Trip**
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [ ]* 6.6 Property-Test: Kaskaden-Löschung hinterlässt keine Waisen (Firestore-Emulator)
    - **Feature: papa-to-go, Property 18: Kaskaden-Löschung hinterlässt keine Waisen**
    - **Validates: Requirements 8.4**

  - [~] 6.7 `OrderService` (Checkout → Firestore) implementieren
    - `core/services/order.service.ts`: `create(draft)` speichert Order (`lines`, `total`, `itemCount`, `note`, `createdAt`), gibt `orderId` zurück, wirft bei Fehler
    - _Requirements: 4.2, 4.3_

  - [ ]* 6.8 Property-Test: Push-/Order-Konsistenz des Entwurfs im Service-Mapping
    - **Feature: papa-to-go, Property 10: Bestellungsentwurf spiegelt den Warenkorb** (Service-Mapping-Ebene)
    - **Validates: Requirements 4.2**

- [ ] 7. Auth & Guard
  - [~] 7.1 `AuthService` und `adminGuard` implementieren
    - `core/services/auth.service.ts`: `user`-Signal, `isAdmin`-Signal (`email === 'thomas.bomatter@gmail.com'`), `loginWithGoogle()`, `logout()`
    - `core/guards/admin.guard.ts`: `CanActivate` nur für Admin-E-Mail, sonst Verweigerung/Weiterleitung zum Login
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 7.2 Property-Test: Admin-Zugriff nur für die Admin-E-Mail
    - **Feature: papa-to-go, Property 16: Admin-Zugriff nur für die Admin-E-Mail** (reines `isAdmin`-Prädikat)
    - **Validates: Requirements 7.2, 7.3**

- [~] 8. Checkpoint — Daten-Services & Auth verifizieren
  - Sicherstellen, dass Service- und Emulator-Tests grün sind; bei Fragen die Benutzerin fragen.

- [ ] 9. Shop-Komponenten (Besucherinnen-Bereich)
  - [~] 9.1 `MuentschiPipe` und gemeinsame UI (Bestätigungsdialog) erstellen
    - `shared/muentschi-pipe.ts` nutzt `formatMuentschi`; `shared/ui/` mit Button- und Bestätigungsdialog-Komponente
    - _Requirements: 11.1, 11.2_

  - [~] 9.2 `CategoryListComponent` implementieren
    - Zeigt alle Kategorien aus `CategoryService`; Auswahl navigiert zur Artikelliste
    - _Requirements: 1.2_

  - [ ]* 9.3 Property-Test: Kategorie-Anzeige ist vollständig
    - **Feature: papa-to-go, Property 1: Kategorie-Anzeige ist vollständig**
    - **Validates: Requirements 1.2**

  - [~] 9.4 `ItemListComponent` und `ItemCardComponent` implementieren
    - `ItemListComponent`: Artikel der gewählten Kategorie, Empty-State-Hinweis bei leerer Kategorie
    - `ItemCardComponent`: Titel, Beschreibung, Kosten (Müntschi-Pipe), Aktion "In Warenkorb" → `CartService.add`
    - _Requirements: 1.3, 1.4, 2.1, 2.2, 3.1_

  - [ ]* 9.5 Property-Test: Artikel-Darstellung enthält alle Pflichtangaben
    - **Feature: papa-to-go, Property 3: Artikel-Darstellung enthält alle Pflichtangaben**
    - **Validates: Requirements 2.1**

  - [~] 9.6 `CartComponent` implementieren
    - Warenkorb-Linien mit Menge, Entfernen, Summe (Müntschi-Pipe), Checkout-Button entsprechend `canCheckout`
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [~] 9.7 `CheckoutComponent` implementieren
    - Optionales Notizfeld, Absenden via `OrderService.create(cart.toOrderDraft(note))`; Erfolg: Bestätigung + `cart.clear()`; Fehler: Fehlermeldung, Warenkorb unverändert
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 9.8 Property-Test: Erfolgreicher Checkout leert den Warenkorb
    - **Feature: papa-to-go, Property 11: Erfolgreicher Checkout leert den Warenkorb**
    - **Validates: Requirements 4.5**

  - [ ]* 9.9 Property-Test: Fehlgeschlagener Checkout lässt den Warenkorb unverändert
    - **Feature: papa-to-go, Property 12: Fehlgeschlagener Checkout lässt den Warenkorb unverändert**
    - **Validates: Requirements 4.6**

  - [ ]* 9.10 Unit-Tests für Checkout-Szenarien
    - 4.1 Notizfeld wird gerendert; 4.3 Bestellung ohne Namen/Auth anlegbar; 4.4 Erfolgsbestätigung nach Speichern
    - _Requirements: 4.1, 4.3, 4.4_

- [ ] 10. Admin-Komponenten (Admin-Bereich)
  - [~] 10.1 `LoginComponent` und `AdminShellComponent` implementieren
    - `LoginComponent`: Google-Login-Button (bei nicht authentifiziertem Admin-Aufruf)
    - `AdminShellComponent`: Rahmen mit Logout → beendet Sitzung, zurück zum Login
    - _Requirements: 7.1, 7.4_

  - [ ]* 10.2 Unit-Tests für Login/Logout-Flow
    - 7.1 Unauthentifizierter Aufruf zeigt Google-Login; 7.4 Logout beendet Sitzung und zeigt Login
    - _Requirements: 7.1, 7.4_

  - [~] 10.3 `CategoryAdminComponent` implementieren
    - CRUD Kategorien über `CategoryService`; Bestätigungsdialog vor Kaskaden-Löschung (Kategorie mit Artikeln)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 10.4 Unit-Test: Bestätigungsdialog vor Kaskaden-Löschung
    - 8.4 Dialog erscheint vor Löschung einer Kategorie mit zugeordneten Artikeln
    - _Requirements: 8.4_

  - [~] 10.5 `ItemAdminComponent` implementieren
    - CRUD Artikel über `ItemService` mit Formularvalidierung via `validateItem`/`validateCost`; Hinweise bei fehlenden/ungültigen Feldern
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [~] 10.6 `DeviceRegistrationComponent` und `MessagingService` implementieren
    - `core/services/messaging.service.ts`: `registerDevice()` registriert SW, fragt Permission + Token an, speichert Token in `pushTokens/admin`
    - `DeviceRegistrationComponent`: Auslöser + Hinweis bei verweigerter Berechtigung (kein Token speichern)
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 10.7 Unit-Test: Verweigerte Benachrichtigungs-Berechtigung
    - 10.3 Hinweis anzeigen, kein Token speichern (Mock der FCM-/Notification-APIs)
    - _Requirements: 10.3_

- [ ] 11. Routing & App-Verdrahtung
  - [~] 11.1 `app.routes.ts` und `app.config.ts` verdrahten
    - Shop-Routen (Kategorieliste, Artikelliste, Warenkorb, Checkout) und Admin-Routen (Login, Admin-Shell mit `adminGuard`, Kategorie-/Artikel-Admin, Geräte-Registrierung) verbinden
    - Firebase-Provider in `app.config.ts` mit öffentlicher Firebase-Config konfigurieren
    - _Requirements: 1.2, 7.1, 7.2, 7.3_

- [~] 12. Checkpoint — Frontend verdrahtet
  - Sicherstellen, dass alle Frontend-Tests grün sind und die App baut (`ng build`); bei Fragen die Benutzerin fragen.

- [x] 13. Firestore Security Rules
  - [x] 13.1 Security Rules implementieren
    - `firestore.rules`: `isAdmin()`-Prädikat (E-Mail + email_verified); `categories`/`items` öffentlich lesbar, nur Admin schreibt; `orders` öffentlich `create` mit `isValidOrder`, nur Admin liest, kein Client-Update/Delete; `pushTokens` nur Admin
    - _Requirements: 4.3, 7.2, 7.3, 8.1, 9.1, 10.2_

  - [ ]* 13.2 Security-Rules-Tests mit Emulator
    - `@firebase/rules-unit-testing`: öffentliches Anlegen von Bestellungen erlaubt; Lesen `orders`/`pushTokens` und Schreiben `categories`/`items` nur Admin; Client-Update/Delete auf `orders` abgelehnt
    - _Requirements: 4.3, 7.2, 7.3_

- [ ] 14. Cloud Functions (Push + E-Mail)
  - [~] 14.1 Reine Builder `buildPushPayload` und `buildEmailBody` implementieren
    - `functions/src/push.ts`: `buildPushPayload(order)` → Titel + Body mit `itemCount`, `formatMuentschi(total)` und optionaler Notiz
    - `functions/src/email.ts`: `buildEmailBody(order)` → Subject + Text mit Artikelliste, Total und optionaler Notiz
    - _Requirements: 5.1, 5.2, 6.1_

  - [ ]* 14.2 Property-Test: Push-Payload enthält Summe und Artikelanzahl
    - **Feature: papa-to-go, Property 13: Push-Payload enthält Summe und Artikelanzahl**
    - **Validates: Requirements 5.1**

  - [ ]* 14.3 Property-Test: Notiz wird in Push-Payload aufgenommen
    - **Feature: papa-to-go, Property 14: Notiz wird in Push-Payload aufgenommen**
    - **Validates: Requirements 5.2**

  - [ ]* 14.4 Property-Test: E-Mail-Inhalt enthält alle Bestelldetails
    - **Feature: papa-to-go, Property 15: E-Mail-Inhalt enthält alle Bestelldetails**
    - **Validates: Requirements 6.1**

  - [~] 14.5 FCM-Versand und Nodemailer-Transport implementieren
    - `push.ts`: `sendPush(token, payload)` via FCM; `email.ts`: Nodemailer-SMTP-Transport mit Secrets (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`), `sendEmail(body)` an `thomas.bomatter@bluewin.ch`
    - _Requirements: 5.1, 6.1_

  - [~] 14.6 `onOrderCreated`-Trigger implementieren und exportieren
    - `functions/src/onOrderCreated.ts`: liest `pushTokens/admin`; bei Token → `sendPush` + `pushSent: true`, kein Token → überspringen ohne Fehler; danach `sendEmail` (Best Effort) + `emailSent: true`; Fehler loggen; Export in `functions/src/index.ts`
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2_

  - [ ]* 14.7 Integrations-/Mock-Tests für Trigger-Best-Effort
    - 5.3 Kein Token → Order bleibt gültig, Function ohne Fehler; 6.2 E-Mail-Transport wirft → Function loggt, gilt als erfolgreich
    - _Requirements: 5.3, 6.2_

- [x] 15. Service Worker & Seed
  - [x] 15.1 Service Worker für Background-Push erstellen
    - `src/firebase-messaging-sw.js`: Firebase-Messaging-Compat-SDK importieren, App mit öffentlicher Config initialisieren, `onBackgroundMessage` zur Anzeige der Benachrichtigung behandeln
    - _Requirements: 10.1, 5.1_

  - [x] 15.2 Seed-Skript für Basiskategorien erstellen
    - Admin-SDK-Skript, das die neun Basiskategorien anlegt: Essen, Trinken, Massage, Brettspiel, Umarmung/Kuscheln, Snacks/Süsses, Erledigung/Botengang, Entertainment/Film, Ruhe/Me-Time
    - _Requirements: 1.1_

  - [ ]* 15.3 Smoke-Test: Seed enthält alle neun Basiskategorien
    - Prüft, dass das Seed-Skript exakt die neun definierten Kategorien erzeugt
    - _Requirements: 1.1_

- [ ] 16. Git-Repository einrichten
  - [-] 16.1 Repo initialisieren und mit Remote verbinden
    - `git init` (falls nötig), `.gitignore` für Angular/Node/Firebase, Remote `git@github.com:Grodien/PTG.git` hinzufügen, initialen Commit erstellen und auf einen Branch pushen
    - _Requirements: 12.1_

- [ ] 17. Deployment auf Firebase
  - [~] 17.1 Build und Deploy ausführen
    - `firebase functions:secrets:set` für `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`; Google-Auth-Provider aktiviert und Firestore-DB im Production-Mode vorausgesetzt
    - `ng build --configuration production`, dann `firebase deploy` (Hosting + Firestore Rules + Functions); öffentliche URL (z. B. `https://ptg-papa-to-go.web.app`) bestätigen
    - _Requirements: 12.1, 12.2_

- [~] 18. Finaler Checkpoint — Alles verifizieren
  - Sicherstellen, dass alle Tests grün sind und die App über die öffentliche URL erreichbar ist; bei Fragen die Benutzerin fragen.

## Notes

- Mit `*` markierte Sub-Tasks sind optional (Tests) und können für einen schnelleren MVP übersprungen werden.
- Jede Aufgabe referenziert konkrete Requirements zur Nachvollziehbarkeit.
- Property-basierte Tests (mit `fast-check`, mind. 100 Iterationen) validieren universelle Korrektheits-Properties und referenzieren ihre Design-Property.
- Unit-/Beispieltests decken konkrete Szenarien und Randfälle ab; Integrations-/Mock-Tests die Firebase-/FCM-/E-Mail-Anbindung.
- Checkpoints sichern inkrementelle Validierung an sinnvollen Stellen.
- Reine Logik (Utilities, `CartService`, Builder) wird bewusst früh und Firebase-unabhängig getestet.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1", "3.3", "4.1", "13.1", "15.1", "15.2", "16.1"] },
    { "id": 3, "tasks": ["3.2", "3.4", "3.5", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "6.1", "6.3", "6.7", "7.1", "14.1", "13.2", "15.3"] },
    { "id": 4, "tasks": ["6.2", "6.4", "6.5", "6.6", "6.8", "7.2", "9.1", "14.2", "14.3", "14.4", "14.5"] },
    { "id": 5, "tasks": ["9.2", "9.4", "9.6", "9.7", "10.1", "10.3", "10.5", "10.6", "14.6"] },
    { "id": 6, "tasks": ["9.3", "9.5", "9.8", "9.9", "9.10", "10.2", "10.4", "10.7", "14.7"] },
    { "id": 7, "tasks": ["11.1"] },
    { "id": 8, "tasks": ["17.1"] }
  ]
}
```
