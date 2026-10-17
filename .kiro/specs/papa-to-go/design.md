# Design Document — PapaToGo (PTG)

## Übersicht

PapaToGo ist eine Single-Page-Web-Applikation auf Basis von **Angular 18+** (Standalone-Komponenten) mit einem **Firebase/Firestore**-Backend. Besucherinnen stöbern ohne Anmeldung durch Kategorien und Artikel, legen Artikel in einen Warenkorb und senden anonym eine Bestellung ab. Der Administrator (ausschliesslich `thomas.bomatter@gmail.com`) verwaltet über einen Google-Login-geschützten Admin-Bereich Kategorien, Artikel und die Handy-Registrierung für Push-Benachrichtigungen.

Bei jeder neuen Bestellung löst ein Firestore-`onCreate`-Trigger (Firebase Functions, TypeScript) zwei Aktionen aus:
1. Eine **Push-Benachrichtigung** via Firebase Cloud Messaging (FCM) an das registrierte Administrator-Token.
2. Eine **Best-Effort-E-Mail** an `thomas.bomatter@bluewin.ch` (via Nodemailer/SMTP).

Die Oberfläche ist auf Deutsch mit berndeutschem Einschlag gehalten. Die Fantasiewährung "Müntschi" (Plural "Müntschis") wird durchgängig als ganze, nicht-negative Zahl geführt. Das Deployment erfolgt auf **Firebase Hosting**.

### Technischer Rahmen

| Aspekt | Wahl |
|---|---|
| Frontend | Angular 18+, Standalone Components, Signals, AngularFire |
| Styling | Angular Material oder leichtgewichtiges SCSS (herzlich-warme, verspielte Optik) |
| Backend | Firebase (Firestore, Auth, Cloud Messaging, Functions, Hosting) |
| Functions-Runtime | Node.js / TypeScript (2nd Gen Cloud Functions) |
| Auth-Provider | Google (Firebase Authentication) |
| Push | Firebase Cloud Messaging (Web Push, VAPID, Service Worker) |
| E-Mail | Nodemailer über SMTP (Bluewin/GMX o. ä.), Zugangsdaten als Functions-Secrets |
| Repository | `git@github.com:Grodien/PTG.git` |

> Hinweis: Das Firebase-Projekt existiert noch nicht und wird im Rahmen des Deployments per `firebase CLI` (`firebase projects:create` / `firebase init`) angelegt.

---

## Architektur

### Systemüberblick

```
┌─────────────────────────────────────────────────────────────┐
│                      Angular SPA (Hosting)                    │
│                                                               │
│  Besucherinnen-Bereich            Admin-Bereich (AuthGuard)   │
│  ├─ KategorieListe                ├─ Login (Google)           │
│  ├─ ArtikelListe                  ├─ KategorieVerwaltung      │
│  ├─ Warenkorb                     ├─ ArtikelVerwaltung        │
│  └─ Checkout                      └─ HandyRegistrierung (FCM) │
│                                                               │
│         │  AngularFire (SDK)                                  │
└─────────┼─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                         Firebase                              │
│                                                               │
│  Firestore            Auth (Google)      Cloud Messaging      │
│  ├─ categories        └─ Admin-Gate      └─ Web Push          │
│  ├─ items                                                     │
│  ├─ orders ──onCreate──► Functions (TS)                       │
│  └─ pushTokens                 ├─ sendPush (FCM)              │
│                                └─ sendEmail (Nodemailer/SMTP) │
│                                                               │
│  Security Rules: Admin-only writes, public order create       │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
   Service Worker (firebase-messaging-sw.js)  ──►  Admin-Handy
```

### Schichten

- **Präsentationsschicht** (Angular-Komponenten): reine Darstellung und Interaktion, konsumiert Signals aus den Services.
- **Service-/Zustandsschicht** (Angular-Services): Warenkorb-Logik (rein, in-memory), Firestore-Zugriff über AngularFire, Auth-Status, FCM-Registrierung.
- **Datenschicht** (Firestore): Kategorien, Artikel, Bestellungen, Push-Token.
- **Backend-Logik** (Cloud Functions): reagiert auf neue Bestellungen (Push + E-Mail).

Die reine Warenkorb- und Validierungslogik wird bewusst von Firebase-Abhängigkeiten getrennt, damit sie isoliert und property-basiert getestet werden kann.

