# Häkel-Anleitungen

Web-App zum Speichern, Zerlegen und Nachhäkeln von Anleitungen (Deutsch und Englisch).

## Starten

```powershell
copy .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

Dann [http://localhost:3000](http://localhost:3000) öffnen.

Die Datenbank läuft über MySQL (`DATABASE_URL`). Auf Hostinger liegt sie außerhalb des Deploy-Ordners und bleibt beim Neu-Bauen erhalten.

Produktion:

```powershell
npm run build
npm start
```

## Anmeldung

Beim Öffnen wird ein **Name** abgefragt. Nur angelegte Namen kommen weiter; jede Person sieht nur die eigenen Anleitungen.

Diskreter Admin-Zugang: auf der Anmeldeseite den kleinen Punkt unten antippen, oder `/verwaltung`. Kennwort über die Umgebungsvariable `ADMIN_PASSWORD` (Vorschlag: `Admin17`). Dort Benutzer anlegen und löschen.

## Nutzung

1. **Übersicht** – gespeicherte Anleitungen. Beim Öffnen: *Weitermachen* oder *Neu anfangen*.
2. **Neue Anleitung** – Name + Text einfügen oder PDF importieren. Vorschau zerlegt den Text in Teile und Schritte.
3. **Nachhäkeln** – Liste links, Anweisung rechts. Wiederholungs- und Maschenzähler, Hinweise über **!**.
