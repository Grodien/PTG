# Requirements Document

## Introduction

PapaToGo (PTG) ist eine Web-Applikation, mit der die schwangere Partnerin des Betreibers Dinge bei ihm "bestellen" kann. Die Bezahlung erfolgt mit "Müntschis" (Berndeutsch für Küsse) als fiktive Währung. Die Partnerin wählt Artikel aus Kategorien, legt sie in einen Warenkorb und bestellt diese anonym mit optionaler Notiz. Der Betreiber erhält bei jeder Bestellung eine Web-Push-Benachrichtigung auf sein privates Handy und optional eine E-Mail. Eine durch Google-Login geschützte Admin-Seite erlaubt dem Betreiber die Verwaltung von Kategorien, Artikeln und der Handy-Registrierung.

Das Frontend wird in Angular umgesetzt, die Oberfläche ist auf Deutsch mit berndeutschem Einschlag gehalten (ohne vollständige Internationalisierung oder Sprachumschalter). Das Backend basiert auf Firebase/Firestore mit Firebase Cloud Messaging (FCM) für Push-Benachrichtigungen und Firebase Functions für den E-Mail-Versand. Die Applikation wird auf Firebase Hosting deployed.

## Glossary

- **PTG_System**: Die gesamte PapaToGo-Web-Applikation bestehend aus Angular-Frontend, Firestore-Datenhaltung und Firebase Functions.
- **Besucherin**: Nicht authentifizierte Benutzerin, die Artikel auswählt und Bestellungen aufgibt.
- **Administrator**: Der per Google-Login authentifizierte Betreiber mit der E-Mail-Adresse thomas.bomatter@gmail.com.
- **Artikel**: Ein bestellbares Objekt mit den Attributen Titel, Beschreibung und Kosten in Müntschis.
- **Müntschi**: Fiktive Währungseinheit (Berndeutsch für Kuss), ausgedrückt als ganze, nicht-negative Zahl.
- **Kategorie**: Gruppierung, der ein Artikel zugeordnet ist (z. B. Essen, Trinken, Massage, Brettspiel).
- **Warenkorb**: Zwischenspeicher der von der Besucherin ausgewählten Artikel inklusive Mengen vor dem Absenden der Bestellung.
- **Bestellung**: Ein abgeschlossener Checkout-Vorgang mit einer Liste von Artikeln, der Gesamtsumme in Müntschis und einer optionalen Notiz.
- **Notiz**: Optionales Freitextfeld, das die Besucherin beim Checkout ausfüllen kann.
- **FCM_Token**: Das von Firebase Cloud Messaging erzeugte Geräte-Token des Administrator-Handys, das für den Versand von Push-Benachrichtigungen verwendet wird.
- **Push_Benachrichtigung**: Eine über Firebase Cloud Messaging an das registrierte Administrator-Handy zugestellte Mitteilung.
- **Bestätigungs_E-Mail**: Eine E-Mail an thomas.bomatter@bluewin.ch mit den Details einer Bestellung.
- **Admin_Seite**: Der durch Google-Login geschützte Bereich der Applikation zur Verwaltung von Kategorien, Artikeln und der Handy-Registrierung.
- **Service_Worker**: Das im Browser registrierte Skript, das Push-Benachrichtigungen empfängt.

## Requirements

### Requirement 1 — Kategorien anzeigen

**User Story:** Als Besucherin möchte ich Artikel nach Kategorien gegliedert sehen, damit ich schnell finde, was ich bestellen möchte.

#### Acceptance Criteria

1. THE PTG_System SHALL die verfügbaren Kategorien Essen, Trinken, Massage, Brettspiel, Umarmung/Kuscheln, Snacks/Süsses, Erledigung/Botengang, Entertainment/Film und Ruhe/Me-Time als Basisdatensatz bereitstellen.
2. WHEN die Besucherin die Startseite öffnet, THE PTG_System SHALL die Liste aller vorhandenen Kategorien anzeigen.
3. WHEN die Besucherin eine Kategorie auswählt, THE PTG_System SHALL alle dieser Kategorie zugeordneten Artikel anzeigen.
4. IF einer Kategorie kein Artikel zugeordnet ist, THEN THE PTG_System SHALL einen Hinweis anzeigen, dass die Kategorie keine Artikel enthält.

### Requirement 2 — Artikel anzeigen

**User Story:** Als Besucherin möchte ich zu jedem Artikel Titel, Beschreibung und Kosten sehen, damit ich entscheiden kann, was ich bestelle.

#### Acceptance Criteria