---

## Datenmodelle

Alle Beträge in Müntschis sind `number` mit der Invariante **ganzzahlig und ≥ 0**.

### Firestore-Collections

#### `categories/{categoryId}`
```typescript
interface Category {
  id: string;          // Firestore-Dokument-ID
  name: string;        // z. B. "Massage"
  order?: number;      // optionale Sortierreihenfolge
  createdAt: Timestamp;
}
```

#### `items/{itemId}`
```typescript
interface Item {
  id: string;
  categoryId: string;  // Referenz auf categories/{id}
  title: string;       // Pflichtfeld
  description: string; // optional, Default ""
  cost: number;        // Pflichtfeld, Müntschis, integer >= 0
  createdAt: Timestamp;
}
```

#### `orders/{orderId}`
```typescript
interface OrderLine {
  itemId: string;
  title: string;       // denormalisiert (Snapshot zum Bestellzeitpunkt)
  cost: number;        // Stückpreis in Müntschis zum Bestellzeitpunkt
  quantity: number;    // >= 1
}

interface Order {
  id: string;
  lines: OrderLine[];
  total: number;       // Summe cost*quantity in Müntschis
  itemCount: number;   // Summe aller quantities
  note: string | null; // optionale Notiz der Besucherin
  createdAt: Timestamp;
  pushSent?: boolean;  // vom Backend gesetzt (Best-Effort-Status)
  emailSent?: boolean; // vom Backend gesetzt (Best-Effort-Status)
}
```

Bestelllinien werden **denormalisiert** gespeichert (Titel und Stückpreis als Snapshot), damit eine Bestellung auch nach Änderung/Löschung eines Artikels nachvollziehbar bleibt.

#### `pushTokens/admin` (einzelnes Dokument)
```typescript
interface PushTokenDoc {
  token: string;       // aktuelles FCM-Token des Admin-Geräts
  updatedAt: Timestamp;
}
```

Ein einzelnes, fest benanntes Dokument (`admin`) genügt, da nur ein Administrator-Gerät registriert wird. Eine erneute Registrierung überschreibt das Token.

### In-Memory-Modell (Frontend-Warenkorb)

```typescript
interface CartLine {
  item: Item;
  quantity: number; // >= 1
}

interface CartState {
  lines: CartLine[];
}
```

Der Warenkorb lebt nur im Browser (Signal im `CartService`, optional in `localStorage` gespiegelt) und wird erst beim Checkout in eine `Order` überführt.

---

## Komponentenstruktur (Angular)

Standalone-Komponenten, Routing über `provideRouter`. Firebase via `provideFirebaseApp`, `provideFirestore`, `provideAuth`, `provideMessaging`.

```
src/app/
├── app.config.ts                 // Provider (Firebase, Router, Messaging)
├── app.routes.ts                 // Routen inkl. adminGuard
├── core/
│   ├── models/                   // Category, Item, Order, CartState ...
│   ├── services/
│   │   ├── category.service.ts   // CRUD categories
│   │   ├── item.service.ts       // CRUD items, Query nach categoryId
│   │   ├── cart.service.ts       // reine Warenkorb-Logik (Signals)
│   │   ├── order.service.ts      // Checkout: cart -> order (Firestore)
│   │   ├── auth.service.ts       // Google-Login, isAdmin()
│   │   └── messaging.service.ts  // FCM-Registrierung, Token speichern
│   ├── guards/
│   │   └── admin.guard.ts        // CanActivate: nur Admin-E-Mail
│   └── util/
│       ├── currency.ts           // formatMuentschi(amount)
│       └── validation.ts         // validateItem(), validateCost()
├── shop/                         // Besucherinnen-Bereich
│   ├── category-list/
│   ├── item-list/
│   ├── item-card/
│   ├── cart/
│   └── checkout/
├── admin/                        // Admin-Bereich
│   ├── admin-shell/
│   ├── login/
│   ├── category-admin/
│   ├── item-admin/
│   └── device-registration/
└── shared/
    ├── muentschi-pipe.ts         // Pipe nutzt formatMuentschi
    └── ui/                       // Buttons, Dialog (Bestätigung) ...
```

### Zentrale Komponenten und Verantwortlichkeiten

