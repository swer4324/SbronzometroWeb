# Distribuzione della WebApp

La cartella da pubblicare è `dist`, generata con:

```powershell
npm install
npm test
npm run build
```

## Hosting consigliato: Cloudflare Pages

1. Crea un progetto Pages collegato al repository.
2. Imposta la cartella del progetto su `web`.
3. Usa `npm run build` come comando di build e `dist` come directory di output.
4. Attiva un dominio HTTPS. HTTPS è obbligatorio per service worker e installazione PWA.

Il file `public/_headers` aggiunge header di sicurezza e impedisce che service worker e manifest rimangano bloccati in una cache vecchia.

## Installazione su iPhone

1. Apri l'indirizzo HTTPS della WebApp in Safari.
2. Tocca **Condividi**.
3. Tocca **Aggiungi alla schermata Home**, poi **Aggiungi**.
4. Avvia Sbronzometro dalla nuova icona e crea il profilo.

I dati restano nell'IndexedDB di Safari sul singolo dispositivo. Prima di cancellare dati Safari o cambiare iPhone, scarica il backup JSON da **Altro > Backup locale**.

## Checklist prima di condividere

- Verificare creazione profilo, drink, pasto e refresh su Safari iPhone.
- Chiudere e riaprire la PWA dalla schermata Home verificando la persistenza.
- Attivare modalità aereo e verificare Home, cronologia e PDF legale.
- Esportare un backup, eliminare un dato di prova e reimportarlo.
- Verificare tema chiaro/scuro, lingua e layout con testo ingrandito.