1. WHEN die Besucherin einen Artikel ansieht, THE PTG_System SHALL den Titel, die Beschreibung und die Kosten in Müntschis des Artikels anzeigen.
2. THE PTG_System SHALL die Kosten jedes Artikels als ganze, nicht-negative Zahl in Müntschis anzeigen.

### Requirement 3 — Warenkorb verwalten

**User Story:** Als Besucherin möchte ich mehrere Artikel in einen Warenkorb legen, damit ich sie gemeinsam bestellen kann.

#### Acceptance Criteria

1. WHEN die Besucherin bei einem Artikel die Aktion "in den Warenkorb" auslöst, THE PTG_System SHALL den Artikel dem Warenkorb hinzufügen.
2. WHEN die Besucherin denselben Artikel erneut in den Warenkorb legt, THE PTG_System SHALL die Menge dieses Artikels im Warenkorb um eins erhöhen.
3. WHEN die Besucherin einen Artikel aus dem Warenkorb entfernt, THE PTG_System SHALL den Artikel aus dem Warenkorb löschen.
4. THE PTG_System SHALL die Summe der Kosten aller Artikel im Warenkorb in Müntschis anzeigen.
5. WHILE der Warenkorb keine Artikel enthält, THE PTG_System SHALL die Checkout-Aktion deaktivieren.

### Requirement 4 — Bestellung aufgeben (Checkout)

**User Story:** Als Besucherin möchte ich meinen Warenkorb anonym mit einer optionalen Notiz abschicken, damit mein Partner die Bestellung erhält.

#### Acceptance Criteria

1. WHEN die Besucherin den Checkout startet, THE PTG_System SHALL ein optionales Freitextfeld für die Notiz anzeigen.
2. WHEN die Besucherin den Checkout abschliesst, THE PTG_System SHALL eine Bestellung mit allen Artikeln des Warenkorbs, der Gesamtsumme in Müntschis und der optionalen Notiz in Firestore speichern.
3. THE PTG_System SHALL Bestellungen ohne Angabe eines Namens oder einer Authentifizierung der Besucherin zulassen.
4. WHEN eine Bestellung erfolgreich gespeichert wurde, THE PTG_System SHALL der Besucherin eine Bestätigung der erfolgreichen Bestellung anzeigen.
5. WHEN eine Bestellung erfolgreich gespeichert wurde, THE PTG_System SHALL den Warenkorb leeren.
6. IF das Speichern der Bestellung fehlschlägt, THEN THE PTG_System SHALL der Besucherin eine Fehlermeldung anzeigen und den Warenkorb unverändert erhalten.

### Requirement 5 — Push-Benachrichtigung bei Bestellung

**User Story:** Als Administrator möchte ich bei jeder Bestellung eine Push-Benachrichtigung auf mein privates Handy erhalten, damit ich sofort informiert bin.

#### Acceptance Criteria

1. WHEN eine Bestellung erfolgreich gespeichert wurde und ein FCM_Token registriert ist, THE PTG_System SHALL eine Push_Benachrichtigung mit der Gesamtsumme in Müntschis und der Anzahl der Artikel über Firebase Cloud Messaging an das registrierte Administrator-Handy senden.
2. WHERE eine Notiz zur Bestellung erfasst wurde, THE PTG_System SHALL den Inhalt der Notiz in die Push_Benachrichtigung aufnehmen.
3. IF kein FCM_Token registriert ist, THEN THE PTG_System SHALL die Bestellung dennoch speichern und den Checkout als erfolgreich abschliessen.

### Requirement 6 — Bestätigungs-E-Mail (Best Effort)

**User Story:** Als Administrator möchte ich optional eine E-Mail mit den Bestelldetails erhalten, damit ich eine zusätzliche Aufzeichnung der Bestellung habe.

#### Acceptance Criteria

1. WHEN eine Bestellung erfolgreich gespeichert wurde, THE PTG_System SHALL versuchen, eine Bestätigungs_E-Mail mit der Artikelliste, der Gesamtsumme in Müntschis und der optionalen Notiz an thomas.bomatter@bluewin.ch zu senden.
2. IF der Versand der Bestätigungs_E-Mail fehlschlägt, THEN THE PTG_System SHALL den Fehler protokollieren und den Checkout als erfolgreich abgeschlossen behandeln.

### Requirement 7 — Admin-Zugang per Google-Login

**User Story:** Als Administrator möchte ich mich per Google-Login authentifizieren, damit nur ich die Verwaltungsfunktionen nutzen kann.

#### Acceptance Criteria