| Komponente | Verantwortung | Requirements |
|---|---|---|
| `CategoryListComponent` | Zeigt alle Kategorien; Auswahl navigiert zur Artikelliste | 1.2 |
| `ItemListComponent` | Zeigt Artikel der gewählten Kategorie; Empty-State-Hinweis | 1.3, 1.4 |
| `ItemCardComponent` | Titel, Beschreibung, Kosten (Müntschi-Pipe); "In Warenkorb" | 2.1, 2.2, 3.1 |
| `CartComponent` | Warenkorb-Linien, Menge, Entfernen, Summe, Checkout-Enable | 3.2–3.5 |
| `CheckoutComponent` | Notizfeld, Absenden, Erfolg/Fehler-Feedback | 4.1–4.6 |
| `LoginComponent` | Google-Login-Button | 7.1 |
| `AdminShellComponent` | Rahmen, Logout | 7.4 |
| `CategoryAdminComponent` | CRUD Kategorien, Bestätigungsdialog bei Kaskade | 8.1–8.4 |
| `ItemAdminComponent` | CRUD Artikel, Formularvalidierung | 9.1–9.5 |
| `DeviceRegistrationComponent` | SW registrieren, Token anfordern/speichern, Hinweise | 10.1–10.3 |

---

## Schnittstellen (Service-Verträge)

### CartService (rein, testbar)
```typescript
class CartService {
  readonly lines: Signal<CartLine[]>;
  readonly total: Signal<number>;       // Summe cost*quantity
  readonly itemCount: Signal<number>;
  readonly canCheckout: Signal<boolean>; // false, wenn leer

  add(item: Item): void;      // neu -> quantity 1; vorhanden -> +1
  remove(itemId: string): void;
  clear(): void;
  toOrderDraft(note: string | null): OrderDraft; // lines, total, itemCount, note
}
```

### OrderService
```typescript
class OrderService {
  // speichert Bestellung; wirft bei Fehler -> Checkout behandelt Fehlerfall
  create(draft: OrderDraft): Promise<string>; // orderId
}
```

### AuthService
```typescript
class AuthService {
  readonly user: Signal<FirebaseUser | null>;
  readonly isAdmin: Signal<boolean>; // user?.email === ADMIN_EMAIL
  loginWithGoogle(): Promise<void>;
  logout(): Promise<void>;
}

const ADMIN_EMAIL = 'thomas.bomatter@gmail.com';
```

### MessagingService
```typescript
class MessagingService {
  // registriert SW, fragt Permission + Token an, speichert Token
  registerDevice(): Promise<'granted' | 'denied' | 'unsupported'>;
}
```

### Utility-Funktionen (rein)
```typescript
function formatMuentschi(amount: number): string;
// amount === 1 -> "1 Müntschi", sonst "{amount} Müntschis"

function validateCost(input: unknown): { ok: true; value: number } | { ok: false; reason: string };
// ok nur, wenn Integer und >= 0

function validateItem(input: ItemInput): ValidationResult;
// Pflicht: title (nicht leer), cost (gültig per validateCost)
```

---

## Firestore Security Rules

Admin-Identität wird über die authentifizierte E-Mail geprüft. Schreibzugriff auf Stammdaten ist admin-only; Bestellungen dürfen öffentlich angelegt, aber nur vom Admin gelesen werden; Push-Token sind admin-only.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    function isAdmin() {
      return request.auth != null
        && request.auth.token.email == 'thomas.bomatter@gmail.com'
        && request.auth.token.email_verified == true;
    }

    // Stammdaten: öffentlich lesbar, nur Admin schreibt
    match /categories/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /items/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Bestellungen: öffentlich anlegen, nur Admin lesen; kein Update/Delete vom Client
    match /orders/{id} {
      allow create: if isValidOrder(request.resource.data);
      allow read:   if isAdmin();
      allow update, delete: if false; // nur Backend (Admin SDK) ändert Status
    }

    // Push-Token: nur Admin
    match /pushTokens/{id} {
      allow read, write: if isAdmin();
    }

    function isValidOrder(d) {
      return d.total is int && d.total >= 0
        && d.itemCount is int && d.itemCount >= 1
        && d.lines is list
        && (d.note == null || d.note is string);
    }
  }
}
```

> Die Status-Felder `pushSent`/`emailSent` setzt ausschliesslich die Cloud Function über das Admin SDK; Client-Updates auf `orders` sind daher gesperrt.

---

## Cloud Functions (TypeScript)

### Struktur
```
functions/
├── src/
│   ├── index.ts            // Export der Trigger
│   ├── onOrderCreated.ts   // Firestore onCreate-Trigger
│   ├── push.ts            // FCM-Payload bauen + senden
│   └── email.ts           // Nodemailer-Transport + Body bauen
├── package.json
└── tsconfig.json
```

### Trigger: `onOrderCreated`
```typescript
// Pseudocode-nahe Signatur (2nd Gen)
export const onOrderCreated = onDocumentCreated('orders/{orderId}', async (event) => {
  const order = event.data?.data() as Order;

  // 1) Push (Best Effort)
  try {
    const tokenDoc = await db.doc('pushTokens/admin').get();
    const token = tokenDoc.exists ? tokenDoc.get('token') : null;
    if (token) {
      await sendPush(token, buildPushPayload(order));
      await event.data!.ref.update({ pushSent: true });
    }
    // kein Token -> nichts tun, Bestellung bleibt gültig (Req 5.3)
  } catch (e) {
    logger.error('Push fehlgeschlagen', e); // Best Effort
  }

  // 2) E-Mail (Best Effort)
  try {
    await sendEmail(buildEmailBody(order));
    await event.data!.ref.update({ emailSent: true });
  } catch (e) {
    logger.error('E-Mail fehlgeschlagen', e); // Req 6.2
  }
});
```

### Push-Payload-Builder (rein, testbar)
```typescript
function buildPushPayload(order: Order): MessagePayload {
  const title = 'Neui Bestellig! 🎁';
  const base = `${order.itemCount} Artikel · ${formatMuentschi(order.total)}`;
  const body = order.note ? `${base}\nNotiz: ${order.note}` : base; // Req 5.1, 5.2
  return { notification: { title, body } };
}
```

### E-Mail-Body-Builder (rein, testbar)
```typescript
function buildEmailBody(order: Order): { subject: string; text: string } {
  const lines = order.lines
    .map(l => `- ${l.quantity}× ${l.title} (${formatMuentschi(l.cost)})`)
    .join('\n');
  const text =
    `Neui Bestellig:\n${lines}\n\nTotal: ${formatMuentschi(order.total)}` +
    (order.note ? `\n\nNotiz: ${order.note}` : ''); // Req 6.1
  return { subject: 'PapaToGo — neui Bestellig', text };
}
```

### E-Mail-Transport (Nodemailer/SMTP)
```typescript
// SMTP-Zugangsdaten als Secrets (firebase functions:secrets:set)
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
const transport = nodemailer.createTransport({ host, port, auth: { user, pass } });
await transport.sendMail({
  from: SMTP_USER,
  to: 'thomas.bomatter@bluewin.ch',
  subject, text,
});
```

> **Voraussetzung E-Mail:** Es werden gültige SMTP-Zugangsdaten benötigt (z. B. Bluewin/GMX-Konto oder ein Transaktions-Mail-Dienst). Diese werden als Firebase-Functions-Secrets hinterlegt, nicht im Code. Als Alternative kann die Firebase-Extension "Trigger Email" verwendet werden; der Best-Effort-Charakter (Req 6.2) bleibt in beiden Fällen gleich.

---

## Push- und E-Mail-Flow

### Registrierung (Admin, einmalig pro Gerät)
```
Admin öffnet DeviceRegistration
  → MessagingService.registerDevice()
      → navigator.serviceWorker.register('firebase-messaging-sw.js')
      → Notification.requestPermission()
          granted → getToken(messaging, { vapidKey, serviceWorkerRegistration })
                   → Firestore set pushTokens/admin { token, updatedAt }  (Req 10.1, 10.2)
          denied  → Hinweis "Ohni Bewilligung chöi mir der kener Push schicke" (Req 10.3)
```

### Service Worker (`src/firebase-messaging-sw.js`)
Separates Skript im Hosting-Root, importiert das Firebase-Messaging-Compat-SDK, initialisiert die App mit der (öffentlichen) Firebase-Config und behandelt `onBackgroundMessage`, um Benachrichtigungen im Hintergrund anzuzeigen.

### Bestell-Benachrichtigung (bei jeder Bestellung)
```
Checkout speichert Order in Firestore
  → onOrderCreated-Trigger feuert
      → Token vorhanden? → FCM sendet Push an Admin-Gerät (Req 5.1, 5.2)
      → Token fehlt?     → Order bleibt gültig, kein Fehler (Req 5.3)
      → E-Mail-Versuch (Best Effort)  (Req 6.1, 6.2)