1. WHEN eine Person die Admin_Seite aufruft und nicht authentifiziert ist, THE PTG_System SHALL einen Google-Login anbieten.
2. WHEN sich eine Person mit der Google-E-Mail thomas.bomatter@gmail.com anmeldet, THE PTG_System SHALL Zugriff auf die Admin_Seite gewähren.
3. IF sich eine Person mit einer anderen Google-E-Mail als thomas.bomatter@gmail.com anmeldet, THEN THE PTG_System SHALL den Zugriff auf die Admin_Seite verweigern.
4. WHEN der Administrator die Abmeldung auslöst, THE PTG_System SHALL die Admin-Sitzung beenden und zum Google-Login zurückkehren.

### Requirement 8 — Kategorien verwalten

**User Story:** Als Administrator möchte ich Kategorien anlegen, bearbeiten und löschen, damit ich das Angebot aktuell halten kann.

#### Acceptance Criteria

1. WHEN der Administrator eine Kategorie mit einem Namen anlegt, THE PTG_System SHALL die Kategorie in Firestore speichern.
2. WHEN der Administrator den Namen einer Kategorie ändert, THE PTG_System SHALL den geänderten Namen in Firestore speichern.
3. WHEN der Administrator eine Kategorie löscht, THE PTG_System SHALL die Kategorie aus Firestore entfernen.
4. IF der Administrator eine Kategorie löscht, der Artikel zugeordnet sind, THEN THE PTG_System SHALL eine Bestätigung verlangen, bevor die Kategorie und deren zugeordnete Artikel entfernt werden.

### Requirement 9 — Artikel verwalten

**User Story:** Als Administrator möchte ich Artikel mit Titel, Beschreibung und Kosten anlegen, bearbeiten und löschen, damit die Besucherin aktuelle Angebote sieht.

#### Acceptance Criteria

1. WHEN der Administrator einen Artikel mit Titel, Beschreibung, Kosten in Müntschis und einer Kategorie anlegt, THE PTG_System SHALL den Artikel in Firestore speichern.
2. WHEN der Administrator einen Artikel bearbeitet, THE PTG_System SHALL die geänderten Attribute des Artikels in Firestore speichern.
3. WHEN der Administrator einen Artikel löscht, THE PTG_System SHALL den Artikel aus Firestore entfernen.
4. IF der Administrator einen Artikel ohne Titel oder ohne Kosten speichert, THEN THE PTG_System SHALL die Speicherung ablehnen und einen Hinweis auf die fehlenden Pflichtangaben anzeigen.
5. IF der Administrator Kosten speichert, die keine ganze, nicht-negative Zahl sind, THEN THE PTG_System SHALL die Speicherung ablehnen und einen Hinweis auf den gültigen Wertebereich anzeigen.

### Requirement 10 — Handy für Push registrieren

**User Story:** Als Administrator möchte ich mein Handy für Push-Benachrichtigungen registrieren, damit ich Bestellungen auf meinem Gerät empfange.

#### Acceptance Criteria

1. WHEN der Administrator auf der Admin_Seite die Handy-Registrierung auslöst, THE PTG_System SHALL einen Service_Worker registrieren und ein FCM_Token über Firebase Cloud Messaging anfordern.
2. WHEN ein FCM_Token erzeugt wurde, THE PTG_System SHALL das FCM_Token in Firestore speichern.
3. IF der Administrator die Berechtigung für Benachrichtigungen verweigert, THEN THE PTG_System SHALL einen Hinweis anzeigen, dass ohne Berechtigung keine Push_Benachrichtigungen zugestellt werden.

### Requirement 11 — Oberfläche auf Deutsch mit berndeutschem Einschlag

**User Story:** Als Besucherin möchte ich eine deutschsprachige Oberfläche mit berndeutschem Einschlag sehen, damit sich die Anwendung persönlich und vertraut anfühlt.

#### Acceptance Criteria

1. THE PTG_System SHALL alle für die Besucherin sichtbaren Texte auf Deutsch mit berndeutschem Einschlag darstellen.
2. THE PTG_System SHALL die Währungseinheit durchgehend als "Müntschi" (Einzahl) beziehungsweise "Müntschis" (Mehrzahl) bezeichnen.

### Requirement 12 — Deployment auf Firebase

**User Story:** Als Administrator möchte ich die Applikation auf Firebase bereitstellen, damit sie über eine öffentliche URL erreichbar ist.

#### Acceptance Criteria

1. THE PTG_System SHALL auf Firebase Hosting bereitgestellt werden.
2. WHEN das Deployment abgeschlossen ist, THE PTG_System SHALL über eine öffentliche URL erreichbar sein.