```

---

## Fehlerbehandlung

| Fall | Verhalten |
|---|---|
| Checkout-Speichern schlägt fehl (4.6) | Fehlermeldung anzeigen, Warenkorb unverändert lassen (kein `clear()`) |
| Checkout erfolgreich (4.4, 4.5) | Erfolgsbestätigung, Warenkorb leeren |
| Kein FCM-Token (5.3) | Bestellung bleibt gültig; Function überspringt Push ohne Fehler |
| Push-Versand fehlschlägt | Fehler loggen; beeinflusst Bestellung nicht (Best Effort) |
| E-Mail-Versand fehlschlägt (6.2) | Fehler loggen; Checkout gilt als erfolgreich |
| Nicht-Admin-Login (7.3) | Zugriff verweigern, Hinweis, Abmeldung/Rückkehr zum Login |
| Ungültige Artikel-Eingabe (9.4, 9.5) | Speicherung ablehnen, Hinweis auf fehlende/ungültige Felder |
| Kategorie mit Artikeln löschen (8.4) | Bestätigungsdialog; bei Bestätigung Kaskaden-Löschung (Batch) |
| Notification-Permission verweigert (10.3) | Hinweis anzeigen, kein Token speichern |

Validierung findet doppelt statt: im Frontend (`validation.ts`) für sofortiges Feedback und in den Security Rules für Integrität.

---

## Deployment-Ansatz

Da noch kein Firebase-Projekt existiert, wird es per CLI angelegt und konfiguriert.

```bash
# 1. Firebase CLI anmelden
firebase login

# 2. Projekt anlegen (CLI)
firebase projects:create ptg-papa-to-go --display-name "PapaToGo"

# 3. Im Repo initialisieren
firebase init hosting firestore functions
#   - Hosting: Angular-Build-Output (dist/ptg/browser) als public, SPA-Rewrite auf /index.html
#   - Firestore: Rules + Indexes
#   - Functions: TypeScript

# 4. Google-Auth-Provider in der Firebase Console aktivieren
#    Firestore-Datenbank anlegen (Production-Mode mit obigen Rules)

# 5. Secrets für E-Mail setzen
firebase functions:secrets:set SMTP_HOST
firebase functions:secrets:set SMTP_PORT
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS

# 6. Seed der Basiskategorien (Admin-Skript oder einmaliger Import)

# 7. Build + Deploy
ng build --configuration production
firebase deploy   # Hosting + Firestore Rules + Functions
```

- **Hosting-Konfiguration:** `firebase.json` mit `public: dist/ptg/browser`, SPA-Rewrite aller Routen auf `/index.html`, Ausnahme für `firebase-messaging-sw.js`.
- **Öffentliche URL:** nach dem Deploy erreichbar unter `https://ptg-papa-to-go.web.app` (bzw. der von Firebase vergebenen Hosting-Domain). Diese URL erfüllt Req 12.1/12.2.
- **CI/Repo:** Code liegt in `git@github.com:Grodien/PTG.git`; `.firebaserc` verweist auf das angelegte Projekt.

### Basiskategorien (Seed, Req 1.1)
Essen · Trinken · Massage · Brettspiel · Umarmung/Kuscheln · Snacks/Süsses · Erledigung/Botengang · Entertainment/Film · Ruhe/Me-Time

Der Seed wird einmalig über ein Admin-Skript (Admin SDK) oder einen Firestore-Import erstellt.

---

## Correctness Properties

*Eine Property ist eine Eigenschaft oder ein Verhalten, das über alle gültigen Ausführungen des Systems hinweg gelten soll — eine formale Aussage darüber, was das System tun soll. Properties bilden die Brücke zwischen menschenlesbaren Spezifikationen und maschinell verifizierbaren Korrektheitsgarantien.*

### Property 1: Kategorie-Anzeige ist vollständig

*Für jede* Menge von Kategorien im Datenbestand enthält die angezeigte Kategorie-Liste genau diese Kategorien (keine fehlt, keine wird hinzuerfunden).

**Validates: Requirements 1.2**

### Property 2: Artikelfilterung nach Kategorie

*Für jeden* Artikelbestand und jede ausgewählte Kategorie enthält die Artikelanzeige genau die Artikel, deren `categoryId` der ausgewählten Kategorie entspricht.

**Validates: Requirements 1.3, 1.4**

### Property 3: Artikel-Darstellung enthält alle Pflichtangaben

*Für jeden* Artikel enthält die gerenderte Darstellung dessen Titel, Beschreibung und die Kosten in Müntschis.

**Validates: Requirements 2.1**

### Property 4: Kosten-Invariante und -Validierung

*Für jeden* Eingabewert für Kosten akzeptiert die Validierung genau dann, wenn der Wert eine ganze, nicht-negative Zahl ist; jeder gespeicherte Artikel erfüllt damit `cost` ist Integer und `cost >= 0`.

**Validates: Requirements 2.2, 9.5**

### Property 5: Hinzufügen zum Warenkorb

*Für jeden* Warenkorb und jeden Artikel gilt nach dem Hinzufügen: Der Artikel ist im Warenkorb vorhanden, und die Gesamtmenge (`itemCount`) ist um eins grösser als zuvor.

**Validates: Requirements 3.1**

### Property 6: Mehrfaches Hinzufügen erhöht nur die Menge

*Für jeden* Warenkorb und jeden Artikel gilt: Zweimaliges Hinzufügen desselben Artikels ergibt genau eine Warenkorb-Linie für diesen Artikel mit Menge 2; die Anzahl der Linien bleibt gegenüber einmaligem Hinzufügen unverändert.

**Validates: Requirements 3.2**

### Property 7: Entfernen ist Umkehrung des Hinzufügens

*Für jeden* Warenkorb und jeden Artikel gilt: Einen Artikel hinzufügen und anschliessend (vollständig) entfernen führt den Warenkorb in seinen ursprünglichen Inhalt zurück.

**Validates: Requirements 3.3**

### Property 8: Warenkorbsumme ist konsistent

*Für jeden* Warenkorb entspricht die angezeigte Summe der Summe über alle Linien von `item.cost * quantity` in Müntschis.

**Validates: Requirements 3.4**

### Property 9: Checkout-Verfügbarkeit hängt an Warenkorb-Füllung

*Für jeden* Warenkorb ist die Checkout-Aktion genau dann deaktiviert, wenn der Warenkorb keine Artikel enthält.

**Validates: Requirements 3.5**

### Property 10: Bestellungsentwurf spiegelt den Warenkorb

*Für jeden* Warenkorb und jede Notiz enthält die erzeugte Bestellung alle Artikel des Warenkorbs (mit Mengen), eine `total`, die der Warenkorbsumme entspricht, und die angegebene Notiz.

**Validates: Requirements 4.2**

### Property 11: Erfolgreicher Checkout leert den Warenkorb

*Für jeden* Warenkorb gilt: Nach einem erfolgreichen Checkout ist der Warenkorb leer.

**Validates: Requirements 4.5**

### Property 12: Fehlgeschlagener Checkout lässt den Warenkorb unverändert

*Für jeden* Warenkorb gilt: Schlägt das Speichern der Bestellung fehl, ist der Warenkorbinhalt identisch zu vorher, und es wird ein Fehler signalisiert.

**Validates: Requirements 4.6**

### Property 13: Push-Payload enthält Summe und Artikelanzahl

*Für jede* Bestellung enthält die erzeugte Push-Payload die Gesamtsumme in Müntschis und die Anzahl der Artikel.

**Validates: Requirements 5.1**

### Property 14: Notiz wird in Push-Payload aufgenommen

*Für jede* Bestellung mit einer Notiz enthält die erzeugte Push-Payload den Inhalt dieser Notiz.

**Validates: Requirements 5.2**

### Property 15: E-Mail-Inhalt enthält alle Bestelldetails

*Für jede* Bestellung enthält der erzeugte E-Mail-Text die Artikelliste, die Gesamtsumme in Müntschis und — falls vorhanden — die Notiz.

**Validates: Requirements 6.1**

### Property 16: Admin-Zugriff nur für die Admin-E-Mail

*Für jede* E-Mail-Adresse wird Admin-Zugriff genau dann gewährt, wenn die Adresse `thomas.bomatter@gmail.com` entspricht.

**Validates: Requirements 7.2, 7.3**

### Property 17: Kategorie-CRUD Round-Trip

*Für jeden* gültigen Kategorienamen gilt: Anlegen und anschliessendes Lesen liefert eine Kategorie mit diesem Namen; eine Umbenennung mit anschliessendem Lesen liefert den neuen Namen; nach dem Löschen ist die Kategorie nicht mehr vorhanden.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 18: Kaskaden-Löschung hinterlässt keine Waisen

*Für jede* Kategorie mit zugeordneten Artikeln gilt: Nach bestätigter Löschung sind die Kategorie und alle Artikel mit dieser `categoryId` entfernt (es bleiben keine verwaisten Artikel zurück).

**Validates: Requirements 8.4**

### Property 19: Artikel-CRUD Round-Trip

*Für jeden* gültigen Artikel gilt: Anlegen und anschliessendes Lesen liefert einen Artikel mit identischem Titel, Beschreibung, Kosten und `categoryId`; eine Bearbeitung mit anschliessendem Lesen liefert die geänderten Attribute; nach dem Löschen ist der Artikel nicht mehr vorhanden.

**Validates: Requirements 9.1, 9.2, 9.3**

### Property 20: Pflichtfeld-Validierung bei Artikeln

*Für jede* Artikel-Eingabe ohne Titel oder ohne Kosten lehnt die Validierung die Speicherung ab.

**Validates: Requirements 9.4**

### Property 21: Korrekte Pluralisierung der Währung

*Für jede* nicht-negative ganze Zahl verwendet die formatierte Ausgabe die Einzahl "Müntschi" genau dann, wenn der Betrag gleich 1 ist, andernfalls die Mehrzahl "Müntschis".

**Validates: Requirements 11.2**

---

## Teststrategie

**Duale Teststrategie:** Property-basierte Tests für universelle Eigenschaften, Unit-/Beispieltests für konkrete Szenarien und Randfälle, Integrationstests für Firebase-/FCM-/E-Mail-Anbindung.

### Property-basierte Tests
- Mindestens 100 Iterationen pro Property-Test (z. B. mit `fast-check`).
- Jeder Property-Test referenziert seine Design-Property im Format: **Feature: papa-to-go, Property {Nummer}: {Property-Text}**.
- Fokus auf reine Logik: `CartService`, `formatMuentschi`, `validateItem`/`validateCost`, `buildPushPayload`, `buildEmailBody`, `isAdmin`-Prädikat und die Order-Draft-Erzeugung.

### Beispiel-/Unit-Tests (konkrete Szenarien, Req-Zuordnung)
- 4.1 Notizfeld wird im Checkout gerendert.
- 4.3 Bestellung ohne Namen/ohne Auth anlegbar.
- 4.4 Erfolgsbestätigung nach Speichern.
- 7.1 Unauthentifizierter Admin-Aufruf zeigt Google-Login.
- 7.4 Logout beendet Sitzung und zeigt Login.
- 10.3 Verweigerte Benachrichtigungs-Berechtigung zeigt Hinweis, speichert kein Token.
- 8.4 Bestätigungsdialog vor Kaskaden-Löschung.

### Integrations-/Smoke-Tests (nicht PBT-geeignet)
- 1.1 Seed enthält alle neun Basiskategorien (Smoke).
- 5.3 Kein Token → Order bleibt gültig, Function ohne Fehler (Integration/Mock).
- 6.2 E-Mail-Transport wirft → Function loggt und gilt als erfolgreich (Mock).
- 10.1/10.2 SW-Registrierung + Token-Persistenz (Integration/Mock der FCM-APIs).
- 11.1 Deutsch mit berndeutschem Einschlag — manuelle Review (nicht sinnvoll automatisierbar).
- 12.1/12.2 Deployment auf Firebase Hosting, öffentliche URL erreichbar (Smoke, manuell).

### Security-Rules-Tests
Mit dem Firestore-Emulator (`@firebase/rules-unit-testing`): öffentliches Anlegen von Bestellungen erlaubt; Lesen von `orders`/`pushTokens` sowie Schreiben von `categories`/`items` nur für die Admin-E-Mail; Client-Update/Delete auf `orders` abgelehnt.
